import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Props from './Props.jsx'
import Conveyor from './Conveyor.jsx'
import Forklift from './Forklift.jsx'
import Truck from './Truck.jsx'
import Parcel from './Parcel.jsx'
import Spray from './Spray.jsx'
import Director from './Director.jsx'

export default function Warehouse({ target, colorHex, email, onStep }) {
  // Handles to the moving parts, filled in by each model and animated by the director.
  const rig = useMemo(() => ({ forkWheels: [], truckWheels: [] }), [])

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ fov: 34, near: 0.1, far: 220, position: [-8, 16, 30] }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <color attach="background" args={['#eef1f5']} />
      <fog attach="fog" args={['#eef1f5', 28, 66]} />
      <hemisphereLight args={['#ffffff', '#d6cec2', 1.3]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[7, 14, 9]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={14}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <Props />
      <Conveyor rig={rig} />
      <Forklift rig={rig} />
      <Truck rig={rig} />
      <Parcel rig={rig} email={email} />
      <Spray rig={rig} />
      <Director rig={rig} target={target} colorHex={colorHex} onStep={onStep} />
    </Canvas>
  )
}
