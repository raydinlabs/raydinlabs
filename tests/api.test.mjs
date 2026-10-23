import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import worker,{passwordHash,validateEntry,safeURL} from '../server/worker.js';
function database() {
 const db=new DatabaseSync(':memory:');
 return {
  exec: sql=>db.exec(sql),
  prepare(sql) {
   return {bind(...args) {
    const statement=db.prepare(sql);
    return {
     async first(){return statement.get(...args)||null;},
     async all(){return {results:statement.all(...args)};},
     async run(){const r=statement.run(...args);return {meta:{changes:Number(r.changes)}};}
    };
   }};
  }
 };
}
const origin='https://raydin.test';
function request(path,method='GET',data,token,extra={}){return new Request(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(token?{Cookie:token}:{}),...extra},...(data?{body:JSON.stringify(data)}:{})});}
async function environment(){const DB=database();DB.exec(await readFile('migrations/0001_content.sql','utf8'));DB.exec(await readFile('migrations/0003_page_editor.sql','utf8'));return {DB,ADMIN_EMAIL:'raydinlabs@gmail.com',ADMIN_PASSWORD_HASH:'testing-salt:'+await passwordHash('test-only-password-long','testing-salt')};}
async function login(env){const response=await worker.fetch(request('/api/admin/login','POST',{email:env.ADMIN_EMAIL,password:'test-only-password-long'}),env);assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);return response.headers.get('set-cookie').split(';')[0];}
test('login rejects invalid credentials and cross-origin requests; sessions revoke on logout',async()=>{const env=await environment();let response=await worker.fetch(request('/api/admin/login','POST',{email:env.ADMIN_EMAIL,password:'wrong-password-long'}),env);assert.equal(response.status,401);response=await worker.fetch(request('/api/admin/login','POST',{},null,{Origin:'https://other.test'}),env);assert.equal(response.status,403);const token=await login(env);assert.equal((await worker.fetch(request('/api/admin/session','GET',null,token),env)).status,200);await worker.fetch(request('/api/admin/logout','POST',{},token),env);assert.equal((await worker.fetch(request('/api/admin/session','GET',null,token),env)).status,401);});
test('CMS drafts stay private, publishing works, stale edits fail, delete removes entry',async()=>{const env=await environment(),token=await login(env);assert.equal((await worker.fetch(request('/api/admin/entries','POST',{}),env)).status,401);let response=await worker.fetch(request('/api/admin/entries','POST',{kind:'blog',title:'Draft title',body:'Private content',published:0},token),env);assert.equal(response.status,200);let entry=(await response.json()).entry;assert.deepEqual((await (await worker.fetch(request('/api/entries?kind=blog'),env)).json()).entries,[]);assert.equal((await worker.fetch(request('/api/entry/'+entry.id),env)).status,404);response=await worker.fetch(request('/api/admin/entries','POST',{...entry,published:1},token),env);assert.equal(response.status,200);const published=(await response.json()).entry;assert.equal((await worker.fetch(request('/api/entry/'+entry.id),env)).status,200);response=await worker.fetch(request('/api/admin/entries','POST',{...entry,updated_at:'stale',title:'Bad overwrite'},token),env);assert.equal(response.status,409);response=await worker.fetch(request('/api/admin/entries/'+entry.id,'DELETE',{updated_at:published.updated_at},token),env);assert.equal(response.status,200);assert.equal((await worker.fetch(request('/api/entry/'+entry.id),env)).status,404);});
test('entry validation rejects executable URLs and oversized input',()=>{assert.throws(()=>safeURL('javascript:alert(1)'));assert.throws(()=>safeURL('https://user:pass@example.com'));assert.throws(()=>validateEntry({kind:'blog',title:'x'.repeat(181)}));assert.equal(safeURL('https://example.com/demo'),'https://example.com/demo');});
test('contact rejects invalid input, honeypots and missing provider configuration',async()=>{const env=await environment();assert.equal((await worker.fetch(request('/api/contact','POST',{website:'spam'}),env)).status,400);assert.equal((await worker.fetch(request('/api/contact','POST',{name:'test',email:'invalid',service:'Consultation',requirements:'A valid long project description'}),env)).status,400);assert.equal((await worker.fetch(request('/api/contact','POST',{name:'test',email:'test@example.com',service:'Consultation',requirements:'A valid long project description'}),env)).status,503);});
test('contact fixes destination, sets reply-to, preserves idempotency and reports provider failure',async()=>{const env={...await environment(),RESEND_API_KEY:'test-key',RESEND_FROM:'Raydin Labs <website@raydinlabs.org>',RESEND_TEMPLATE_ID:'test-template'};const old=globalThis.fetch;let bodies=[],keys=[];globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://api.resend.com/emails');bodies.push(JSON.parse(options.body));keys.push(new Headers(options.headers).get('idempotency-key'));return Response.json({id:'mock-message'});};try{const payload={name:'Test',email:'visitor@example.com',service:'Consultation',requirements:'Test requirements longer than twenty characters',attempt:'test-attempt-123456789'};for(let i=0;i<2;i++)assert.equal((await worker.fetch(request('/api/contact','POST',payload),env)).status,200);assert.deepEqual(bodies[0].to,['raydinlabs@gmail.com']);assert.equal(bodies[0].reply_to,'visitor@example.com');assert.equal(keys[0],keys[1]);assert.equal(bodies[0].template.variables.REQUIREMENTS,payload.requirements);globalThis.fetch=async()=>Response.json({message:'Provider unavailable',name:'application_error'},{status:500});assert.equal((await worker.fetch(request('/api/contact','POST',payload),env)).status,502);}finally{globalThis.fetch=old;}});
test('rate limiter blocks repeated login attempts',async()=>{const env=await environment();for(let i=0;i<8;i++)await worker.fetch(request('/api/admin/login','POST',{email:'bad@example.com',password:'wrong'}),env);assert.equal((await worker.fetch(request('/api/admin/login','POST',{email:'bad@example.com',password:'wrong'}),env)).status,429);});
test('uploads require login and reject mismatched content',async()=>{const env=await environment(),token=await login(env);env.MEDIA={put(){throw Error('Must not store bad input');}};const req=new Request(origin+'/api/admin/upload',{method:'POST',headers:{Origin:origin,Cookie:token,'Content-Type':'image/png','Content-Length':'7'},body:'not png'});assert.equal((await worker.fetch(req,env)).status,400);});

test('page editor saves private drafts and only publishes explicitly',async()=>{
 const env=await environment(),token=await login(env);
 let r=await worker.fetch(request('/api/admin/page-content','POST',{page:'index',changes:{'text:0':'Private headline'},updated_at:'',publish:false},token),env);
 assert.equal(r.status,200);let data=await r.json();
 assert.deepEqual((await (await worker.fetch(request('/api/page-content?page=index'),env)).json()).changes,{});
 r=await worker.fetch(request('/api/admin/page-content','POST',{page:'index',changes:{'text:0':'Public headline'},updated_at:data.updated_at,publish:true},token),env);
 assert.equal(r.status,200);assert.equal((await (await worker.fetch(request('/api/page-content?page=index'),env)).json()).changes['text:0'],'Public headline');
 r=await worker.fetch(request('/api/admin/page-content','POST',{page:'index',changes:{'text:0':'Stale'},updated_at:'old',publish:true},token),env);assert.equal(r.status,409);
 r=await worker.fetch(request('/api/admin/page-content','POST',{page:'index',changes:{'text:0':'x','media:hero':'javascript:alert(1)'},updated_at:'',publish:true},token),env);assert.equal(r.status,400);
});

test('username sign-in accepts configured username and rejects old email identity',async()=>{
 const env=await environment();env.ADMIN_USERNAME='test-admin';
 let response=await worker.fetch(request('/api/admin/login','POST',{username:'test-admin',password:'test-only-password-long'}),env);
 assert.equal(response.status,200);
 response=await worker.fetch(request('/api/admin/login','POST',{username:env.ADMIN_EMAIL,password:'test-only-password-long'}),env);
 assert.equal(response.status,401);
});
test('legacy content and blog links redirect into Wiki',async()=>{
 for(const [path,anchor] of [['content','videos'],['blog','articles']]){
 const response=await worker.fetch(request('/'+path+'.html'),{});
 assert.equal(response.status,301);assert.ok(response.headers.get('Location').endsWith('/wiki.html#'+anchor));
 }
});
