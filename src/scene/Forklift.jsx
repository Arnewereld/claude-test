import { useMemo } from 'react'
import * as THREE from 'three'
import { PARK } from './layout.js'
import { Box, Cyl, RBox } from './materials.jsx'

const YELLOW = '#ffc43d'
const DARK = '#353b48'
const TIRE = '#22262e'

function Wheel({ r, w, position, rig }) {
  return (
    <group position={position} ref={el => { if (el && !rig.forkWheels.includes(el)) rig.forkWheels.push(el) }}>
      <Cyl r={r} h={w} color={TIRE} rough={0.9} rotation={[0, 0, Math.PI / 2]} />
      <Cyl r={r * 0.55} h={w + 0.02} color="#cbd5e1" metal={0.3} rotation={[0, 0, Math.PI / 2]} />
    </group>
  )
}

// Forklift facing local +Z, origin on the ground under the chassis.
export default function Forklift({ rig }) {
  const beaconMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#ff8a00', emissive: '#ff7a00', emissiveIntensity: 0.4, roughness: 0.4 })
    rig.beaconMat = m
    return m
  }, [rig])

  return (
    <group ref={el => { rig.forklift = el }} position={[PARK.x, 0, PARK.z]} rotation={[0, PARK.h, 0]}>
      {/* chassis + counterweight */}
      <RBox size={[1.15, 0.72, 1.85]} radius={0.12} color={YELLOW} position={[0, 0.62, -0.18]} />
      <RBox size={[1.22, 0.85, 0.5]} radius={0.14} color={DARK} position={[0, 0.66, -1.08]} />
      <Box size={[1.18, 0.06, 1.9]} color={DARK} position={[0, 0.99, -0.2]} />

      <Wheel rig={rig} r={0.3} w={0.26} position={[0.55, 0.3, 0.52]} />
      <Wheel rig={rig} r={0.3} w={0.26} position={[-0.55, 0.3, 0.52]} />
      <Wheel rig={rig} r={0.25} w={0.22} position={[0.54, 0.25, -0.82]} />
      <Wheel rig={rig} r={0.25} w={0.22} position={[-0.54, 0.25, -0.82]} />

      {/* overhead guard */}
      {[[0.5, 0.38], [-0.5, 0.38], [0.5, -0.78], [-0.5, -0.78]].map(([x, z]) => (
        <Box key={`${x}${z}`} size={[0.06, 1.2, 0.06]} color={DARK} position={[x, 1.6, z]} />
      ))}
      <Box size={[1.1, 0.05, 1.28]} color={DARK} position={[0, 2.22, -0.2]} />
      {[-0.35, -0.12, 0.11, 0.34].map(x => (
        <Box key={x} size={[0.04, 0.05, 1.2]} color="#4b5563" position={[x, 2.2, -0.2]} />
      ))}

      {/* seat, wheel and a driver in a hard hat */}
      <Box size={[0.5, 0.14, 0.45]} color="#1f2937" position={[0, 1.08, -0.45]} />
      <Box size={[0.5, 0.5, 0.1]} color="#1f2937" position={[0, 1.36, -0.68]} />
      <Cyl r={0.03} h={0.5} color="#1f2937" position={[0, 1.2, 0.18]} rotation={[-0.5, 0, 0]} />
      <mesh position={[0, 1.44, 0.07]} rotation={[-1.07, 0, 0]} castShadow>
        <torusGeometry args={[0.14, 0.025, 8, 20]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <group position={[0, 1.15, -0.38]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <capsuleGeometry args={[0.19, 0.3, 4, 10]} />
          <meshStandardMaterial color="#ff8a3d" roughness={0.7} />
        </mesh>
        <Box size={[0.36, 0.06, 0.02]} color="#f1f5f9" position={[0, 0.38, 0.19]} />
        <mesh castShadow position={[0, 0.72, 0.02]}>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color="#f2c6a0" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.78, 0.02]}>
          <sphereGeometry args={[0.165, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={YELLOW} roughness={0.4} />
        </mesh>
        <Box size={[0.36, 0.02, 0.26]} color={YELLOW} position={[0, 0.78, 0.07]} />
      </group>

      {/* rotating beacon */}
      <mesh ref={el => { rig.beacon = el }} position={[0, 2.33, -0.62]} material={beaconMat} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.16, 12]} />
      </mesh>

      {/* headlights */}
      {[-0.42, 0.42].map(x => (
        <mesh key={x} position={[x, 0.82, 0.76]}>
          <boxGeometry args={[0.14, 0.1, 0.04]} />
          <meshStandardMaterial color="#fff7d6" emissive="#fff3c4" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* mast */}
      {[-0.36, 0.36].map(x => (
        <Box key={x} size={[0.08, 2.3, 0.1]} color={DARK} position={[x, 1.2, 0.92]} metal={0.3} />
      ))}
      <Box size={[0.8, 0.08, 0.08]} color={DARK} position={[0, 2.3, 0.92]} />
      <Box size={[0.8, 0.08, 0.08]} color={DARK} position={[0, 0.3, 0.92]} />

      {/* carriage + forks: moved up and down by the director */}
      <group ref={el => { rig.carriage = el }} position={[0, 0.15, 0]}>
        <Box size={[0.9, 0.5, 0.06]} color="#4b5563" position={[0, 0.27, 1.02]} />
        {[-0.26, 0.26].map(x => (
          <group key={x}>
            <Box size={[0.12, 0.05, 1.18]} color="#6b7280" metal={0.5} position={[x, -0.025, 1.64]} />
            <Box size={[0.12, 0.5, 0.05]} color="#6b7280" metal={0.5} position={[x, 0.22, 1.07]} />
          </group>
        ))}
      </group>
    </group>
  )
}
