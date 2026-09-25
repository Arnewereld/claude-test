import { useMemo } from 'react'
import * as THREE from 'three'
import { BELT_END_X, BELT_START_X, BELT_TOP, BELT_Z, HOPPER_X, PAINT_X } from './layout.js'
import { Box, Cyl, canvasTexture } from './materials.jsx'

const LEN = BELT_END_X - BELT_START_X
const MID = (BELT_START_X + BELT_END_X) / 2
const LEGS = [-9.1, -7.2, -5.2, -3.2, -1.3]

export default function Conveyor({ rig }) {
  const { beltMat, hopperMat, signMat } = useMemo(() => {
    const beltTex = canvasTexture(128, 64, (g, w, h) => {
      g.fillStyle = '#3b4252'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#4c5466'
      for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 7, h)
    })
    beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping
    beltTex.repeat.set(LEN / 0.5, 1)
    rig.beltTex = beltTex

    const signTex = canvasTexture(512, 128, (g, w, h) => {
      g.fillStyle = '#ffffff'
      g.fillRect(0, 0, w, h)
      const grd = g.createLinearGradient(0, 0, w, 0)
      ;['#ff7a59', '#ffc53d', '#2fbf8a', '#4da3ff', '#9b6dff'].forEach((c, i, a) => grd.addColorStop(i / (a.length - 1), c))
      g.fillStyle = grd
      g.fillRect(0, h - 18, w, 18)
      g.fillStyle = '#0f172a'
      g.font = '800 64px "Plus Jakarta Sans Variable", system-ui, sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText('PAINT BOOTH', w / 2, h / 2 - 6)
    })

    return {
      beltMat: new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.85 }),
      hopperMat: new THREE.MeshStandardMaterial({ color: '#dfe5ec', roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide }),
      signMat: new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 }),
    }
  }, [rig])

  const lampMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#94a3b8', emissive: '#22c55e', emissiveIntensity: 0 })
    rig.lampMat = m
    return m
  }, [rig])

  return (
    <group>
      {/* belt + frame */}
      <mesh castShadow receiveShadow position={[MID, BELT_TOP - 0.04, BELT_Z]} material={beltMat}>
        <boxGeometry args={[LEN, 0.08, 1.0]} />
      </mesh>
      <Box size={[LEN, 0.14, 0.96]} color="#cbd3dc" position={[MID, BELT_TOP - 0.15, BELT_Z]} />
      {[-1, 1].map(s => (
        <Box key={s} size={[LEN + 0.16, 0.16, 0.08]} color="#f5b301" position={[MID, BELT_TOP + 0.03, BELT_Z + s * 0.54]} />
      ))}
      {[BELT_START_X, BELT_END_X].map(x => (
        <Cyl key={x} r={0.08} h={1.04} color="#8c96a3" metal={0.4} rotation={[Math.PI / 2, 0, 0]} position={[x, BELT_TOP - 0.05, BELT_Z]} />
      ))}
      {LEGS.map(x =>
        [-1, 1].map(s => (
          <group key={`${x}${s}`} position={[x, 0, BELT_Z + s * 0.42]}>
            <Box size={[0.08, BELT_TOP - 0.22, 0.08]} color="#9aa3ad" position={[0, (BELT_TOP - 0.22) / 2, 0]} />
            <Box size={[0.2, 0.03, 0.2]} color="#7b8591" position={[0, 0.015, 0]} />
          </group>
        )),
      )}

      {/* drop hopper where parcels come in */}
      <mesh position={[HOPPER_X, 2.95, BELT_Z]} rotation={[0, Math.PI / 4, 0]} material={hopperMat} castShadow>
        <cylinderGeometry args={[0.9, 0.62, 0.8, 4, 1, true]} />
      </mesh>
      {[-1, 1].map(s => (
        <Box key={s} size={[0.1, 3.4, 0.1]} color="#9aa3ad" position={[HOPPER_X, 1.7, BELT_Z + s * 0.95]} />
      ))}
      <Box size={[0.1, 0.1, 2.0]} color="#9aa3ad" position={[HOPPER_X, 3.35, BELT_Z]} />

      {/* paint booth */}
      {[-1, 1].map(s => (
        <Box key={s} size={[0.16, 2.25, 0.16]} color="#e2e8f0" position={[PAINT_X, 1.125, BELT_Z + s * 0.74]} />
      ))}
      <Box size={[1.2, 0.55, 1.8]} color="#f8fafc" position={[PAINT_X, 2.5, BELT_Z]} />
      <mesh position={[PAINT_X, 2.5, BELT_Z + 0.905]} material={signMat}>
        <planeGeometry args={[1.2, 0.3]} />
      </mesh>
      {[-0.45, 0, 0.45].map(z => (
        <Cyl key={z} r={0.05} rTop={0.07} h={0.18} color="#64748b" metal={0.5} position={[PAINT_X, 2.14, BELT_Z + z]} />
      ))}
      <mesh position={[PAINT_X, 2.86, BELT_Z]} material={lampMat}>
        <sphereGeometry args={[0.1, 16, 12]} />
      </mesh>
      <Cyl r={0.05} h={0.1} color="#475569" position={[PAINT_X, 2.8, BELT_Z]} />
    </group>
  )
}

