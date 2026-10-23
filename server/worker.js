import {Resend} from 'resend';
import {seedEntries} from './seed.js';
const encoder=new TextEncoder();
const kinds=['blog','projects','wiki','content'];
const recipient='raydinlabs@gmail.com';
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const failure=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export const hex=buffer=>Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,'0')).join('');
const digest=async text=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(text)));
function equal(a,b){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
async function readBody(request,limit=100000){const reader=request.body?.getReader();if(!reader)return {};let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();failure('Request too large.',413);}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{failure('Invalid JSON.');}}
function text(data,key,max,required=false){const value=data[key]??'';if(typeof value!=='string'||value.length>max||(required&&!value.trim()))failure(`Invalid ${key.replaceAll('_',' ')}.`);return value.trim();}
export function safeURL(value){if(!value)return '';try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw Error();return url.href;}catch{failure('Links must use HTTPS.');}}
export function validateEntry(data){const entry={};for(const [key,max,required] of [['title',180,true],['summary',600],['body',50000],['process',20000],['image_alt',300]])entry[key]=text(data,key,max,required);if(!kinds.includes(data.kind))failure('Unknown collection.');entry.kind=data.kind;entry.published=data.published===true||data.published===1||data.published==='1'?1:0;for(const key of ['demo_url','image_url','document_url'])entry[key]=safeURL(text(data,key,2048));return entry;}
function requireDB(env){if(!env.DB)failure('Publishing service is not configured yet.',503);}
async function rateLimit(request,env,scope,limit){requireDB(env);const time=Math.floor(Date.now()/1000);const bucket=Math.floor(time/600);const ip=request.headers.get('CF-Connecting-IP')||'local';const key=await digest(`${scope}:${ip}:${bucket}`);const row=await env.DB.prepare('INSERT INTO rate_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,time+1200).first();if(row.count>limit)failure('Too many attempts. Please try again in ten minutes.',429);await env.DB.prepare('DELETE FROM rate_limits WHERE expires < ?').bind(time).run();}
async function session(request,env){requireDB(env);const token=(request.headers.get('cookie')||'').match(/(?:^|;\s*)rdl_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;const hash=await digest(token);return env.DB.prepare('SELECT token_hash,email FROM sessions WHERE token_hash=? AND expires>?').bind(hash,Date.now()).first();}
const cookie=(token,age)=>`rdl_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;
async function sendContact(request,env){await rateLimit(request,env,'contact',5);const data=await readBody(request,12000);if(data.website)failure('Unable to submit this enquiry.');const fields={};for(const [key,max,required] of [['name',100,true],['email',200,true],['company',160],['service',100,true],['requirements',5000,true],['timeline',100],['budget',100]])fields[key]=text(data,key,max,required);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)||fields.requirements.length<20)failure('Enter a valid email and at least 20 characters describing your project.');if(!env.RESEND_API_KEY||!env.RESEND_FROM||!env.RESEND_TEMPLATE_ID)failure('Sending is temporarily unavailable. Email raydinlabs@gmail.com directly.',503);
 const attempt=text(data,'attempt',64,true);if(!/^[a-zA-Z0-9-]{16,64}$/.test(attempt))failure('Invalid submission identifier.');
 const variables=Object.fromEntries(Object.entries(fields).map(([key,value])=>[key==='email'?'CONTACT_EMAIL':key.toUpperCase(),(value||'Not provided').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))]));
 const resend=new Resend(env.RESEND_API_KEY);
 const {data:sent,error}=await resend.emails.send({from:env.RESEND_FROM,to:[recipient],replyTo:fields.email,subject:`Website enquiry: ${fields.service}`,template:{id:env.RESEND_TEMPLATE_ID,variables}},{idempotencyKey:`enquiry-${await digest(attempt+JSON.stringify(fields))}`});
 if(error||!sent?.id)failure('Your enquiry could not be sent. Please retry or email raydinlabs@gmail.com.',502);
 console.log('Enquiry accepted by Resend',sent.id);return json({ok:true,id:sent.id});
}
async function api(request,env){const url=new URL(request.url),path=url.pathname,method=request.method;
 if(!['GET','HEAD'].includes(method)&&request.headers.get('Origin')!==url.origin)failure('This request must come from this website.',403);
 if(path==='/api/contact'&&method==='POST')return sendContact(request,env);
 if(path==='/api/entries'&&method==='GET'){
 const kind=url.searchParams.get('kind');if(kind&&!kinds.includes(kind))failure('Unknown collection.');
 if(!env.DB)return json({entries:seedEntries.filter(x=>x.published&&(!kind||x.kind===kind))});
 const {results}=await env.DB.prepare('SELECT * FROM entries WHERE published=1 AND (? IS NULL OR kind=?) ORDER BY updated_at DESC').bind(kind,kind).all();return json({entries:results});}
 if(path.startsWith('/api/entry/')&&method==='GET'){const id=decodeURIComponent(path.slice(11));const entry=env.DB?await env.DB.prepare('SELECT * FROM entries WHERE id=? AND published=1').bind(id).first():seedEntries.find(x=>x.id===id&&x.published);return entry?json({entry}):json({error:'This entry is not published or no longer exists.'},404);}
 if(path==='/api/admin/login'&&method==='POST'){
 await rateLimit(request,env,'login',8);if(!env.ADMIN_PASSWORD_HASH||!env.ADMIN_EMAIL)failure('Admin sign-in has not been configured yet.',503);
 const data=await readBody(request,2000);const email=text(data,'email',200,true).toLowerCase(),password=typeof data.password==='string'&&data.password.length<=512?data.password:'';const [salt,hash]=env.ADMIN_PASSWORD_HASH.split(':');const calculated=await passwordHash(password,salt);if(!equal(calculated,hash||'')||email!==env.ADMIN_EMAIL.toLowerCase())failure('Email or password is incorrect.',401);
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));await env.DB.prepare('INSERT INTO sessions (token_hash,email,expires) VALUES (?,?,?)').bind(await digest(token),email,Date.now()+28800000).run();await env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()).run();return json({email},200,{'Set-Cookie':cookie(token,28800)});}
 if(path.startsWith('/api/admin/')){
 const user=await session(request,env);if(!user)failure('Please sign in to continue.',401);
 if(path==='/api/admin/session'&&method==='GET')return json({email:user.email});
 if(path==='/api/admin/logout'&&method==='POST'){await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(user.token_hash).run();return json({ok:true},200,{'Set-Cookie':cookie('',0)});}
 if(path==='/api/admin/entries'&&method==='GET'){const {results}=await env.DB.prepare('SELECT * FROM entries ORDER BY updated_at DESC').all();return json({entries:results});}
 if(path==='/api/admin/entries'&&method==='POST'){
 const data=await readBody(request),entry=validateEntry(data);const id=text(data,'id',80)||crypto.randomUUID(),updated=new Date().toISOString();const previous=await env.DB.prepare('SELECT updated_at FROM entries WHERE id=?').bind(id).first();const columns=Object.keys(entry),values=Object.values(entry);
 if(previous){const result=await env.DB.prepare(`UPDATE entries SET ${columns.map(k=>k+'=?').join(',')},updated_at=? WHERE id=? AND updated_at=?`).bind(...values,updated,id,text(data,'updated_at',40,true)).run();if(!result.meta.changes)failure('This entry changed in another tab. Reload it before saving.',409);}
 else await env.DB.prepare(`INSERT INTO entries (id,${columns.join(',')},updated_at) VALUES (${Array(columns.length+2).fill('?').join(',')})`).bind(id,...values,updated).run();return json({entry:{id,...entry,updated_at:updated}});}
 if(path.startsWith('/api/admin/entries/')&&method==='DELETE'){const data=await readBody(request,1000);const result=await env.DB.prepare('DELETE FROM entries WHERE id=? AND updated_at=?').bind(decodeURIComponent(path.split('/').pop()),text(data,'updated_at',40,true)).run();if(!result.meta.changes)failure('The entry changed or was already deleted. Reload the list.',409);return json({ok:true});}
 if(path==='/api/admin/upload'&&method==='POST'){
 if(!env.MEDIA)failure('Media storage has not been configured yet. You can use HTTPS image and document links.',503);
 const length=Number(request.headers.get('content-length'));if(!length||length>10*1024*1024)failure('File must be at most 10 MB.',413);
 const type=request.headers.get('content-type');const extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','application/pdf':'pdf'};if(!extensions[type])failure('Upload a PNG, JPEG, WebP, GIF, or PDF.');
 const bytes=await request.arrayBuffer();if(bytes.byteLength>10*1024*1024)failure('File must be at most 10 MB.',413);
 const v=new Uint8Array(bytes),ascii=new TextDecoder().decode(v.slice(0,12));const valid=type==='application/pdf'?ascii.startsWith('%PDF-'):type==='image/png'?v[0]===137&&ascii.slice(1,4)==='PNG':type==='image/jpeg'?v[0]===255&&v[1]===216&&v[2]===255:type==='image/gif'?(ascii.startsWith('GIF87a')||ascii.startsWith('GIF89a')):ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WEBP';if(!valid)failure('The file contents do not match its type.');
 const key=crypto.randomUUID()+'.'+extensions[type];await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type}});return json({url:`${url.origin}/media/${key}`,type});}
 }
 return json({error:'Not found.'},404);
}
export default {async fetch(request,env){try{const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return await api(request,env);if(url.pathname.startsWith('/media/')){if(!env.MEDIA)return new Response('Not found',{status:404});const key=url.pathname.slice(7);if(!/^[a-f0-9-]+\.(png|jpg|webp|gif|pdf)$/.test(key))return new Response('Not found',{status:404});const obj=await env.MEDIA.get(key);if(!obj)return new Response('Not found',{status:404});const headers=new Headers({'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=86400','Content-Security-Policy':"sandbox; default-src 'none'"});obj.writeHttpMetadata(headers);if(key.endsWith('.pdf'))headers.set('Content-Disposition',`attachment; filename="${key}"`);return new Response(obj.body,{headers});}return env.ASSETS.fetch(request);}catch(error){if(!error.status)console.error('Request failed',error.name);return json({error:error.status?error.message:'Service unavailable. Please try again shortly.'},error.status||503);}}};
