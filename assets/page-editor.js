// Safe text-only public page overrides. Never inject admin-authored HTML.
const page=location.pathname.split('/').pop().replace(/\.html$/,'')||'index';
const allowed=['index','about','projects','services','content','blog','wiki','community','socials'];
if(allowed.includes(page)){
 const editable=()=>[...document.querySelectorAll('main h1,main h2,main h3,main p:not(.note),main .tag,main .text-link')].filter(n=>!n.closest('form,[data-collection],.reading,.aero-showcase')&&!n.id?.startsWith('brief-'));
 const nodes=editable();
 nodes.forEach((n,i)=>n.dataset.cmsKey='text:'+i);
 const mediaHost=document.querySelector('main .hero,main .page-heading');
 if(mediaHost){const box=document.createElement('div');box.className='cms-media-slot';box.dataset.cmsKey='media:hero';box.hidden=true;mediaHost.append(box);}
 function apply(changes){
  for(const [key,value] of Object.entries(changes||{})){
   if(key.startsWith('text:')){const node=nodes[Number(key.slice(5))];if(node)node.textContent=value;}
   if(key==='media:hero'&&mediaHost){const slot=mediaHost.querySelector('.cms-media-slot');slot.replaceChildren();slot.hidden=!value;if(value){const u=new URL(value,location.origin);if(u.protocol!=='https:')continue;const media=/\.(mp4|webm)(\?|$)/i.test(u.pathname)?document.createElement('video'):document.createElement('img');media.src=u.href;if(media.tagName==='VIDEO'){media.controls=true;media.muted=true;media.loop=true;media.playsInline=true;media.preload='none';}else{media.alt='Raydin Labs page visual';media.loading='lazy';}slot.append(media);}}
  }
 }
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===window.parent&&event.data?.type==='rdl-preview'&&event.data.page===page)apply(event.data.changes);});
 fetch('/api/page-content?page='+encodeURIComponent(page)).then(r=>r.ok?r.json():{changes:{}}).then(r=>{apply(r.changes);window.parent!==window&&window.parent.postMessage({type:'rdl-preview-ready',page},location.origin);}).catch(()=>{});
 window.RaydinPageEditor={nodes,apply,page};
}
