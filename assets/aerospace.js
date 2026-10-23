// Dependency-free, accessible conceptual 3D explorer.
const range=document.querySelector('#aero-explode');
const model=document.querySelector('[data-aero-model]');
const stage=document.querySelector('[data-aero-stage]');
const output=document.querySelector('#aero-value');
if(range&&model&&stage){
 let x=-22,y=-32,start=null;
 const update=()=>{model.style.setProperty('--rotate-x',x+'deg');model.style.setProperty('--rotate-y',y+'deg');};
 range.addEventListener('input',()=>{model.style.setProperty('--explode',range.value);output.textContent=range.value+'%';});
 stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;start={x:event.clientX,y:event.clientY};stage.setPointerCapture(event.pointerId);});
 stage.addEventListener('pointermove',event=>{if(!start)return;y+=(event.clientX-start.x)*.35;x=Math.max(-75,Math.min(75,x-(event.clientY-start.y)*.25));start={x:event.clientX,y:event.clientY};update();});
 const stop=()=>{start=null;};stage.addEventListener('pointerup',stop);stage.addEventListener('pointercancel',stop);stage.addEventListener('lostpointercapture',stop);
 stage.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();y+=event.key==='ArrowLeft'?-10:10;update();}});
}
