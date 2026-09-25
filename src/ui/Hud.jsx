import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { pointer } from '../lib/store.js'
import { SoundButton } from './icons.jsx'

const fmt = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export default function Hud({ time, cold, soundOn, onToggleSound }) {
  const dawn = time === 'dawn'
  const [minutes, setMinutes] = useState(dawn ? 5 * 60 + 48 : 3 * 60 + 12)
  const gridRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setMinutes(m => m + 1), 1500)
    return () => clearInterval(id)
  }, [])

  // map grid + compass heading follow the mouse
  useEffect(() => {
    const id = setInterval(() => {
      if (!gridRef.current) return
      const gx = String(Math.round(47 + pointer.x * 22)).padStart(3, '0')
      const gy = String(Math.round(112 + pointer.y * 14)).padStart(3, '0')
      const hdg = String(Math.round((312 + pointer.x * 70 + 360) % 360)).padStart(3, '0')
      gridRef.current.textContent = `Grid ${gx} · ${gy}  /  Hdg ${hdg}°`
    }, 120)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div className="hud-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <header className="hud top">
        <div className="hud-l">
          <span className="dot" />
          <span>{fmt(minutes)}</span>
          <span className="sep">/</span>
          <span>{dawn ? (cold ? '-3°C' : '9°C') : '11°C'}</span>
          <span className="sep">/</span>
          <span>{dawn ? 'Fog' : 'Rain'}</span>
        </div>
        <SoundButton on={soundOn} onToggle={onToggleSound} />
      </header>
      <footer className="hud bot">
        <div className="grid-readout" ref={gridRef}>Grid 047 · 112 / Hdg 312°</div>
        <div className="disc">Fan-made concept · not affiliated with Bohemia Interactive</div>
      </footer>
    </motion.div>
  )
}
