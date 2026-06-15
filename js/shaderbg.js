/* ============================================================================
   SNG — WebGL SHADER BACKGROUND
   Full-screen flowing neon plasma (domain-warped fbm) in the brand palette,
   with a soft cursor glow. Renders at half-res @ ~30fps, pauses when the tab
   is hidden. Fails gracefully (returns false) if WebGL is unavailable — the
   CSS orb/gradient stays as the fallback background.

   API:  SNGShaderBG.start(canvasEl) -> boolean (true if running)
   ========================================================================== */
(function () {
  "use strict";

  var VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }",
    "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);",
    "  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }",
    "float fbm(vec2 p){ float v=0.0, a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);",
    "  for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=0.5; } return v; }",
    "void main(){",
    "  vec2 p=(gl_FragCoord.xy-0.5*u_res.xy)/u_res.y;",
    "  float t=u_time*0.05;",
    "  vec2 q=vec2(fbm(p*1.4+t), fbm(p*1.4-t+5.2));",
    "  vec2 r=vec2(fbm(p*1.4+q*1.8+vec2(1.7,9.2)+0.13*t), fbm(p*1.4+q*1.8+vec2(8.3,2.8)-0.11*t));",
    "  float f=fbm(p*1.4+r*2.0);",
    "  vec3 cyan=vec3(0.0,0.9,1.0); vec3 violet=vec3(0.69,0.15,1.0); vec3 mag=vec3(1.0,0.18,0.43);",
    "  vec3 col=mix(violet, cyan, clamp(f*1.4,0.0,1.0));",
    "  col=mix(col, mag, clamp(length(r)*0.5-0.2,0.0,1.0)*0.45);",
    "  col *= 0.10 + 0.85*f*f;",                              // field-driven brightness
    "  float vig=smoothstep(1.25,0.15,length(p)); col*=vig;",
    "  col=mix(vec3(0.027,0.02,0.063), col, 0.85);",          // sit on bg #070510
    "  float md=length(p-u_mouse); col += cyan*0.10*exp(-md*3.2);",
    "  col *= 0.46;",                                         // dim — now visible site-wide, text must stay readable
    "  gl_FragColor=vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }

  function start(canvas) {
    if (!canvas) return false;
    var gl;
    try { gl = canvas.getContext("webgl", { antialias: false, depth: false }) || canvas.getContext("experimental-webgl"); }
    catch (e) { return false; }
    if (!gl) return false;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, "u_res");
    var uTime = gl.getUniformLocation(prog, "u_time");
    var uMouse = gl.getUniformLocation(prog, "u_mouse");

    var scale = 0.5, mx = 0, my = 0, running = true, start0 = performance.now(), last = 0, rt;
    function resize() {
      var w = Math.max(2, Math.floor(window.innerWidth * scale));
      var h = Math.max(2, Math.floor(window.innerHeight * scale));
      canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
    }
    resize();
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    window.addEventListener("mousemove", function (e) {
      mx = (e.clientX / window.innerWidth - 0.5) * (window.innerWidth / window.innerHeight);
      my = -(e.clientY / window.innerHeight - 0.5);
    }, { passive: true });
    document.addEventListener("visibilitychange", function () { running = !document.hidden; });

    function frame(ts) {
      requestAnimationFrame(frame);
      if (!running) return;
      if (ts - last < 33) return; // ~30fps
      last = ts;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start0) / 1000);
      gl.uniform2f(uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
    return true;
  }

  window.SNGShaderBG = { start: start };
})();
