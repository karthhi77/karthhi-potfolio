/**
 * Liquid Background - WebGL Fluid Shader
 * Creates organic liquid glass refraction, chromatic dispersion, and interactive ripples.
 */

class LiquidBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    this.useFallback = !this.gl;

    this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, speed: 0 };
    this.lastMouse = { x: 0.5, y: 0.5 };
    this.ripples = [];
    this.time = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.init();
  }

  init() {
    if (this.useFallback) {
      this.initCanvas2DFallback();
    } else {
      this.initWebGL();
    }

    this.bindEvents();
    this.resize();
    this.animate();
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.targetX = (e.clientX - rect.left) / rect.width;
      this.mouse.targetY = 1.0 - (e.clientY - rect.top) / rect.height; // Invert Y for WebGL
      
      const dx = this.mouse.targetX - this.lastMouse.x;
      const dy = this.mouse.targetY - this.lastMouse.y;
      this.mouse.speed = Math.sqrt(dx * dx + dy * dy);
      this.lastMouse.x = this.mouse.targetX;
      this.lastMouse.y = this.mouse.targetY;
    });

    window.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      this.addRipple(x, y);
    });
  }

  addRipple(x, y) {
    this.ripples.push({
      x, y,
      age: 0,
      maxAge: 60,
      intensity: 1.0
    });
    if (this.ripples.length > 8) this.ripples.shift();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      if (this.uResolution) {
        this.gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
      }
    }
  }

  initWebGL() {
    const gl = this.gl;

    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = (aPosition + 1.0) * 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Liquid Glass Refraction with Chromatic Aberration & Metaballs
    const fsSource = `
      precision highp float;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uTime;
      uniform vec3 uRipples[8]; // x, y, age/progress
      varying vec2 vUv;

      // Simplex-inspired organic noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
        vec2 pos = uv * aspect;

        // Fluid distortion based on multi-scale noise
        float t = uTime * 0.22;
        vec2 q = vec2(
          snoise(pos * 1.5 + vec2(t * 0.3, t * 0.2)),
          snoise(pos * 1.5 + vec2(-t * 0.2, t * 0.4))
        );

        vec2 r = vec2(
          snoise(pos * 2.2 + q * 1.8 + vec2(1.7, 9.2) + 0.15 * t),
          snoise(pos * 2.2 + q * 1.8 + vec2(8.3, 2.8) + 0.126 * t)
        );

        // Interaction distortion from mouse
        vec2 mouseDist = (uv - uMouse) * aspect;
        float d = length(mouseDist);
        float mouseInfluence = smoothstep(0.45, 0.0, d) * 0.25;
        r += normalize(mouseDist + 0.0001) * mouseInfluence;

        // Ripple influence
        for(int i = 0; i < 8; i++) {
          if (uRipples[i].z > 0.0) {
            vec2 rDist = (uv - uRipples[i].xy) * aspect;
            float rLen = length(rDist);
            float wave = sin(rLen * 45.0 - uRipples[i].z * 10.0) * exp(-rLen * 4.0);
            r += normalize(rDist + 0.001) * wave * (1.0 - uRipples[i].z) * 0.08;
          }
        }

        // Pure pitch-black void with metallic chromatic fluid reflections
        vec3 colA = vec3(0.00, 0.00, 0.00); // Deep Pitch Black Void
        vec3 colB = vec3(0.20, 0.85, 1.00); // Chrome Cyan
        vec3 colC = vec3(0.55, 0.20, 0.85); // Chrome Violet
        vec3 colD = vec3(0.95, 0.40, 0.65); // Iridescent Shimmer

        // Liquid Chromatic Aberration: sample R, G, B channels at refractive offsets
        float dispersion = 0.018;
        float redVal = clamp(snoise(pos + r + vec2(dispersion, 0.0)), 0.0, 1.0);
        float greenVal = clamp(snoise(pos + r), 0.0, 1.0);
        float blueVal = clamp(snoise(pos + r - vec2(dispersion, 0.0)), 0.0, 1.0);

        vec3 color = colA;
        color = mix(color, colC, smoothstep(0.0, 0.7, redVal * 0.85));
        color = mix(color, colB, smoothstep(0.3, 0.9, greenVal * 0.7));
        color = mix(color, colD, smoothstep(0.5, 1.0, blueVal * 0.6));

        // Specular highlight gleam on liquid crests
        float crest = pow(clamp(dot(q, r), 0.0, 1.0), 3.0);
        color += vec3(1.0) * crest * 0.35;

        // Subtle vignette
        float vignette = 1.0 - smoothstep(0.4, 1.4, length((uv - 0.5) * aspect));
        color *= vignette;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const program = this.createProgram(gl, vsSource, fsSource);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    this.program = program;
    this.uResolution = gl.getUniformLocation(program, 'uResolution');
    this.uMouse = gl.getUniformLocation(program, 'uMouse');
    this.uTime = gl.getUniformLocation(program, 'uTime');
    this.uRipples = gl.getUniformLocation(program, 'uRipples');
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('WebGL shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(gl, vsSource, fsSource) {
    const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
  }

  initCanvas2DFallback() {
    this.ctx = this.canvas.getContext('2d');
  }

  animate() {
    this.time += 0.016;

    // Smooth mouse lerping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // Update ripples
    const activeRipples = [];
    const rippleUniformData = new Float32Array(8 * 3);

    for (let i = 0; i < this.ripples.length; i++) {
      const rip = this.ripples[i];
      rip.age += 1;
      const progress = rip.age / rip.maxAge;
      if (progress < 1.0) {
        activeRipples.push(rip);
        if (i < 8) {
          rippleUniformData[i * 3 + 0] = rip.x;
          rippleUniformData[i * 3 + 1] = rip.y;
          rippleUniformData[i * 3 + 2] = progress;
        }
      }
    }
    this.ripples = activeRipples;

    if (this.gl && this.program) {
      const gl = this.gl;
      gl.useProgram(this.program);
      gl.uniform2f(this.uMouse, this.mouse.x, this.mouse.y);
      gl.uniform1f(this.uTime, this.time);
      gl.uniform3fv(this.uRipples, rippleUniformData);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else if (this.ctx) {
      // 2D Canvas fallback
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const grad = ctx.createRadialGradient(
        this.mouse.x * w, (1 - this.mouse.y) * h, 50,
        w * 0.5, h * 0.5, Math.max(w, h) * 0.8
      );
      grad.addColorStop(0, '#00f2fe22');
      grad.addColorStop(0.4, '#7928ca1a');
      grad.addColorStop(1, '#06070c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.LiquidBackground = LiquidBackground;
