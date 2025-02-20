const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');
const nameDisplay = document.getElementById('screensaver-name');
if (!gl) {
    alert('WebGL not supported');
    throw new Error('WebGL not supported');
}
const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    void main() {
        gl_Position = aVertexPosition;
    }
`;
const screensavers = [
    {
        name: "Fractal Dimension",
        shader: `
            precision highp float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            vec3 palette(float t) {
                vec3 a = vec3(0.5, 0.5, 0.5);
                vec3 b = vec3(0.5, 0.5, 0.5);
                vec3 c = vec3(1.0, 1.0, 1.0);
                vec3 d = vec3(0.263, 0.416, 0.557);
                return a + b * cos(6.28318 * (c * t + d));
            }
            vec2 rotate(vec2 p, float angle) {
                float s = sin(angle);
                float c = cos(angle);
                return vec2(
                    p.x * c - p.y * s,
                    p.x * s + p.y * c
                );
            }
            float sdBox(vec2 p, vec2 b) {
                vec2 d = abs(p) - b;
                return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
            }
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                vec3 finalColor = vec3(0.0);
                float t = uTime * 0.2;
                for(float i = 0.0; i < 4.0; i++) {
                    vec2 p = uv;
                    float scale = pow(2.0, i);
                    p = rotate(p, t * (0.1 + i * 0.05));
                    p *= scale;
                    for(float j = 0.0; j < 8.0; j++) {
                        p = abs(p) / dot(p,p) - 0.8;
                        p = rotate(p, t * 0.3 + i);
                    }
                    float d = sdBox(p, vec2(0.5));
                    vec3 col = palette(d * 0.1 + t + i * 0.4);
                    col *= 1.0 / (1.0 + abs(d) * 2.0);
                    float alpha = 1.0 / (i + 1.0);
                    finalColor += col * alpha;
                }
                finalColor *= 1.2;
                finalColor = pow(finalColor, vec3(0.8));
                float pulse = 1.0 + 0.1 * sin(t * 3.0);
                finalColor *= pulse;
                finalColor *= uColor;
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    },
    {
        name: "Supernova Explosion",
        shader: `
            precision highp float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            float noise(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                float n = i.x + i.y * 157.0 + 113.0 * i.z;
                vec4 v = fract(sin(vec4(n + vec3(0.0, 37.0, 74.0), n + 111.0)) * 43758.5453);
                return mix(
                    mix(mix(v.x, v.y, f.x),
                        mix(v.z, v.w, f.x), f.y),
                    mix(mix(v.x, v.y, f.x),
                        mix(v.z, v.w, f.x), f.y + 1.0),
                    f.z);
            }
            float fbm(vec3 p) {
                float sum = 0.0;
                float amp = 1.0;
                for (int i = 0; i < 6; i++) {
                    sum += noise(p) * amp;
                    p *= 2.0;
                    amp *= 0.5;
                }
                return sum;
            }
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                float t = uTime * 0.5;
                vec3 p = vec3(uv * 2.0, t * 0.5);
                float dist = length(uv);
                float core = exp(-dist * 4.0);
                float wave = sin(dist * 20.0 - t * 5.0) * exp(-dist * 2.0);
                float plasma = fbm(p * 2.0) * exp(-dist * 3.0);
                float rays = pow(abs(sin(atan(uv.y, uv.x) * 20.0 + t * 2.0)), 3.0) * exp(-dist * 2.0);
                float energy = core + wave + plasma + rays;
                vec3 color1 = vec3(1.0, 0.3, 0.1);
                vec3 color2 = vec3(1.0, 0.6, 0.2);
                vec3 color3 = vec3(0.3, 0.2, 1.0);
                vec3 color = color1 * core +
                            color2 * (wave + rays) +
                            color3 * plasma;
                color += vec3(1.0) * pow(energy, 3.0);
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Color Tunnel",
        shader: `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                float r = length(uv);
                float angle = atan(uv.y, uv.x);
                float color = sin(r * 10.0 - uTime) * sin(angle * 5.0 + uTime);
                vec3 finalColor = vec3(
                    sin(color + uTime) * 0.5 + 0.5,
                    sin(color + uTime * 1.2) * 0.5 + 0.5,
                    sin(color + uTime * 1.4) * 0.5 + 0.5
                );
                finalColor *= uColor;
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    },
    {
        name: "Supernova Explosion2",
        shader: `
            precision highp float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            float random(vec3 p) {
                return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
            }
            float voronoi(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                float minDist = 1.0;
                for (int z = -1; z <= 1; z++) {
                    for (int y = -1; y <= 1; y++) {
                        for (int x = -1; x <= 1; x++) {
                            vec3 neighbor = vec3(float(x), float(y), float(z));
                            vec3 point = neighbor + random(i + neighbor) - f;
                            float dist = length(point);
                            minDist = min(minDist, dist);
                        }
                    }
                }
                return minDist;
            }
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                float t = uTime * 0.5;
                vec3 p = vec3(uv * 2.0, t);
                float dist = length(uv);
                float angle = atan(uv.y, uv.x);
                float explosion = voronoi(p * 4.0) * (1.0 - smoothstep(0.0, 1.5, dist));
                float shockwave = smoothstep(t - 0.1, t, dist) * (1.0 - smoothstep(t, t + 0.1, dist));
                float rays = pow(abs(sin(angle * 20.0 + t * 3.0)), 3.0) * shockwave;
                vec3 color = vec3(1.0, 0.5, 0.2) * explosion * 2.0;
                color += vec3(1.0, 0.8, 0.3) * rays;
                color += vec3(0.8, 0.2, 0.1) * shockwave;
                color += vec3(1.0) * pow(explosion, 4.0);
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Kaleidoscope",
        shader: `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            vec2 rotate(vec2 p, float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
            }
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                float segments = 8.0;
                float angle = atan(uv.y, uv.x);
                float segmentAngle = (2.0 * 3.14159) / segments;
                angle = mod(angle, segmentAngle);
                if (mod(angle, segmentAngle * 2.0) >= segmentAngle) {
                    angle = segmentAngle - mod(angle, segmentAngle);
                }
                uv = length(uv) * vec2(cos(angle), sin(angle));
                uv = rotate(uv, uTime * 0.5);
                vec3 color = vec3(0.5 + 0.5 * sin(uv.x * 5.0 + uTime),
                                0.5 + 0.5 * sin(uv.y * 5.0 + uTime * 1.1),
                                0.5 + 0.5 * sin((uv.x + uv.y) * 5.0 + uTime * 1.2));
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Hypnotic Spiral",
        shader: `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;

            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                float angle = atan(uv.y, uv.x);
                float radius = length(uv);
                float spiral = sin(angle * 8.0 + radius * 10.0 - uTime * 4.0);
                float rings = sin(radius * 20.0 - uTime * 2.0);
                vec3 color = vec3(spiral * rings);
                color.r *= abs(sin(uTime));
                color.g *= abs(cos(uTime * 0.7));
                color.b *= abs(sin(uTime * 1.3));
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Neon Pulse",
        shader: `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                float d = length(uv);
                float rings = sin(d * 10.0 - uTime * 2.0) * 0.5 + 0.5;
                float ripple = sin(d * 20.0 - uTime * 4.0) * 0.5 + 0.5;
                vec3 color = vec3(rings * ripple);
                color.r *= sin(uTime) * 0.5 + 0.5;
                color.b *= cos(uTime) * 0.5 + 0.5;
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Voronoi Pattern",
        shader: `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            vec2 random2(vec2 p) {
                return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
            }
            void main() {
                vec2 uv = gl_FragCoord.xy/uResolution.xy;
                uv *= 5.0;
                vec2 i_uv = floor(uv);
                vec2 f_uv = fract(uv);
                float m_dist = 1.0;
                for(int y=-1; y<=1; y++) {
                    for(int x=-1; x<=1; x++) {
                        vec2 neighbor = vec2(float(x),float(y));
                        vec2 point = random2(i_uv + neighbor);
                        point = 0.5 + 0.5*sin(uTime + 6.2831*point);
                        vec2 diff = neighbor + point - f_uv;
                        float dist = length(diff);
                        m_dist = min(m_dist, dist);
                    }
                }
                vec3 color = vec3(m_dist);
                color.rgb *= 1.0 - vec3(0.8, 0.2, 0.5);
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Fractal Noise",
        shader: `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            float noise(vec2 p) {
                vec2 ip = floor(p);
                vec2 u = fract(p);
                u = u * u * (3.0 - 2.0 * u);
                float res = mix(
                    mix(dot(sin(ip), vec2(127.1,311.7)),
                        dot(sin(ip + vec2(1.0,0.0)), vec2(127.1,311.7)), u.x),
                    mix(dot(sin(ip + vec2(0.0,1.0)), vec2(127.1,311.7)),
                        dot(sin(ip + vec2(1.0,1.0)), vec2(127.1,311.7)), u.x),
                    u.y);
                return res;
            }
            void main() {
                vec2 uv = gl_FragCoord.xy / uResolution.xy;
                float n = 0.0;
                for(float i = 1.0; i < 8.0; i++) {
                    float scale = pow(2.0, i);
                    n += noise(uv * scale + uTime * (0.5 / i)) / scale;
                }
                vec3 color = vec3(0.5 + 0.5 * n);
                color.r *= 0.8 + 0.2 * sin(uTime);
                color.g *= 0.8 + 0.2 * sin(uTime + 2.0);
                color.b *= 0.8 + 0.2 * sin(uTime + 4.0);
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Fractal Spiral",
        shader: `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                vec2 z = uv;
                vec2 c = vec2(cos(uTime * 0.5) * 0.5, sin(uTime * 0.3) * 0.5);
                float iter = 0.0;
                const float maxIter = 100.0;
                for(float i = 0.0; i < maxIter; i++) {
                    if(length(z) > 2.0) break;
                    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
                    iter++;
                }
                vec3 color = vec3(
                    0.5 + 0.5 * cos(iter * 0.1 + uTime),
                    0.5 + 0.5 * cos(iter * 0.1 + uTime + 2.094),
                    0.5 + 0.5 * cos(iter * 0.1 + uTime + 4.188)
                );
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Neural Network",
        shader: `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            float node(vec2 p, vec2 center) {
                return 0.01 / length(p - center);
            }
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                float t = uTime;
                float network = 0.0;
                for(float i = 0.0; i < 10.0; i++) {
                    vec2 pos = vec2(
                        sin(i * 1.0 + t) * 0.5,
                        cos(i * 1.0 + t * 0.5) * 0.5
                    );
                    network += node(uv, pos);
                    for(float j = 0.0; j < 10.0; j++) {
                        vec2 pos2 = vec2(
                            sin(j * 1.0 + t * 1.2) * 0.5,
                            cos(j * 1.0 + t * 0.7) * 0.5
                        );
                        float connection = 0.001 / length(cross(vec3(pos2 - pos, 0.0), vec3(uv - pos, 0.0)));
                        network += connection * sin(t + i + j);
                    }
                }
                vec3 color = vec3(0.1, 0.5, 1.0) * network;
                color *= uColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    {
        name: "Particle Grid Dimension",
        shader: `
            precision highp float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor;
            float particle(vec2 p, vec2 center, float size) {
                float d = length(p - center);
                return size / (d * d);
            }
            vec2 rotate(vec2 p, float angle) {
                float s = sin(angle);
                float c = cos(angle);
                return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
            }
            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                vec3 finalColor = vec3(0.0);
                float t = uTime * 0.3;
                for(float i = 0.0; i < 6.0; i++) {
                    float depth = pow(2.0, i);
                    for(float row = -4.0; row <= 4.0; row++) {
                        vec2 rowOffset = vec2(
                            sin(t * (0.5 + row * 0.1)) * 0.3,
                            row * 0.2 + cos(t * (0.3 + row * 0.1)) * 0.1
                        );
                        for(float col = -4.0; col <= 4.0; col++) {
                            vec2 colOffset = vec2(
                                col * 0.2 + sin(t * (0.4 + col * 0.1)) * 0.1,
                                cos(t * (0.6 + col * 0.1)) * 0.1
                            );
                            vec2 offset = rowOffset + colOffset;
                            vec2 p = rotate(uv * depth + offset, t * (0.2 + i * 0.1));
                            float brightness = particle(p, vec2(0.0), 0.001);
                            vec3 color = vec3(
                                0.6 + 0.4 * sin(i * 0.8 + row * 0.2 + t),
                                0.6 + 0.4 * sin(i * 0.8 + col * 0.2 + t + 2.094),
                                0.6 + 0.4 * sin(i * 0.8 + (row + col) * 0.1 + t + 4.188)
                            );
                            finalColor += color * brightness / depth;
                        }
                    }
                }
                finalColor *= 1.5;
                finalColor = pow(finalColor, vec3(0.7));
                finalColor *= uColor;
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    }
];
let currentScreensaver = 0;
let program = null;
let startTime = Date.now();
let currentColor = [1.0, 1.0, 1.0];
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}
function initBuffers(gl) {
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}
function switchScreensaver(direction) {
    currentScreensaver = (currentScreensaver + direction + screensavers.length) % screensavers.length;
    nameDisplay.textContent = screensavers[currentScreensaver].name;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, screensavers[currentScreensaver].shader);
    if (program) {
        gl.deleteProgram(program);
    }
    program = createProgram(gl, vertexShader, fragmentShader);
    startTime = Date.now();
}
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
function render() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    const positionBuffer = initBuffers(gl);
    const positionAttributeLocation = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    const timeUniformLocation = gl.getUniformLocation(program, 'uTime');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'uResolution');
    const colorUniformLocation = gl.getUniformLocation(program, 'uColor');
    gl.uniform1f(timeUniformLocation, (Date.now() - startTime) / 1000.0);
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    gl.uniform3fv(colorUniformLocation, currentColor);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}
window.addEventListener('resize', resizeCanvas);
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') switchScreensaver(1);
    if (e.key === 'ArrowLeft') switchScreensaver(-1);
});
document.getElementById('fullscreen').addEventListener('click', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        canvas.requestFullscreen();
    }
});
document.getElementById('colorPicker').addEventListener('input', (e) => {
    const hex = e.target.value;
    currentColor = [
        parseInt(hex.substr(1, 2), 16) / 255,
        parseInt(hex.substr(3, 2), 16) / 255,
        parseInt(hex.substr(5, 2), 16) / 255
    ];
});
resizeCanvas();
switchScreensaver(0);
render();