import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DAWN_Z, START_Z, groundY, pathX } from '../lib/path.js'
import { env, pointer } from '../lib/store.js'

const look = new THREE.Vector3()
const want = new THREE.Vector3()

// idle: standing at the trailhead, looking where your mouse points
// run:  sprinting down the trail after you log in
// dawn: waking up at the edge of the forest, facing the sea
export default function CameraRig({ mode }) {
  const st = useRef({ mode: null, since: 0, z: START_Z, sx: 0, sy: 0 })

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    const s = st.current
    dt = Math.min(dt, 0.05)
    let snap = false
    if (s.mode !== mode) {
      snap = mode !== 'run'
      s.mode = mode
      s.since = t
      s.z = mode === 'dawn' ? DAWN_Z : START_Z
    }
    const e = t - s.since

    const px = pointer.moved ? pointer.x : Math.sin(t * 0.3) * 0.5
    const py = pointer.moved ? pointer.y : -0.1 + Math.sin(t * 0.55) * 0.15
    s.sx = THREE.MathUtils.damp(s.sx, px, 3, dt)
    s.sy = THREE.MathUtils.damp(s.sy, py, 3, dt)

    let fov = 62
    if (mode === 'run') {
      const speed = Math.min(e / 1.1, 1) ** 2 * 12
      env.warp = speed / 12
      s.z -= speed * dt
      const bob = Math.abs(Math.sin(e * 8.6)) * 0.11 * env.warp
      const x = pathX(s.z) + Math.sin(e * 4.3) * 0.07 * env.warp
      camera.position.set(x, groundY(x, s.z) + 1.7 - bob, s.z)
      want.set(pathX(s.z - 9), 1.55, s.z - 9)
      fov = 62 + env.warp * 16
    } else {
      env.warp = THREE.MathUtils.damp(env.warp, 0, 4, dt)
      if (mode === 'dawn') s.z = DAWN_Z - Math.min(e * 0.12, 1.4)
      const x = pathX(s.z)
      const breathe = Math.sin(t * 1.1) * 0.025
      camera.position.set(x, groundY(x, s.z) + (mode === 'dawn' ? 1.6 : 1.7) + breathe, s.z)
      const reach = mode === 'dawn' ? 30 : 10
      const aheadX = mode === 'dawn' ? x + 3 : pathX(s.z - reach)
      want.set(aheadX + s.sx * reach * 0.55, (mode === 'dawn' ? 1.3 : 1.6) + s.sy * reach * 0.28, s.z - reach)
    }

    if (snap) look.copy(want)
    else look.lerp(want, 1 - Math.exp(-dt * (mode === 'run' ? 6 : 4)))
    camera.lookAt(look)
    if (mode === 'run') camera.rotateZ(Math.sin(e * 4.3) * 0.012 * env.warp)
    camera.fov = THREE.MathUtils.damp(camera.fov, fov, 3, dt)
    camera.updateProjectionMatrix()
  })

  return null
}
