import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { groundY, pathX } from '../lib/path.js'
import { env } from '../lib/store.js'
import { rand } from '../lib/util.js'
import { BEAM, NOISE } from './glsl.js'

// Soft ground-hugging fog banks: camera-facing quads with animated noise.
const vert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  varying vec2 vUv;
  varying float vSeed;
  varying float vLit;
  ${BEAM}
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vSeed = aSeed;
    vec4 center = instanceMatrix * vec4(0., 0., 0., 1.);
    center.x += sin(uTime * .05 + aSeed * 6.28) * 3.;
    vec4 mvPosition = modelViewMatrix * center;
    vec2 scale = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
    mvPosition.xy += position.xy * scale;
    vec3 world = (inverse(viewMatrix) * mvPosition).xyz;
    vLit = beam(world);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity, uTime;
  varying vec2 vUv;
  varying float vSeed;
  varying float vLit;
  ${NOISE}
  #include <fog_pars_fragment>
  void main() {
    vec2 p = vUv - .5;
    float a = smoothstep(.5, .08, length(p * vec2(1., 1.7)));
    a *= smoothstep(.28, .8, fbm(vUv * 2.6 + vec2(uTime * .025 + vSeed * 9., vSeed * 4.)));
    vec3 col = uColor * (1. + vLit * 2.2);
    gl_FragColor = vec4(col, a * uOpacity * (1. + vLit * 1.2));
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

const NIGHT = new THREE.Color('#46535f')
const DAWN = new THREE.Color('#f3d2b8')

export default function Mist() {
  const ref = useRef()
  const { geo, mat, items } = useMemo(() => {
    const list = []
    for (let i = 0; i < 170; i++) {
      const z = rand(30, -215)
      const x = pathX(z) + rand(-30, 30)
      const w = rand(9, 18)
      const h = w * rand(0.28, 0.4)
      list.push({ x, z, y: groundY(x, Math.min(z, -150)) + h * 0.3, w, h })
    }
    const g = new THREE.PlaneGeometry(1, 1)
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(Float32Array.from(list, () => Math.random()), 1))
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uColor: { value: NIGHT.clone() },
          uOpacity: { value: 0.3 },
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
    return { geo: g, mat: m, items: list }
  }, [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    items.forEach((it, i) => {
      m.makeScale(it.w, it.h, 1).setPosition(it.x, it.y, it.z)
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])

  useFrame(() => {
    const u = mat.uniforms
    u.uColor.value.copy(NIGHT).lerp(DAWN, env.dawn)
    u.uOpacity.value = 0.3 + env.dawn * 0.12
    u.uLightPos.value.copy(env.lightPos)
    u.uLightDir.value.copy(env.lightDir)
    u.uLightOn.value = env.lightOn
  })

  return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} renderOrder={2} />
}
