import { useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../lib/parcel.js'
import { rand } from '../lib/util.js'
import { PARK, TRUCK_X, TRUCK_Z } from './layout.js'
import { Box, Cyl, RBox, canvasTexture } from './materials.jsx'

function Floor() {
  const hatch = useMemo(() => {
    const t = canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#facc15'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#1f2937'
      g.lineWidth = 34
      for (let i = -h; i < w + h; i += 90) {
        g.beginPath()
        g.moveTo(i, 0)
        g.lineTo(i + h, h)
        g.stroke()
      }
    })
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 1.5)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })
  }, [])

  const line = (x, z, w, d, color = '#f5c542') => (
    <mesh key={`${x}${z}${w}`} position={[x, 0.006, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color="#ebe7e1" roughness={0.9} />
      </mesh>
      {/* lane markings */}
      {line(1, 4.4, 30, 0.12)}
      {line(1, -2.3, 30, 0.12)}
      {Array.from({ length: 14 }, (_, i) => line(-12 + i * 2.2, 5.3, 1.1, 0.12, '#94a3b8'))}
      {/* forklift parking bay */}
      {line(PARK.x, PARK.z + 1.5, 1.8, 0.08, '#ffffff')}
      {line(PARK.x - 0.9, PARK.z, 0.08, 3, '#ffffff')}
      {line(PARK.x + 0.9, PARK.z, 0.08, 3, '#ffffff')}
      {/* loading zone behind the truck */}
      <mesh position={[TRUCK_X - 0.9, 0.005, TRUCK_Z]} rotation={[-Math.PI / 2, 0, 0]} material={hatch} receiveShadow>
        <planeGeometry args={[1.4, 3.2]} />
      </mesh>
    </group>
  )
}

function Racks() {
  const shelves = useMemo(() => {
    const bays = []
    for (let x = -13; x <= 14; x += 2.8) {
      const boxes = []
      for (const y of [0.3, 1.66, 3.02]) {
        let bx = x - 1.2
        while (bx < x + 1.0) {
          const s = rand(0.45, 0.8)
          if (Math.random() < 0.8) {
            boxes.push({ x: bx + s / 2, y: y + 0.04 + (s * 0.8) / 2, s, color: Math.random() < 0.55 ? '#c9a06b' : PALETTE[Math.floor(Math.random() * PALETTE.length)].hex })
          }
          bx += s + rand(0.05, 0.25)
        }
      }
      bays.push({ x, boxes })
    }
    return bays
  }, [])

  return (
    <group position={[0, 0, -6.2]}>
      {shelves.map(b => (
        <group key={b.x}>
          {[-1.4, 1.4].map(dx => [-0.5, 0.5].map(dz => (
            <Box key={`${dx}${dz}`} size={[0.1, 4.3, 0.1]} color="#4c7cf0" position={[b.x + dx, 2.15, dz]} />
          )))}
          {[0.3, 1.66, 3.02].map(y => (
            <group key={y}>
              {[-0.5, 0.5].map(dz => <Box key={dz} size={[2.8, 0.12, 0.08]} color="#f59e0b" position={[b.x, y, dz]} />)}
              <Box size={[2.8, 0.04, 1.0]} color="#d6dbe2" position={[b.x, y + 0.02, 0]} />
            </group>
          ))}
          {b.boxes.map((bx, i) => (
            <RBox key={i} size={[bx.s, bx.s * 0.8, 0.8]} radius={0.03} color={bx.color} position={[bx.x, bx.y, 0]} />
          ))}
        </group>
      ))}
    </group>
  )
}

function Cone({ position }) {
  return (
    <group position={position}>
      <Box size={[0.42, 0.04, 0.42]} color="#f97316" position={[0, 0.02, 0]} />
      <Cyl r={0.17} rTop={0.03} h={0.62} color="#f97316" position={[0, 0.33, 0]} />
      <Cyl r={0.12} rTop={0.085} h={0.1} color="#ffffff" position={[0, 0.36, 0]} />
    </group>
  )
}

function Pallets({ position, count = 4 }) {
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} position={[0, i * 0.16, 0]} rotation={[0, (i % 2) * 0.05, 0]}>
          <Box size={[1.2, 0.04, 1.0]} color="#d8ad72" rough={0.9} position={[0, 0.13, 0]} />
          {[-0.5, 0, 0.5].map(x => <Box key={x} size={[0.14, 0.1, 1.0]} color="#c49a60" rough={0.9} position={[x, 0.05, 0]} />)}
        </group>
      ))}
    </group>
  )
}

export default function Props() {
  return (
    <>
      <Floor />
      <Racks />
      <mesh position={[0, 7, -8]} receiveShadow>
        <planeGeometry args={[140, 14]} />
        <meshStandardMaterial color="#f3f1ed" roughness={1} />
      </mesh>
      {[-12, -4, 4, 12].map(x => (
        <mesh key={x} position={[x, 6.3, -7.98]}>
          <planeGeometry args={[5, 1.6]} />
          <meshStandardMaterial color="#dbe8f5" emissive="#eef6ff" emissiveIntensity={0.4} />
        </mesh>
      ))}
      <Cone position={[TRUCK_X - 0.3, 0, TRUCK_Z + 2.1]} />
      <Cone position={[TRUCK_X - 0.3, 0, TRUCK_Z - 2.1]} />
      <Cone position={[-10.6, 0, 1.2]} />
      <Pallets position={[-11.2, 0, -0.6]} />
      <Pallets position={[-3.2, 0, 2.6]} count={3} />
    </>
  )
}
