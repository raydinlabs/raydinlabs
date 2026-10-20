import {makeBrief,filterGuides} from './utils.js';
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
const search=document.querySelector('#wiki-search');
search?.addEventListener('input',()=>{const guides=[...document.querySelectorAll('.wiki-guide')];const count=filterGuides(guides,search.value);document.querySelector('#wiki-empty').hidden=count!==0;});
const form=document.querySelector('#brief-form');
let prepared='';
form?.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 prepared=makeBrief(Object.fromEntries(new FormData(form)));
 document.querySelector('#brief-output').value=prepared;
 const result=document.querySelector('#brief-result');result.hidden=false;
 const emailLink=document.querySelector('#email-brief');
 if(emailLink){const recipient=emailLink.getAttribute('href').split('?')[0];emailLink.href=recipient+'?subject='+encodeURIComponent('Project enquiry — Raydin Labs')+'&body='+encodeURIComponent(prepared);}
 result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 document.querySelector('#brief-status').textContent='Review the brief, then choose how to share it. Nothing has been sent.';
});
document.querySelector('#copy-brief')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(prepared);document.querySelector('#brief-status').textContent='Brief copied. Paste it into your message.';}catch{document.querySelector('#brief-output').select();document.querySelector('#brief-status').textContent='Select and copy the brief above, or use Download .txt.';}});
document.querySelector('#download-brief')?.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([prepared],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='raydin-project-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.querySelector('#load-discussions')?.addEventListener('click',e=>{e.currentTarget.hidden=true;const panel=document.querySelector('#discussion-panel');const info=document.createElement('p');info.className='note';info.textContent='If the panel does not appear, use Open discussions on GitHub above.';panel.append(info);const script=document.createElement('script');script.src='https://giscus.app/client.js';const config={repo:'raydinlabs/raydinlabs.github.io','repo-id':'R_kgDOSofLlQ',category:'Show and tell','category-id':'DIC_kwDOSofLlc4C949X',mapping:'pathname',strict:'0','reactions-enabled':'1','emit-metadata':'0','input-position':'top',theme:'dark',lang:'en',loading:'lazy'};for(const [key,value] of Object.entries(config))script.setAttribute('data-'+key,value);script.crossOrigin='anonymous';script.async=true;panel.append(script);});
