import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { env, pointer } from '../lib/store.js'

const dir = new THREE.Vector3()
const offset = new THREE.Vector3()

// A handheld torch that points wherever the mouse is.
export default function Flashlight({ on }) {
  const light = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const st = useRef({ x: 0, y: 0, flickerUntil: 0, nextFlicker: 8 })

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    const s = st.current
    const px = pointer.moved ? pointer.x : Math.sin(t * 0.35) * 0.55
    const py = pointer.moved ? pointer.y : -0.12 + Math.sin(t * 0.6) * 0.18
    s.x = THREE.MathUtils.damp(s.x, px, 9, dt)
    s.y = THREE.MathUtils.damp(s.y, py, 9, dt)

    // hand shake, plus a big bounce while running
    const shake = 0.012 + env.warp * 0.06
    const jx = Math.sin(t * 2.1) * shake + Math.sin(t * 8.6) * env.warp * 0.08
    const jy = Math.cos(t * 1.7) * shake + Math.abs(Math.sin(t * 8.6)) * env.warp * 0.1

    dir.set(s.x + jx, s.y + jy, 0.5).unproject(camera).sub(camera.position).normalize()
    offset.set(0.28, -0.3, 0).applyQuaternion(camera.quaternion)
    light.current.position.copy(camera.position).add(offset)
    target.position.copy(camera.position).addScaledVector(dir, 12)
    target.updateMatrixWorld()

    // cheap torch: it cuts out now and then
    if (t > s.nextFlicker) {
      s.flickerUntil = t + 0.35
      s.nextFlicker = t + 7 + Math.random() * 9
    }
    const flicker = t < s.flickerUntil ? (Math.sin(t * 90) > 0 ? 0.08 : 1) : 1
    const level = on ? 1 : 0
    env.lightOn = THREE.MathUtils.damp(env.lightOn, level, 3, dt)
    light.current.intensity = 420 * env.lightOn * flicker
    env.lightPos.copy(light.current.position)
    env.lightDir.copy(dir)
  })

  return (
    <>
      <spotLight ref={light} target={target} color="#ffe2b8" angle={0.42} penumbra={0.6} distance={55} decay={2} />
      <primitive object={target} />
    </>
  )
}
