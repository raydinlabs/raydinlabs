import {filterGuides} from './utils.js';
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');menu.setAttribute('aria-label','Open navigation');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
const search=document.querySelector('#wiki-search');
search?.addEventListener('input',()=>{const guides=[...document.querySelectorAll('.wiki-guide')];const count=filterGuides(guides,search.value);document.querySelector('#wiki-empty').hidden=count!==0;});
const form=document.querySelector('#brief-form');
let enquiryAttempt=crypto.randomUUID();
form?.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('button[type=submit]'),status=document.querySelector('#brief-status');
 button.disabled=true;status.textContent='Sending your enquiry…';
 try{const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(new FormData(form)),attempt:enquiryAttempt})});const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to send. Please try again.');status.textContent='Your enquiry has been sent. Thank you — we will reply by email.';form.reset();enquiryAttempt=crypto.randomUUID();}
 catch(error){status.textContent=error.message==='Failed to fetch'?'Connection interrupted. Please try again.':error.message;const backup=document.createElement('a');backup.href='mailto:raydinlabs@gmail.com';backup.textContent=' Email raydinlabs@gmail.com instead ↗';status.append(backup);}
 finally{button.disabled=false;}
});
const motion=matchMedia('(prefers-reduced-motion: reduce)');
if(!motion.matches && 'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}},{threshold:.08});document.querySelectorAll('.section-title,.project-detail,.service-row,.principle,.update-list>a').forEach(el=>{el.classList.add('reveal');observer.observe(el);});}
menu?.addEventListener('click',()=>menu.setAttribute('aria-label',menu.getAttribute('aria-expanded')==='true'?'Close navigation':'Open navigation'));
document.querySelector('#load-discussions')?.addEventListener('click',e=>{e.currentTarget.hidden=true;const panel=document.querySelector('#discussion-panel');const info=document.createElement('p');info.className='note';info.textContent='If the panel does not appear, use Open discussions on GitHub above.';panel.append(info);const script=document.createElement('script');script.src='https://giscus.app/client.js';const config={repo:'raydinlabs/raydinlabs.github.io','repo-id':'R_kgDOSofLlQ',category:'Show and tell','category-id':'DIC_kwDOSofLlc4C949X',mapping:'pathname',strict:'0','reactions-enabled':'1','emit-metadata':'0','input-position':'top',theme:'dark',lang:'en',loading:'lazy'};for(const [key,value] of Object.entries(config))script.setAttribute('data-'+key,value);script.crossOrigin='anonymous';script.async=true;panel.append(script);});
