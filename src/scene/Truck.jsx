import { useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../lib/parcel.js'
import { TRUCK_FLOOR, TRUCK_X, TRUCK_Z } from './layout.js'
import { Box, Cyl, RBox, canvasTexture } from './materials.jsx'

const WHITE = '#f7f8fa'
const CAB = '#2563eb'
const DARK = '#2b313c'
const L = 6.2 // cargo length
const H = 2.4 // cargo inner height
const W = 2.5

function Wheel({ x, z, rig }) {
  return (
    <group position={[x, 0.5, z]} ref={el => { if (el && !rig.truckWheels.includes(el)) rig.truckWheels.push(el) }}>
      <Cyl r={0.5} h={0.36} color="#1f232b" rough={0.9} rotation={[Math.PI / 2, 0, 0]} />
      <Cyl r={0.26} h={0.38} color="#cbd5e1" metal={0.4} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

// Box truck with its open rear at local x = 0, driving toward +x.
export default function Truck({ rig }) {
  const { sideMat, doorMat } = useMemo(() => {
    const side = canvasTexture(1024, 400, (g, w, h) => {
      g.fillStyle = WHITE
      g.fillRect(0, 0, w, h)
      g.fillStyle = CAB
      g.beginPath()
      g.moveTo(0, h * 0.78)
      g.bezierCurveTo(w * 0.35, h * 0.62, w * 0.7, h * 0.95, w, h * 0.7)
      g.lineTo(w, h)
      g.lineTo(0, h)
      g.fill()
      // logo mark: a little parcel
      g.save()
      g.translate(90, 150)
      g.fillStyle = CAB
      g.beginPath()
      g.roundRect(0, 0, 110, 110, 22)
      g.fill()
      g.strokeStyle = '#ffffff'
      g.lineWidth = 10
      g.beginPath()
      g.moveTo(55, 18)
      g.lineTo(55, 92)
      g.moveTo(18, 45)
      g.lineTo(92, 45)
      g.stroke()
      g.restore()
      g.fillStyle = '#0f172a'
      g.font = '800 120px "Plus Jakarta Sans Variable", system-ui, sans-serif'
      g.textBaseline = 'middle'
      g.fillText('Depot', 230, 205)
      g.fillStyle = '#64748b'
      g.font = '600 38px "Plus Jakarta Sans Variable", system-ui, sans-serif'
      g.fillText('Your account, delivered.', 236, 290)
    })
    const ridges = canvasTexture(64, 256, (g, w, h) => {
      g.fillStyle = '#e5e9ef'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#c9d0d9'
      for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 4)
    })
    ridges.wrapS = ridges.wrapT = THREE.RepeatWrapping
    ridges.repeat.set(1, 2)
    return {
      sideMat: new THREE.MeshStandardMaterial({ map: side, roughness: 0.55 }),
      doorMat: new THREE.MeshStandardMaterial({ map: ridges, roughness: 0.5, metalness: 0.2 }),
    }
  }, [])

  const cargo = useMemo(
    () => [
      [4.9, 0, -0.6, 0.9], [4.9, 0, 0.5, 0.8], [4.95, 0.85, -0.55, 0.75], [4.0, 0, -0.75, 0.7], [5.0, 0.8, 0.45, 0.7],
    ].map(([x, y, z, s], i) => ({ x, y, z, s, color: i % 2 ? PALETTE[(i * 3) % PALETTE.length].hex : '#c9a06b' })),
    [],
  )

  return (
    <group ref={el => { rig.truck = el }} position={[TRUCK_X, 0, TRUCK_Z]}>
      {/* chassis + wheels */}
      <Box size={[8.2, 0.32, 1.3]} color={DARK} position={[4.2, 0.78, 0]} />
      {[1.1, 2.2, 7.1].map(x => [-1.02, 1.02].map(z => <Wheel key={`${x}${z}`} x={x} z={z} rig={rig} />))}
      <Box size={[0.14, 0.12, 2.3]} color="#94a3b8" position={[-0.05, 0.72, 0]} />
      {[-1, 1].map(s => (
        <mesh key={s} position={[-0.04, 1.02, s * 1.0]}>
          <boxGeometry args={[0.05, 0.16, 0.3]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* cargo box: floor, walls, roof, front */}
      <Box size={[L, 0.14, W]} color="#d7dce3" position={[L / 2, TRUCK_FLOOR - 0.07, 0]} />
      {[-1, 1].map(s => (
        <Box key={s} size={[L, H + 0.1, 0.06]} color={WHITE} position={[L / 2, TRUCK_FLOOR + H / 2, s * (W / 2 - 0.03)]} />
      ))}
      <mesh position={[L / 2, TRUCK_FLOOR + H / 2 + 0.05, W / 2 + 0.002]} material={sideMat}>
        <planeGeometry args={[L - 0.2, H - 0.1]} />
      </mesh>
      <Box size={[L, 0.08, W]} color={WHITE} position={[L / 2, TRUCK_FLOOR + H + 0.08, 0]} />
      <Box size={[0.08, H + 0.1, W]} color={WHITE} position={[L - 0.04, TRUCK_FLOOR + H / 2, 0]} />
      {/* rear frame */}
      {[-1, 1].map(s => (
        <Box key={s} size={[0.14, H + 0.2, 0.14]} color={DARK} position={[0, TRUCK_FLOOR + H / 2, s * (W / 2 - 0.02)]} />
      ))}
      <Box size={[0.14, 0.2, W + 0.04]} color={DARK} position={[0, TRUCK_FLOOR + H + 0.05, 0]} />

      {/* roll-up door, scaled by the director (0 = open, 1 = closed) */}
      <group position={[0.02, TRUCK_FLOOR + H, 0]}>
        <mesh ref={el => { rig.door = el }} material={doorMat} position={[0, -H / 2, 0]} castShadow>
          <boxGeometry args={[0.05, H, W - 0.2]} />
        </mesh>
      </group>

      {/* other people's parcels already on board */}
      {cargo.map((c, i) => (
        <RBox key={i} size={[c.s, c.s * 0.75, c.s]} radius={0.04} color={c.color} position={[c.x, TRUCK_FLOOR + c.y + (c.s * 0.75) / 2, c.z]} />
      ))}

      {/* cab */}
      <RBox size={[2.1, 2.2, W]} radius={0.25} color={CAB} position={[7.45, 2.05, 0]} />
      <RBox size={[0.9, 0.9, W - 0.1]} radius={0.12} color={CAB} position={[6.7, 3.25, 0]} />
      <mesh position={[8.51, 2.45, 0]}>
        <boxGeometry args={[0.04, 0.85, W - 0.3]} />
        <meshStandardMaterial color="#1e293b" roughness={0.15} metalness={0.6} />
      </mesh>
      {[-1, 1].map(s => (
        <mesh key={s} position={[7.75, 2.5, s * (W / 2 + 0.005)]}>
          <boxGeometry args={[0.9, 0.7, 0.02]} />
          <meshStandardMaterial color="#1e293b" roughness={0.15} metalness={0.6} />
        </mesh>
      ))}
      <Box size={[0.2, 0.4, W]} color="#1f2937" position={[8.55, 0.95, 0]} />
      {[-1, 1].map(s => (
        <mesh key={s} position={[8.52, 1.35, s * 0.9]}>
          <boxGeometry args={[0.04, 0.18, 0.4]} />
          <meshStandardMaterial color="#fffbeb" emissive="#fff3c4" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  )
}
