"use client";
import { useEffect, useRef } from "react";

// The world: domain-warped haze, wandering glow orbs, light leaks, and a
// concrete/paper grain baked into the same pass so the background itself has texture.
const FRAG = `
precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform float sc;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<6;i++){ v+=a*n(p); p=mat2(1.6,1.2,-1.2,1.6)*p; a*=.5; } return v; }
vec3 orb(vec2 uv, vec2 c, float rad, vec3 col){ float d=length(uv-c); return col * (exp(-d*d/(rad*rad)) ); }
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 p = vec2(uv.x*asp, uv.y + sc*.35) * 1.4;
  float s = t * .03;
  vec2 q = vec2(fbm(p + vec2(0., s)), fbm(p + vec2(5.2, 1.3) - s));
  vec2 w = vec2(fbm(p + 3.*q + vec2(1.7, 9.2) + .12*s), fbm(p + 3.*q + vec2(8.3, 2.8) - .1*s));
  float f = fbm(p + 3.2*w + .25*(m - .5));

  vec3 mist = vec3(.827,.851,.878), bone = vec3(.945,.949,.957), ice = vec3(.737,.824,.91),
       steel = vec3(.62,.66,.70), leak = vec3(.93,.80,.91), glow = vec3(.97,.985,1.);
  vec3 c = mix(steel*.92, mist, smoothstep(.2, .62, f));
  c = mix(c, bone, smoothstep(.5, .9, f));
  c = mix(c, ice, smoothstep(.35, .95, w.y) * .75);
  c = mix(c, leak, smoothstep(.62, 1., q.x) * .3);

  // wandering glow orbs (bloom)
  vec2 a = vec2(uv.x*asp, uv.y);
  vec3 b = vec3(0.);
  b += orb(a, vec2(asp*(.2+.12*sin(t*.05)), .78+.08*cos(t*.04) - sc*.2), .38, glow) * .55;
  b += orb(a, vec2(asp*(.82+.08*cos(t*.035)), .3+.12*sin(t*.045) + sc*.15), .45, ice*1.05) * .5;
  b += orb(a, vec2(asp*(.55+.2*sin(t*.025)), .55+.2*cos(t*.03)), .3, leak) * .22;
  b += orb(a, vec2(m.x*asp, m.y), .22, glow) * .35;
  c = c + b*(1.-c*.75)*.8;

  // light leaks bleeding from the edges
  c = mix(c, leak, smoothstep(.9, 0., length(uv - vec2(1.08, 1.05))) * (.4 + .15*sin(t*.07)));
  c = mix(c, glow, smoothstep(.7, 0., length(uv - vec2(-.08, .4 + .1*sin(t*.03)))) * .45);

  // concrete + paper grain baked in: pits, fibres, fine tooth
  vec2 g = gl_FragCoord.xy;
  float tooth = n(g*.9) * .5 + n(g*.33) * .5;
  float pits = smoothstep(.78, .92, n(g*.12 + 13.)) * .5;
  float fibre = n(vec2(g.x*.008, g.y*.6)) ;
  c *= 1. - (tooth - .5) * .07 - pits * .06 - (fibre - .5) * .035;

  // animated film grain
  c += (h(g + fract(t*7.)*100.) - .5) * .05;
  // vignette
  c *= mix(.86, 1., smoothstep(1.15, .35, length((uv-.5)*vec2(asp*.8,1.))));
  gl_FragColor = vec4(c, 1.);
}`;
const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;

export default function HazeField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const gl = cv.getContext("webgl", { antialias: false });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "a");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (k: string) => gl.getUniformLocation(pr, k);
    const uR = U("r"), uT = U("t"), uM = U("m"), uS = U("sc");

    const mouse = [0.5, 0.5], eased = [0.5, 0.5];
    let scroll = 0, easedScroll = 0;
    const onMove = (e: PointerEvent) => { mouse[0] = e.clientX / innerWidth; mouse[1] = 1 - e.clientY / innerHeight; };
    const onScroll = () => { scroll = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    const k = Math.min(0.75, 1 / (devicePixelRatio || 1));
    const size = () => { cv.width = Math.round(innerWidth * k); cv.height = Math.round(innerHeight * k); gl.viewport(0, 0, cv.width, cv.height); };
    size(); addEventListener("resize", size);

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now() - (Date.now() % 600000);
    let raf = 0, last = 0;
    const frame = (now: number) => {
      eased[0] += (mouse[0] - eased[0]) * 0.04; eased[1] += (mouse[1] - eased[1]) * 0.04;
      easedScroll += (scroll - easedScroll) * 0.06;
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, still ? 40 : (now - t0) / 1000);
      gl.uniform2f(uM, eased[0], eased[1]);
      gl.uniform1f(uS, easedScroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => { raf = requestAnimationFrame(loop); if (document.hidden || now - last < 33) return; last = now; frame(now); };
    if (still) frame(0); else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); removeEventListener("pointermove", onMove); removeEventListener("scroll", onScroll); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -2 }} />;
}
