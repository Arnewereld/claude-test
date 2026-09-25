import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SEA_Y } from '../lib/path.js'
import { MOON_DIR, SUN_DIR, env } from '../lib/store.js'

// The sea you wake up next to: rippling normals, sky reflection, sun glitter, shore foam.
const vert = /* glsl */ `
  varying vec3 vWorld;
  #include <fog_pars_vertex>
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.);
    vWorld = w.xyz;
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`
const frag = /* glsl */ `
  uniform float uTime, uDawn;
  uniform vec3 uTop, uHor, uSunDir, uMoonDir;
  varying vec3 vWorld;
  #include <fog_pars_fragment>
  void main() {
    vec3 V = normalize(vWorld - cameraPosition);
    vec2 p = vWorld.xz;
    float t = uTime;
    float dx = cos(p.x * .6 + t * 1.2) * .5 + cos(p.x * 1.7 - p.y * .9 + t * 2.1) * .25 + cos((p.x + p.y) * 3.1 + t * 3.) * .12;
    float dz = cos(p.y * .5 + t * .9) * .5 + cos(p.y * 1.9 + p.x * .7 - t * 1.7) * .25 + cos((p.y - p.x) * 2.7 - t * 2.6) * .12;
    float k = .14 * smoothstep(420., 15., length(vWorld - cameraPosition));
    vec3 N = normalize(vec3(-dx * k, 1., -dz * k));
    vec3 R = reflect(V, N);
    R.y = abs(R.y);
    float fres = pow(1. - max(dot(-V, N), 0.), 5.) * .85 + .08;
    vec3 sky = mix(uHor, uTop, smoothstep(0., .45, R.y));
    vec3 deep = mix(vec3(.004, .01, .016), vec3(.05, .1, .13), uDawn);
    vec3 col = mix(deep, sky, fres);
    float s = max(dot(R, uSunDir), 0.);
    col += vec3(1., .78, .52) * (pow(s, 500.) * 7. + pow(s, 45.) * .5) * uDawn;
    float m = max(dot(R, uMoonDir), 0.);
    col += vec3(.5, .55, .62) * pow(m, 300.) * 1.5 * (1. - uDawn);
    float shore = -222. - vWorld.z;
    float wave = sin(t * .6 + vWorld.x * .05) * 1.2;
    float foam = smoothstep(3.5, 0., shore + wave) * (.55 + .45 * sin(vWorld.x * .8 + t * 1.5 + shore * 2.));
    col = mix(col, vec3(.85, .82, .78) * mix(.12, 1., uDawn), clamp(foam, 0., 1.) * .55);
    gl_FragColor = vec4(col, 1.);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

export default function Coast() {
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uDawn: { value: 0 },
          uTop: { value: new THREE.Color() },
          uHor: { value: new THREE.Color() },
          uSunDir: { value: SUN_DIR },
          uMoonDir: { value: MOON_DIR },
        },
      ]),
      vertexShader: vert,
      fragmentShader: frag,
      fog: true,
    })
    m.uniforms.uTime = env.time
    return m
  }, [])

  useFrame(() => {
    mat.uniforms.uDawn.value = env.dawn
    mat.uniforms.uTop.value.copy(env.skyTop)
    mat.uniforms.uHor.value.copy(env.skyHor)
  })

  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_Y, -222 - 700]}>
      <planeGeometry args={[2400, 1400]} />
    </mesh>
  )
}
