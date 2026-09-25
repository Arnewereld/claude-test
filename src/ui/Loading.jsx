import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { clamp, reduceMotion, wait } from '../lib/util.js'

const TIPS = [
  'Boil water from ponds before you drink it. Cholera kills more survivors than the infected.',
  'Crouch past the infected. Sprinting pulls every one of them within a hundred metres.',
  'Keep a rag in every pocket. Bleeding out is still the most common way to die.',
  'Wet clothes steal body heat. Find shelter and a fire before the night does it for you.',
  'Friendly? Say it on direct chat before they decide for you.',
  'A can of beans and a working flashlight are worth more than a rifle with no ammo.',
]
const STAGES = [
  [0, 'Authenticating survivor…'],
  [16, 'Syncing character data…'],
  [34, 'Loading {map} terrain…'],
  [58, 'Spawning infected…'],
  [78, 'Checking for bandits…'],
  [93, 'Waking up…'],
]
// Loading bars never move smoothly: stall, jump, stall.
const CURVE = [[0, 0], [0.12, 0.18], [0.26, 0.22], [0.44, 0.55], [0.58, 0.6], [0.78, 0.88], [0.9, 0.91], [1, 1]]
const progress = t => {
  for (let i = 1; i < CURVE.length; i++) {
    if (t <= CURVE[i][0]) {
      const [x0, y0] = CURVE[i - 1]
      const [x1, y1] = CURVE[i]
      return y0 + ((y1 - y0) * (t - x0)) / (x1 - x0)
    }
  }
  return 1
}

export default function Loading({ server, onDone }) {
  const [p, setP] = useState(0)
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length))
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    let raf
    let cancelled = false
    const total = reduceMotion ? 1200 : 5400
    const start = performance.now()
    const tick = now => {
      const t = clamp((now - start) / total, 0, 1)
      setP(progress(t))
      if (t < 1) raf = requestAnimationFrame(tick)
      else wait(450).then(() => !cancelled && done.current())
    }
    raf = requestAnimationFrame(tick)
    const tipTimer = setInterval(() => setTip(i => (i + 1) % TIPS.length), 2600)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearInterval(tipTimer)
    }
  }, [])

  const pct = Math.round(p * 100)
  const stage = STAGES.filter(([at]) => pct >= at).pop()[1].replace('{map}', server)

  return (
    <motion.section className="loading" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <motion.div
        className="topo"
        animate={{ scale: [1, 1.14], x: ['0%', '-3%'], y: ['0%', '2%'] }}
        transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
      />
      <div className="ld">
        <p className="ld-kicker"><i />Connecting to server</p>
        <h2 className="ld-map" aria-label={server}>
          {server.split('').map((c, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              style={{ transformPerspective: 500 }}
              initial={{ y: '110%', rotateX: -80, opacity: 0 }}
              animate={{ y: '0%', rotateX: 0, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.055, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {c}
            </motion.span>
          ))}
        </h2>
        <div className="ld-bar"><motion.i style={{ scaleX: p }} /></div>
        <div className="ld-row"><span>{stage}</span><span>{pct}%</span></div>
        <div className="tip">
          <b>Survival tip</b>
          <AnimatePresence mode="wait">
            <motion.p key={tip} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              {TIPS[tip]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  )
}
