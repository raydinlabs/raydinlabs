const canvas = document.querySelector('#earth');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (canvas) init().catch(error => { console.warn('Earth renderer:', error); canvas.hidden = true; });
async function init() {
  const image = new Image(); image.src = 'assets/earth-day.jpg'; await image.decode();
  const gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:false, antialias:true, powerPreference:'low-power'});
  if (!gl) return fallback(image);
  function shader(type, source) { const s=gl.createShader(type); gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s; }
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec2 p; varying vec2 uv; void main(){uv=p;gl_Position=vec4(p,0.,1.);}`));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;
  varying vec2 uv; uniform sampler2D surface; uniform float angle; uniform float aspect;
  const float PI=3.14159265359;
  void main(){
    vec2 p=uv*1.12; p.x*=aspect; float r=length(p);
    vec3 sun=normalize(vec3(-0.8,0.6,1.4));
    if(r>1.0){float halo=exp(-(r-1.0)*65.0)*0.30;gl_FragColor=vec4(vec3(0.18,0.42,0.65),halo);return;}
    vec3 n=vec3(p,sqrt(1.0-r*r));
    float tilt=0.20;vec3 q=vec3(n.x*cos(tilt)+n.y*sin(tilt),-n.x*sin(tilt)+n.y*cos(tilt),n.z);
    vec2 tex=vec2(fract(atan(q.x,q.z)/(2.0*PI)+0.5+angle),acos(clamp(q.y,-1.0,1.0))/PI);
    vec3 albedo=texture2D(surface,tex).rgb;
    float daylight=max(dot(n,sun),0.0);
    vec3 color=albedo*(0.035+0.965*pow(daylight,0.8));
    float ocean=(1.0-smoothstep(0.05,0.17,albedo.r))*smoothstep(0.01,0.08,albedo.b-albedo.r);
    color+=vec3(0.55,0.65,0.75)*pow(max(dot(reflect(-sun,n),vec3(0.,0.,1.)),0.),55.)*ocean*0.35;
    color+=vec3(0.12,0.32,0.55)*pow(1.0-n.z,3.0)*daylight*0.65;
    gl_FragColor=vec4(color,1.0-smoothstep(0.995,1.0,r));
  }`));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const angle=gl.getUniformLocation(program,'angle'),aspect=gl.getUniformLocation(program,'aspect');
  let rotation=-0.08,raf=0,last=0,visible=true,lost=false;
  function draw(){if(lost)return;gl.uniform1f(angle,rotation);gl.drawArrays(gl.TRIANGLES,0,6);}
  function tick(now){if(last)rotation+=(now-last)*0.000012;last=now;draw();raf=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(raf);last=0;draw();if(!reduced.matches&&!document.hidden&&visible&&!lost)raf=requestAnimationFrame(tick);}
  new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.5);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(aspect,rect.width/rect.height);draw();}).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.hidden=true;});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  canvas.dataset.ready='true';sync();
}
// Software sphere projection provides a textured Earth without WebGL.
function fallback(image){
 const ctx=canvas.getContext('2d'),map=document.createElement('canvas');map.width=image.width;map.height=image.height;
 const source=map.getContext('2d');source.drawImage(image,0,0);const pixels=source.getImageData(0,0,map.width,map.height).data;
 canvas.width=canvas.height=480;const frame=ctx.createImageData(480,480);
 for(let y=0;y<480;y++)for(let x=0;x<480;x++){const nx=(x-240)/214,ny=(240-y)/214,r=nx*nx+ny*ny;if(r>1)continue;const z=Math.sqrt(1-r),u=((Math.atan2(nx,z)/(2*Math.PI)+.42)%1+1)%1,v=Math.acos(ny)/Math.PI,src=(Math.min(map.height-1,Math.floor(v*map.height))*map.width+Math.floor(u*map.width))*4,dst=(y*480+x)*4,light=.035+.965*Math.max(0,(-.8*nx+.6*ny+1.4*z)/Math.sqrt(2.96));for(let c=0;c<3;c++)frame.data[dst+c]=pixels[src+c]*light;frame.data[dst+3]=255;}
 ctx.putImageData(frame,0,0);canvas.dataset.ready='true';canvas.dataset.renderer='software-static';
}
