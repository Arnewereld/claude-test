export const NOISE = /* glsl */ `
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float hash13(vec3 p3) {
    p3 = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3. - 2. * f);
    return mix(mix(hash12(i), hash12(i + vec2(1., 0.)), u.x),
               mix(hash12(i + vec2(0., 1.)), hash12(i + vec2(1., 1.)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0., a = .5;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; }
    return v;
  }
`

// Brightness boost for anything inside the flashlight cone (fakes volumetric light).
export const BEAM = /* glsl */ `
  uniform vec3 uLightPos;
  uniform vec3 uLightDir;
  uniform float uLightOn;
  float beam(vec3 p) {
    vec3 d = p - uLightPos;
    float dist = length(d);
    float cone = smoothstep(0.86, 0.975, dot(d / max(dist, 0.001), uLightDir));
    return cone * smoothstep(38., 3., dist) * uLightOn;
  }
`
