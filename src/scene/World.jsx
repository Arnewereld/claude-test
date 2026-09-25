import { Canvas } from '@react-three/fiber'
import { START_Z, pathX } from '../lib/path.js'
import Atmosphere from './Atmosphere.jsx'
import { Ground, Grass } from './Terrain.jsx'
import Forest from './Forest.jsx'
import Rain from './Rain.jsx'
import Mist from './Mist.jsx'
import Coast from './Coast.jsx'
import Infected from './Infected.jsx'
import Campfire from './Campfire.jsx'
import CameraRig from './CameraRig.jsx'
import Flashlight from './Flashlight.jsx'

export default function World({ phase, time }) {
  const mode = phase === 'running' ? 'run' : time === 'dawn' ? 'dawn' : 'idle'
  const night = time === 'night'
  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 62, near: 0.1, far: 1500, position: [pathX(START_Z), 1.7, START_Z] }}
      onCreated={({ gl }) => gl.setClearColor('#05070a')}
    >
      <Atmosphere time={time} stormy={night && phase === 'login'} />
      <Ground />
      <Grass />
      <Forest />
      <Coast />
      <Campfire />
      <Infected />
      <Mist />
      <Rain />
      <CameraRig mode={mode} />
      <Flashlight on={night} />
    </Canvas>
  )
}
