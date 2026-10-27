import {filterGuides} from './utils.js';
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');menu.setAttribute('aria-label','Open navigation');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
const search=document.querySelector('#wiki-search');
search?.addEventListener('input',()=>{const guides=[...document.querySelectorAll('.wiki-guide')];if(!guides.length)return;const count=filterGuides(guides,search.value);document.querySelector('#wiki-empty').hidden=count!==0;});
const form=document.querySelector('#brief-form');
let enquiryAttempt=crypto.randomUUID();
form?.addEventListener('invalid', e=>{const field=e.target;field.setAttribute('aria-invalid','true');let error=field.parentElement.querySelector('.field-error');if(!error){error=document.createElement('span');error.className='field-error';error.id='error-'+field.name;field.parentElement.append(error);field.setAttribute('aria-describedby',((field.getAttribute('aria-describedby')||'')+' '+error.id).trim());}error.textContent=field.validationMessage;},true);
form?.addEventListener('input',e=>{if(e.target.validity?.valid){e.target.removeAttribute('aria-invalid');const error=e.target.parentElement.querySelector('.field-error');if(error)error.textContent='';}});
form?.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('button[type=submit]'),status=document.querySelector('#brief-status');
 button.disabled=true;status.textContent='Sending your enquiry…';
 try{const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(new FormData(form)),attempt:enquiryAttempt})});let data;try{data=await response.json();}catch{throw Error('The enquiry service is unavailable. Your details are still here; please retry or email us.');}if(!response.ok)throw Error(data.error||'Unable to send. Please try again.');status.textContent='Your enquiry has been sent. Thank you — we will reply by email.';form.reset();enquiryAttempt=crypto.randomUUID();}
 catch(error){status.textContent=error.message==='Failed to fetch'?'Connection interrupted. Please try again.':error.message;const backup=document.createElement('a');backup.href='mailto:raydinlabs@gmail.com';backup.textContent=' Email raydinlabs@gmail.com instead ↗';status.append(backup);}
 finally{button.disabled=false;}
});
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const header=document.querySelector('.site-header');
const syncHeader=()=>header?.classList.toggle('is-scrolled',window.scrollY>24);
let headerFrame=0;
window.addEventListener('scroll',()=>{if(!headerFrame)headerFrame=requestAnimationFrame(()=>{headerFrame=0;syncHeader();});},{passive:true});syncHeader();
if(!motion.matches && 'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}},{threshold:.08});document.querySelectorAll('.section-title,.project-detail,.service-row,.principle,.update-list>a,.mission-grid,.directory a,.cta,.social-row').forEach(el=>{el.classList.add('reveal');observer.observe(el);});}
motion.addEventListener('change',()=>{if(motion.matches)document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'));});
menu?.addEventListener('click',()=>menu.setAttribute('aria-label',menu.getAttribute('aria-expanded')==='true'?'Close navigation':'Open navigation'));

const discussionButton=document.querySelector('#load-discussions');
let discussionCleanup=()=>{};
discussionButton?.addEventListener('click',()=>{
 discussionCleanup();
 const panel=document.querySelector('#discussion-panel'),status=document.querySelector('#discussion-status');
 panel.replaceChildren();discussionButton.disabled=true;status.textContent='Loading GitHub discussions…';
 const script=document.createElement('script');script.src='https://giscus.app/client.js';
 const config={repo:'raydinlabs/raydinlabs','repo-id':'R_kgDOSofLlQ',category:'Show and tell','category-id':'DIC_kwDOSofLlc4C949X',mapping:'pathname',strict:'0','reactions-enabled':'1','emit-metadata':'1','input-position':'top',theme:'dark',lang:'en',loading:'eager'};
 for(const [key,value] of Object.entries(config))script.setAttribute('data-'+key,value);
 script.crossOrigin='anonymous';script.async=true;
 let timer;
 const finish=(ok)=>{clearTimeout(timer);window.removeEventListener('message',message);discussionButton.disabled=false;discussionButton.hidden=ok;discussionButton.textContent='Retry discussion panel ↗';status.textContent=ok?'Discussions loaded. A GitHub account is required to post.':'The discussion panel could not be loaded. Use the Open discussions on GitHub link above, or retry.';if(!ok)panel.replaceChildren();};
 const message=event=>{if(event.origin!=='https://giscus.app'||event.source!==panel.querySelector('iframe')?.contentWindow||!event.data?.giscus)return;if(event.data.giscus.error)finish(false);else if(event.data.giscus.discussion)finish(true);};
 window.addEventListener('message',message);script.onerror=()=>finish(false);timer=setTimeout(()=>finish(false),15000);
 discussionCleanup=()=>{clearTimeout(timer);window.removeEventListener('message',message);};panel.append(script);
});
