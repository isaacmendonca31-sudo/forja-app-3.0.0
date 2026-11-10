/**
 * FORJA — Fundo em gradiente animado (WebGL, sem dependências).
 *
 * Inspirado na ideia do "Animated Gradient" do Spell UI (redemoinho de cor em shader),
 * mas é uma implementação própria e mínima: um único fragment shader com ruído fractal
 * deformado (domain warping) + rotação em espiral.
 *
 * Princípios:
 *  • Decorativo: <canvas aria-hidden>, atrás de tudo, sem eventos.
 *  • Barato: renderiza em ~30% da resolução (o desfoque natural do shader esconde isso), 30 fps.
 *  • Respeitoso: com "reduzir movimento" desenha UM quadro estático; aba oculta pausa;
 *    aparelho modesto (data-perf=low), sem WebGL ou contexto perdido → permanece o fundo CSS.
 *  • Reage ao tema e ao rank: o tema colore o gradiente; ranks mantêm seus destaques (SSS = arco-íris).
 *  • Nenhum script inline: o shader é texto passado ao WebGL (não é script do documento).
 */
import { THEMES } from './theme.js';

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r; uniform float t; uniform vec3 hi; uniform vec3 deep; uniform float rb;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return v;}
vec3 hue(float x){return clamp(abs(mod(x*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);}
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  vec2 p=(uv-.5)*vec2(r.x/r.y,1.)*1.7;
  float d=length(p);
  float a=.75*sin(t*.11)+(1.25-d)*1.35;           // espiral: gira mais no centro
  p=mat2(cos(a),-sin(a),sin(a),cos(a))*p;
  vec2 q=vec2(fbm(p+t*.045),fbm(p+vec2(5.2,1.3)-t*.037));
  float f=fbm(p+2.1*q);
  vec3 base=vec3(.031,.035,.043);                  // grafite quase preto
  vec3 acc=mix(hi,hue(fract(t*.03+f*.6)),rb);      // destaque (arco-íris no SSS)
  vec3 col=mix(base,deep,smoothstep(.25,.75,f));
  col=mix(col,acc*.8,smoothstep(.5,1.0,f*f*1.7+q.x*.4)*.85);
  col*=1.0-.45*smoothstep(.3,1.3,d);              // vinheta: bordas escuras (texto legível)
  col+=(h(gl_FragCoord.xy+t)-.5)*.012;             // grão leve: evita faixas no degradê
  gl_FragColor=vec4(col,1.);
}`;

const RANK_COLORS = {
  C: [1, 0.76, 0.2], B: [0.35, 0.66, 1], S: [0.72, 0.55, 1],
};

function normalizedColor(hex) {
  return hex.match(/[a-f\d]{2}/gi).map((channel) => Number.parseInt(channel, 16) / 255);
}

export function initGradient(host) {
  if (!host || document.body.dataset.perf === 'low') return false;
  const canvas = document.createElement('canvas');
  canvas.className = 'gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return false;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return false;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // 1 triângulo cobre a tela
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {
    r: gl.getUniformLocation(prog, 'r'),
    t: gl.getUniformLocation(prog, 't'),
    hi: gl.getUniformLocation(prog, 'hi'),
    deep: gl.getUniformLocation(prog, 'deep'),
    rb: gl.getUniformLocation(prog, 'rb'),
  };

  host.prepend(canvas);
  host.classList.add('gl-on');

  const themeColor = () => normalizedColor(THEMES[document.documentElement.dataset.theme]?.accent ?? THEMES.green.accent);
  const themeDeep = () => normalizedColor(THEMES[document.documentElement.dataset.theme]?.deep ?? THEMES.green.deep);
  let color = themeColor(); let target = color; let rainbow = 0; let rbTarget = 0;
  let time = 12; let last = 0; let raf = 0; let alive = true;

  const size = () => {
    const scale = 0.3;
    const w = Math.max(64, Math.min(520, Math.round(window.innerWidth * scale)));
    const hgt = Math.max(64, Math.min(920, Math.round(window.innerHeight * scale)));
    canvas.width = w; canvas.height = hgt;
    gl.viewport(0, 0, w, hgt);
  };
  const draw = () => {
    gl.uniform2f(U.r, canvas.width, canvas.height);
    gl.uniform1f(U.t, time);
    gl.uniform3f(U.hi, color[0], color[1], color[2]);
    const deep = themeDeep();
    gl.uniform3f(U.deep, deep[0], deep[1], deep[2]);
    gl.uniform1f(U.rb, rainbow);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const mode = () => document.body.dataset.motion ?? 'normal';
  const frame = (now) => {
    raf = 0;
    if (!alive || document.hidden || mode() === 'reduced') return;
    if (now - last >= 33) { // ~30 fps
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      time += dt * (mode() === 'intense' ? 1.7 : 1);
      color = color.map((c, i) => c + (target[i] - c) * 0.06); // desliza até a cor do rank
      rainbow += (rbTarget - rainbow) * 0.05;
      draw();
    }
    raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    const rank = document.body.dataset.rank;
    target = rank === 'A' || !rank ? themeColor() : RANK_COLORS[rank] ?? themeColor();
    rbTarget = rank === 'SSS' ? 1 : 0;
    if (mode() === 'reduced' || document.hidden) {
      color = [...target]; rainbow = rbTarget; draw(); // quadro estático já na cor certa
    }
    if (!raf && !document.hidden && mode() !== 'reduced') { last = performance.now(); raf = requestAnimationFrame(frame); }
  };

  size();
  window.addEventListener('resize', () => { size(); draw(); });
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('forja:motion', sync);
  document.addEventListener('forja:rank', sync);
  document.addEventListener('forja:theme', sync);
  canvas.addEventListener('webglcontextlost', (e) => { // volta ao fundo CSS sem quebrar nada
    e.preventDefault(); alive = false; cancelAnimationFrame(raf); canvas.remove(); host.classList.remove('gl-on');
  });
  draw();
  sync();
  return true;
}
