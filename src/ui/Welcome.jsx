import { motion } from 'motion/react'
import { BloodIcon, FoodIcon, HeartIcon, TempIcon, WaterIcon } from './icons.jsx'

const ease = [0.16, 1, 0.3, 1]
const rootV = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.09, delayChildren: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
}
const itemV = {
  hidden: { opacity: 0, y: 20, rotateX: -30 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease } },
}
const titleV = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } }
const flipV = {
  hidden: { opacity: 0, rotateX: -110, y: 40 },
  show: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 0.9, ease } },
}

export default function Welcome({ session, onLogout, onEnter }) {
  const cold = session.server === 'Sakhal'
  const stats = [
    { label: 'Health', Icon: HeartIcon, c: '#8fae5a', v: 1, val: 'Healthy' },
    { label: 'Blood', Icon: BloodIcon, c: '#c9303a', v: 1, val: '5000 ml' },
    { label: 'Water', Icon: WaterIcon, c: '#6aa6c8', v: 0.64, val: '64%' },
    { label: 'Food', Icon: FoodIcon, c: '#d8a24a', v: 0.41, val: 'Hungry' },
    { label: 'Temp', Icon: TempIcon, c: '#e4d7b6', v: cold ? 0.55 : 0.82, val: cold ? 'Cold' : '36.6°C' },
  ]

  return (
    <motion.section className="welcome" aria-live="polite" variants={rootV} initial="hidden" animate="show" exit="exit">
      <div className="wl">
        <motion.p className="w-day" variants={itemV}>Day 1 · 05:48 · {session.spawn}</motion.p>
        <motion.h2 className="w-title" variants={titleV} aria-label="You are alive.">
          {['You', 'are', 'alive'].map((w, wi) => (
            <span key={w} className="word" aria-hidden="true">
              {w.split('').map((c, i) => (
                <motion.span key={i} className="ch" variants={flipV} style={{ transformPerspective: 500 }}>{c}</motion.span>
              ))}
              {wi === 2 && <motion.span className="ch dot" variants={flipV}>.</motion.span>}
            </span>
          ))}
        </motion.h2>
        <motion.p className="w-sub" variants={itemV}>
          Welcome back, <b>{session.name}</b>. Connected to <b>{session.server}</b>.
        </motion.p>
        <ul className="stats">
          {stats.map((s, i) => (
            <motion.li key={s.label} className="stat" variants={itemV}>
              <s.Icon style={{ color: s.c }} />
              {s.label}
              <span className="track">
                <motion.span
                  className="fill"
                  style={{ background: s.c, boxShadow: `0 0 12px ${s.c}` }}
                  variants={{ hidden: { scaleX: 0 }, show: { scaleX: s.v, transition: { duration: 1.4, delay: 0.9 + i * 0.08, ease } } }}
                />
              </span>
              <span className="val">{s.val}</span>
            </motion.li>
          ))}
        </ul>
        <motion.p className="gear" variants={itemV}>
          <span>Starting gear</span>Flashlight · Road flare · Rag ×2 · Can of baked beans
        </motion.p>
        <motion.div className="w-actions" variants={itemV}>
          <motion.button className="cta" type="button" onClick={onEnter} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            Enter world
          </motion.button>
          <motion.button className="ghost" type="button" onClick={onLogout} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            Log out
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  )
}
