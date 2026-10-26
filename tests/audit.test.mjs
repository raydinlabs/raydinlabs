
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('portfolio and guides remain readable before JavaScript or API loading',async()=>{
 const portfolio=await readFile('projects.html','utf8');
 for(const id of ['cosmo-can','fcv1','oma-x']){
  assert.ok(portfolio.includes('href="project-'+id+'.html"'));
  const detail=await readFile('project-'+id+'.html','utf8');
  assert.match(detail,/Development & validation/);
  assert.ok(detail.includes('data-entry-id="'+id+'"'));
  assert.ok(detail.includes('href="projects.html"'));
 }
 const wiki=await readFile('wiki.html','utf8');
 assert.match(wiki,/A new board will not power up/);
 assert.match(wiki,/A serial connection shows no data/);
 assert.match(wiki,/Field notes are being prepared/);
});
test('enquiry supports uncertain service selection, stage and accessible guidance',async()=>{
 const html=await readFile('services.html','utf8');
 assert.ok(html.includes("<option>Not sure yet</option>"));
 assert.match(html,/name="stage"/);
 assert.match(html,/aria-describedby="requirements-help"/);
 assert.match(html,/<label class="honeypot" hidden aria-hidden="true">/);
 assert.match(html,/<caption>Engagement models/);
 assert.ok(html.includes(">Contact</a>"));
});
class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.listeners={};this.attributes={};this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,v){this.listeners[k]=v;}
 after(node){this.afterNode=node;}
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('failed collection loading retains fallback and retry can recover',async()=>{
 const collection=new Element('div');collection.dataset.collection='projects';
 const fallback=new Element('a');collection.append(fallback);
 let fail=true;
 const document={createElement:tag=>new Element(tag),querySelector:()=>null,querySelectorAll:selector=>selector==='[data-collection]'?[collection]:[]};
 const code=(await readFile('assets/content.js','utf8')).replaceAll('export function','function');
 vm.runInNewContext(code,{document,fetch:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>({entries:[]})};},URL,URLSearchParams,location:{search:''},Event:class{}});
 await flush();
 assert.equal(collection.children[0],fallback);
 assert.match(collection.afterNode.textContent,/could not be loaded/);
 const retry=collection.afterNode.children.find(n=>n.tagName==='button');assert.ok(retry);
 fail=false;await retry.listeners.click();await flush();
 assert.notEqual(collection.children[0],fallback);
 assert.match(collection.children[0].textContent,/New entries will appear/);
});
test('article search does not hide video or project cards',async()=>{
 const search=new Element('input'),status=new Element('p'),blog=new Element('a'),video=new Element('a');
 blog.dataset.search='power troubleshooting';video.dataset.search='engineering video';
 const document={createElement:tag=>new Element(tag),querySelector:s=>s==='#article-search'?search:s==='#search-status'?status:null,querySelectorAll:s=>s==='[data-collection=blog] .entry-card'?[blog]:s==='.entry-card'?[blog,video]:[]};
 vm.runInNewContext((await readFile('assets/content.js','utf8')).replaceAll('export function','function'),{document});
 search.listeners.input({target:{value:'unmatched'}});
 assert.equal(blog.hidden,true);assert.equal(video.hidden,undefined);assert.equal(status.textContent,'No matching articles.');
 search.listeners.input({target:{value:''}});assert.equal(blog.hidden,false);
});
