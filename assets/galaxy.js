const canvas = document.querySelector('#galaxy');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (canvas) init().catch(error => { console.warn('Galaxy renderer:', error.message); canvas.dataset.error=error.message; canvas.hidden = true; });
async function init() {
  const gl = canvas.getContext('webgl', {alpha: true, antialias: false, powerPreference:'low-power'});
  if (!gl) return canvasRenderer();
  const response = await fetch('assets/galaxy.bin');
  if (!response.ok) throw Error('Star data unavailable');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength % 28 !== 0 || !bytes.byteLength) throw Error('Invalid star data');
  const data = new Float32Array(bytes);
  const vs = `attribute vec3 p; attribute vec3 c; attribute float s;
    uniform float time; uniform float aspect; uniform float density; uniform vec2 pointer;
    varying vec3 color; varying float alpha;
    void main(){
      float a=sin(time*0.018)*0.055; float ca=cos(a); float sa=sin(a);
      vec3 q=vec3(p.x*ca-p.z*sa,p.y,p.x*sa+p.z*ca);
      float tilt=0.30+pointer.y*0.025;
      vec3 v=vec3(q.x, q.y*cos(tilt)-q.z*sin(tilt), q.y*sin(tilt)+q.z*cos(tilt));
      float roll=-0.38+pointer.x*0.025;
      v.xy=mat2(cos(roll),sin(roll),-sin(roll),cos(roll))*v.xy;
      float depth=9.0+v.z;
      float scale=aspect<1.0 ? 1.1 : 1.85;
      gl_Position=vec4((v.x*scale/aspect)/depth,(v.y*scale)/depth,0.0,1.0);
      gl_PointSize=clamp(s*density*9.0/depth,0.8,8.0);
      color=c; alpha=0.6+0.08*sin(p.x*13.0+p.z*7.0+time*0.25);
    }`;
  const fs = `precision mediump float; varying vec3 color; varying float alpha;
    void main(){float d=length(gl_PointCoord-0.5); if(d>0.5)discard;
    float glow=pow(1.0-d*2.0,1.7);gl_FragColor=vec4(color,glow*alpha);}`;
  function shader(type, source) { const sh=gl.createShader(type); gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh) || 'Shader failed');return sh; }
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program) || 'Program failed');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  for(const [name,size,offset] of [['p',3,0],['c',3,12],['s',1,24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,28,offset);}
  const uniforms=Object.fromEntries(['time','aspect','density','pointer'].map(n=>[n,gl.getUniformLocation(program,n)]));
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,0);
  let paused=reduced.matches, visible=true, lost=false, raf=0, time=0, previous=0, x=0,y=0;
  function resize(){const r=canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(uniforms.aspect,r.width/r.height);gl.uniform1f(uniforms.density,dpr);draw();}
  function draw(){if(lost)return;gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uniforms.time,time);gl.uniform2f(uniforms.pointer,x,y);gl.drawArrays(gl.POINTS,0,data.length/7);}
  function frame(now){raf=0;if(paused||!visible||document.hidden||lost)return;time+=previous?Math.min((now-previous)/1000,0.05):0;previous=now;draw();raf=requestAnimationFrame(frame);}
  function sync(){cancelAnimationFrame(raf);raf=0;previous=0;if(!paused&&visible&&!document.hidden&&!lost)raf=requestAnimationFrame(frame);else draw();}
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
  canvas.parentElement.addEventListener('pointermove',e=>{if(paused)return;const r=canvas.getBoundingClientRect();x=(e.clientX-r.left)/r.width-0.5;y=(e.clientY-r.top)/r.height-0.5;});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange',sync);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.hidden=true;});
  canvas.dataset.ready='true';resize();sync();
}

// A software 3D projection keeps the galaxy visible when WebGL is unavailable.
async function canvasRenderer() {
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
 const response=await fetch('assets/galaxy.bin');if(!response.ok)throw Error('Star data unavailable');
 const data=new Float32Array(await response.arrayBuffer());
 const sprites=[];
 for(const color of ['151,192,255','111,176,233','210,213,238','255,211,153']){
   const sprite=document.createElement('canvas');sprite.width=sprite.height=32;const c=sprite.getContext('2d');
   const gradient=c.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,`rgba(${color},1)`);gradient.addColorStop(.16,`rgba(${color},.75)`);gradient.addColorStop(.5,`rgba(${color},.14)`);gradient.addColorStop(1,`rgba(${color},0)`);c.fillStyle=gradient;c.fillRect(0,0,32,32);sprites.push(sprite);
 }
 let paused=reduced.matches,visible=true,raf=0,time=0,previous=0,x=0,y=0,w=1,h=1;
 function draw(){ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';const a=Math.sin(time*.018)*.055,ca=Math.cos(a),sa=Math.sin(a),tilt=0.30+y*.025,ct=Math.cos(tilt),st=Math.sin(tilt),roll=-.38+x*.025,cr=Math.cos(roll),sr=Math.sin(roll),aspect=w/h,scale=aspect<1?1.1:1.85;
   for(let i=0;i<data.length;i+=14){const px=data[i],py=data[i+1],pz=data[i+2],qx=px*ca-pz*sa,qz=px*sa+pz*ca,vy=py*ct-qz*st,vz=py*st+qz*ct,rx=qx*cr-vy*sr,ry=qx*sr+vy*cr,depth=9+vz,sx=w/2+rx*scale*h/(2*depth),sy=h/2-ry*scale*h/(2*depth),size=Math.max(1.3,data[i+6]*2.2*9/depth);ctx.globalAlpha=.55+.25*Math.sin(px*13+pz*7+time*.25);const idx=data[i+3]>.65?3:data[i+3]>.5?2:i%3;ctx.drawImage(sprites[idx],sx-size/2,sy-size/2,size,size);}
   ctx.globalAlpha=1;
 }
 function frame(now){raf=0;if(paused||!visible||document.hidden)return;if(now-previous<32){raf=requestAnimationFrame(frame);return;}time+=previous?Math.min((now-previous)/1000,.06):0;previous=now;draw();raf=requestAnimationFrame(frame);}
 function sync(){cancelAnimationFrame(raf);previous=0;draw();if(!paused&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
 new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect();w=canvas.width=Math.round(rect.width);h=canvas.height=Math.round(rect.height);draw();}).observe(canvas);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});document.addEventListener('visibilitychange',sync);
 canvas.parentElement.addEventListener('pointermove',e=>{if(paused)return;const r=canvas.getBoundingClientRect();x=(e.clientX-r.left)/r.width-.5;y=(e.clientY-r.top)/r.height-.5;});
 canvas.dataset.ready='true';canvas.dataset.renderer='canvas-3d';sync();
}
