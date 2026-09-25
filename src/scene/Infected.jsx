import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { groundY, pathX } from '../lib/path.js'
import { env } from '../lib/store.js'
import { Sound } from '../lib/sound.js'
import { rand } from '../lib/util.js'

const skin = new THREE.MeshStandardMaterial({ color: '#7d8272', roughness: 0.9 })
const cloth = new THREE.MeshStandardMaterial({ color: '#3a3e3a', roughness: 1 })
const pants = new THREE.MeshStandardMaterial({ color: '#2d3035', roughness: 1 })

const limb = new THREE.CylinderGeometry(0.06, 0.05, 0.8, 6).translate(0, -0.4, 0)
const arm = new THREE.CylinderGeometry(0.05, 0.04, 0.7, 6).translate(0, -0.35, 0)
const torso = new THREE.CapsuleGeometry(0.19, 0.45, 4, 8)
const head = new THREE.SphereGeometry(0.13, 10, 8)

// Where each infected shambles around, relative to the trail.
const SPAWNS = [
  [-9, 6], [-15, -8], [-24, 10], [-33, -6], [-44, 8], [-3, -12], [-58, -9],
]

function Walker({ spawn }) {
  const g = useRef()
  const parts = useRef({})
  const s = useMemo(() => {
    const [z, off] = spawn
    const x = pathX(z) + off
    const ang = rand(0, Math.PI * 2)
    const a = new THREE.Vector2(x, z)
    const b = new THREE.Vector2(x + Math.cos(ang) * rand(5, 9), z + Math.sin(ang) * rand(5, 9))
    return { pos: a.clone(), a, b, goingTo: b, heading: ang, phase: rand(0, 10), alert: 0, groaned: 0, speedMul: rand(0.8, 1.2) }
  }, [spawn])

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    const p = parts.current
    g.current.visible = env.dawn < 0.5
    if (!g.current.visible) return

    // Did the flashlight catch us?
    const wp = new THREE.Vector3(s.pos.x, groundY(s.pos.x, s.pos.y) + 1.3, s.pos.y)
    const toW = wp.clone().sub(env.lightPos)
    const dist = toW.length()
    if (env.lightOn > 0.5 && dist < 28 && toW.normalize().dot(env.lightDir) > 0.955) {
      if (s.alert <= 0 && t - s.groaned > 6) {
        Sound.groan()
        s.groaned = t
      }
      s.alert = 4
    }
    s.alert -= dt

    const cam = new THREE.Vector2(camera.position.x, camera.position.z)
    const target = s.alert > 0 ? cam : s.goingTo
    const toT = target.clone().sub(s.pos)
    const want = Math.atan2(toT.y, toT.x)
    let diff = want - s.heading
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    s.heading += diff * Math.min(1, dt * (s.alert > 0 ? 3 : 1.2))

    let speed = (s.alert > 0 ? 0.9 : 0.32) * s.speedMul
    if (s.alert > 0 && toT.length() < 6.5) speed = 0
    if (s.alert <= 0 && toT.length() < 0.6) s.goingTo = s.goingTo === s.b ? s.a : s.b

    s.pos.x += Math.cos(s.heading) * speed * dt
    s.pos.y += Math.sin(s.heading) * speed * dt
    s.phase += dt * (1.2 + speed * 6)

    const sw = Math.sin(s.phase)
    g.current.position.set(s.pos.x, groundY(s.pos.x, s.pos.y) + Math.abs(sw) * 0.04, s.pos.y)
    g.current.rotation.y = -s.heading + Math.PI / 2
    p.body.rotation.z = Math.sin(s.phase * 0.5) * 0.12
    p.body.rotation.x = 0.28 + Math.sin(s.phase) * 0.04
    p.legL.rotation.x = sw * 0.45 * Math.min(1, speed * 3 + 0.2)
    p.legR.rotation.x = -sw * 0.45 * Math.min(1, speed * 3 + 0.2)
    p.armL.rotation.x = -1.1 + Math.sin(s.phase * 0.7) * 0.15 - (s.alert > 0 ? 0.35 : 0)
    p.armR.rotation.x = -0.9 + Math.sin(s.phase * 0.7 + 1) * 0.15 - (s.alert > 0 ? 0.45 : 0)
    p.head.rotation.z = 0.35 + Math.sin(t * 0.8 + s.phase) * 0.1
  })

  const set = k => el => { parts.current[k] = el }
  return (
    <group ref={g}>
      <group position={[0, 0.9, 0]}>
        <mesh ref={set('legL')} geometry={limb} material={pants} position={[-0.1, 0, 0]} />
        <mesh ref={set('legR')} geometry={limb} material={pants} position={[0.1, 0, 0]} />
        <group ref={set('body')}>
          <mesh geometry={torso} material={cloth} position={[0, 0.4, 0]} />
          <mesh ref={set('armL')} geometry={arm} material={cloth} position={[-0.25, 0.62, 0]} />
          <mesh ref={set('armR')} geometry={arm} material={cloth} position={[0.25, 0.62, 0]} />
          <mesh ref={set('head')} geometry={head} material={skin} position={[0.02, 0.98, 0.06]} />
        </group>
      </group>
    </group>
  )
}

export default function Infected() {
  return SPAWNS.map((sp, i) => <Walker key={i} spawn={sp} />)
}
