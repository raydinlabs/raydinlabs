import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {makeBrief,filterGuides} from '../assets/utils.js';
const names=['index','about','projects','services','content','wiki','community','socials','blog','admin','article'];
test('all pages preserve navigation, local destinations and section anchors',async()=>{
 for(const name of names){const html=await readFile(`${name}.html`,'utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.ok(html.includes('name="viewport"'));
 for(const page of names.filter(n=>!['index','article','admin'].includes(n)))assert.ok(html.includes(`href="${page}.html"`));
 for(const [,link] of html.matchAll(/(?:href|src)="([^"?#]+)(?:#([^"?]+))?"/g))if(!/^(https?:|mailto:)/.test(link))await access(link);
 for(const [,file,anchor] of html.matchAll(/href="([a-z-]+\.html)#([a-z-]+)"/g)){const target=await readFile(file,'utf8');assert.ok(target.includes(`id="${anchor}"`),`${file}#${anchor}`);}
 }
});
test('project brief preserves user text and does not execute markup',()=>{const brief=makeBrief({name:' Test ',email:'test@example.com',service:'Consultation',requirements:'<script>alert(1)</script> & notes'});assert.match(brief,/Name: Test/);assert.match(brief,/Budget: To be discussed/);assert.ok(brief.includes('<script>alert(1)</script> & notes'));});
test('wiki search filters topics and restores all results',()=>{const guides=[{textContent:'Power issue',dataset:{keywords:'pcb'},hidden:false},{textContent:'Serial',dataset:{keywords:'uart'},hidden:false}];assert.equal(filterGuides(guides,' UART '),1);assert.equal(guides[0].hidden,true);assert.equal(filterGuides(guides,''),2);assert.equal(filterGuides(guides,'unmatched'),0);});

test('aerospace concept sections are present and retain accessible fallbacks',async()=>{
 for(const page of ['index','about','projects','services']){
  const html=await readFile(page+'.html','utf8');
  assert.match(html,/class="aero-showcase/);
  assert.match(html,/VIDEO PLACEHOLDER/);
  assert.match(html,/data-aero-stage/);
  assert.match(html,/assets\/aerospace\.css/);
  assert.match(html,/assets\/aerospace\.js/);
  assert.equal((html.match(/id="aero-explode"/g)||[]).length,1);
 }
 const source=await readFile('src/pages.mjs','utf8');
 assert.match(source,/aerospaceShowcase/);
 const script=await readFile('assets/aerospace.js','utf8');
 assert.match(script,/pointercancel/);
 assert.match(script,/ArrowLeft/);
});
