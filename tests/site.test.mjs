import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {makeBrief,filterGuides} from '../assets/utils.js';
const names=['index','about','projects','services','content','wiki','community','socials','blog','admin','article'];
test('all pages preserve navigation, local destinations and section anchors',async()=>{
 for(const name of names){const html=await readFile(`${name}.html`,'utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.ok(html.includes('name="viewport"'));
 for(const page of names.filter(n=>!['index','article','admin','content','blog'].includes(n)))assert.ok(html.includes(`href="${page}.html"`));
 for(const [,link] of html.matchAll(/(?:href|src)="([^"?#]+)(?:#([^"?]+))?"/g))if(!/^(https?:|mailto:)/.test(link))await access(link);
 for(const [,file,anchor] of html.matchAll(/href="([a-z-]+\.html)#([a-z-]+)"/g)){const target=await readFile(file,'utf8');assert.ok(target.includes(`id="${anchor}"`),`${file}#${anchor}`);}
 }
});
test('project brief preserves user text and does not execute markup',()=>{const brief=makeBrief({name:' Test ',email:'test@example.com',service:'Consultation',requirements:'<script>alert(1)</script> & notes'});assert.match(brief,/Name: Test/);assert.match(brief,/Budget: To be discussed/);assert.ok(brief.includes('<script>alert(1)</script> & notes'));});
test('wiki search filters topics and restores all results',()=>{const guides=[{textContent:'Power issue',dataset:{keywords:'pcb'},hidden:false},{textContent:'Serial',dataset:{keywords:'uart'},hidden:false}];assert.equal(filterGuides(guides,' UART '),1);assert.equal(guides[0].hidden,true);assert.equal(filterGuides(guides,''),2);assert.equal(filterGuides(guides,'unmatched'),0);});

test('Wiki combines articles, guides and videos under one navigation link',async()=>{
 const html=await readFile('wiki.html','utf8');
 for(const kind of ['wiki','blog','content'])assert.ok(html.includes(`data-collection="${kind}"`));
 const nav=html.match(/<nav id="main-nav"[\s\S]*?<\/nav>/)[0];
 assert.ok(nav.includes('href="wiki.html"'));
 assert.ok(!nav.includes('href="content.html"')&&!nav.includes('href="blog.html"'));
 const admin=await readFile('admin.html','utf8');
 assert.match(admin, /name="username" type="text"/);
 assert.ok(!admin.includes('minlength="16"'));
});
