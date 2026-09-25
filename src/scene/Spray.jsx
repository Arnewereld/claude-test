import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rand } from '../lib/util.js'
import { BELT_Z, PAINT_X } from './layout.js'
import { canvasTexture } from './materials.jsx'

// Paint mist from the booth nozzles. The director sets where it sprays and in which color.
export default function Spray({ rig }) {
  const { geo, mat, parts } = useMemo(() => {
    const n = 420
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3).fill(-100), 3))
    const dot = canvasTexture(64, 64, (c, w, h) => {
      const grd = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
      grd.addColorStop(0, 'rgba(255,255,255,1)')
      grd.addColorStop(0.6, 'rgba(255,255,255,.8)')
      grd.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = grd
      c.fillRect(0, 0, w, h)
    })
    const m = new THREE.PointsMaterial({ size: 0.09, map: dot, transparent: true, depthWrite: false, opacity: 0.9 })
    return { geo: g, mat: m, parts: Array.from({ length: n }, () => ({ life: 0, x: 0, y: -100, z: 0, vx: 0, vy: 0, vz: 0, floor: 0 })) }
  }, [])

  if (!rig.spray) rig.spray = { emit: 0, color: new THREE.Color('#ffffff'), at: new THREE.Vector3(PAINT_X, 2.1, BELT_Z), spread: 0.5 }

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const s = rig.spray
    mat.color.copy(s.color)
    let spawn = s.emit * dt * 800
    const arr = geo.attributes.position.array
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      if (p.life <= 0 && spawn >= 1) {
        spawn -= 1
        p.life = rand(0.3, 0.55)
        p.x = s.at.x + rand(-0.3, 0.3)
        p.y = s.at.y
        p.z = s.at.z + rand(-s.spread, s.spread)
        p.vx = rand(-0.5, 0.5)
        p.vy = rand(-3.6, -2.2)
        p.vz = rand(-0.5, 0.5)
        p.floor = s.at.y - 1.25
      }
      if (p.life > 0) {
        p.life -= dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.z += p.vz * dt
        if (p.y < p.floor) p.life = 0
      }
      arr[i * 3] = p.x
      arr[i * 3 + 1] = p.life > 0 ? p.y : -100
      arr[i * 3 + 2] = p.z
    }
    geo.attributes.position.needsUpdate = true
  })

  return <points geometry={geo} material={mat} frustumCulled={false} />
}
