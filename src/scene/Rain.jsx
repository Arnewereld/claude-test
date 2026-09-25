import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { env } from '../lib/store.js'
import { reduceMotion } from '../lib/util.js'
import { BEAM } from './glsl.js'

// Thousands of rain streaks, animated entirely on the GPU and wrapped around the camera.
const vert = /* glsl */ `
  attribute float aEnd;
  attribute float aSeed;
  uniform float uTime, uWarp;
  uniform vec3 uCam;
  varying float vTail;
  varying float vLit;
  ${BEAM}
  #include <fog_pars_vertex>
  void main() {
    vec3 box = vec3(44., 22., 44.);
    float speed = 15. + aSeed * 9.;
    float fall = mod(position.y * box.y + uTime * speed, box.y);
    vec3 p;
    p.x = uCam.x + mod(position.x * box.x - uCam.x, box.x) - box.x * .5 + fall * .16;
    p.z = uCam.z + mod(position.z * box.z - uCam.z, box.z) - box.z * .5;
    p.y = uCam.y + 12. - fall;
    float len = (.3 + aSeed * .3) * (1. + uWarp * 3.5);
    if (aEnd > .5) {
      p.y += len;
      p.x -= len * .16;
      p.z += uWarp * len * .8;
    }
    vTail = aEnd;
    vLit = beam(p);
    vec4 mvPosition = viewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`
const frag = /* glsl */ `
  uniform float uAmount;
  varying float vTail;
  varying float vLit;
  #include <fog_pars_fragment>
  void main() {
    float a = mix(1., .0, vTail) * (.22 + vLit * .9) * uAmount;
    gl_FragColor = vec4(vec3(.62, .68, .76) * (.55 + vLit * 1.3), a);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

export default function Rain() {
  const { geo, mat } = useMemo(() => {
    const n = reduceMotion ? 2500 : 9000
    const pos = new Float32Array(n * 6)
    const end = new Float32Array(n * 2)
    const seed = new Float32Array(n * 2)
    for (let i = 0; i < n; i++) {
      const x = Math.random(), y = Math.random(), z = Math.random(), s = Math.random()
      pos.set([x, y, z, x, y, z], i * 6)
      end[i * 2 + 1] = 1
      seed[i * 2] = seed[i * 2 + 1] = s
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uWarp: { value: 0 },
          uAmount: { value: 1 },
          uCam: { value: new THREE.Vector3() },
          uLightPos: { value: new THREE.Vector3() },
          uLightDir: { value: new THREE.Vector3() },
          uLightOn: { value: 1 },
        },
      ]),
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      fog: true,
    })
    m.uniforms.uTime = env.time
    return { geo: g, mat: m }
  }, [])

  useFrame(({ camera }) => {
    const u = mat.uniforms
    u.uCam.value.copy(camera.position)
    u.uWarp.value = env.warp
    u.uAmount.value = Math.max(0, 1 - env.dawn * 1.4)
    u.uLightPos.value.copy(env.lightPos)
    u.uLightDir.value.copy(env.lightDir)
    u.uLightOn.value = env.lightOn
  })

  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />
}
