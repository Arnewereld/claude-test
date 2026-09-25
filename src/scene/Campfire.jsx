import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { groundY, pathX } from '../lib/path.js'
import { env } from '../lib/store.js'

const cz = -26
const cx = pathX(cz) - 12
export const CAMPFIRE = { x: cx, z: cz, y: groundY(cx, cz) }

const emberVert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  varying float vLife;
  void main() {
    float life = fract(uTime * (.25 + aSeed * .2) + aSeed * 7.);
    vec3 p = position;
    p.y += life * 3.2;
    p.x += sin(life * 6. + aSeed * 20.) * .35 * life;
    p.z += cos(life * 5. + aSeed * 13.) * .25 * life;
    vLife = life;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_PointSize = (60. * (1. - life) + 10.) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`
const emberFrag = /* glsl */ `
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - .5);
    float a = smoothstep(.5, .0, d) * (1. - vLife);
    gl_FragColor = vec4(vec3(1., .55 + .3 * (1. - vLife), .2), a);
    #include <colorspace_fragment>
  }
`

export default function Campfire() {
  const light = useRef()
  const flames = useRef()

  const embers = useMemo(() => {
    const n = 60
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos.set([(Math.random() - 0.5) * 0.5, 0.3, (Math.random() - 0.5) * 0.5], i * 3)
      seed[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: env.time },
      vertexShader: emberVert,
      fragmentShader: emberFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geo, mat }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const flicker = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 29) * 0.06 + Math.random() * 0.12
    light.current.intensity = 26 * flicker * (1 - env.dawn * 0.6)
    flames.current.children.forEach((f, i) => {
      f.scale.set(1, 0.8 + Math.sin(t * (9 + i * 3) + i) * 0.2 + Math.random() * 0.1, 1)
      f.rotation.y = t * (1 + i * 0.4)
    })
  })

  return (
    <group position={[CAMPFIRE.x, CAMPFIRE.y, CAMPFIRE.z]}>
      <pointLight ref={light} color="#ff8a3a" distance={26} decay={2} position={[0, 0.8, 0]} />
      {[0, 1.1, 2.2].map(r => (
        <mesh key={r} rotation={[0, r, Math.PI / 2]} position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 1.1, 5]} />
          <meshStandardMaterial color="#2b1d14" roughness={1} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 0.9) * 0.62, 0.08, Math.sin(i * 0.9) * 0.62]}>
          <dodecahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial color="#3d3f3c" roughness={1} />
        </mesh>
      ))}
      <group ref={flames} position={[0, 0.15, 0]}>
        <mesh position={[0, 0.35, 0]}>
          <coneGeometry args={[0.28, 0.8, 6, 1, true]} />
          <meshBasicMaterial color="#ff6a1a" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.05, 0.3, 0.03]}>
          <coneGeometry args={[0.18, 0.62, 6, 1, true]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.04, 0.22, -0.02]}>
          <coneGeometry args={[0.1, 0.4, 6, 1, true]} />
          <meshBasicMaterial color="#fff0b0" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <points geometry={embers.geo} material={embers.mat} frustumCulled={false} />
    </group>
  )
}
