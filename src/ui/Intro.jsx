import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Sound } from '../lib/sound.js'
import { rand, wait } from '../lib/util.js'
import { SoundButton } from './icons.jsx'

const LINES = [
  ['Chernarus. Day 40 of the outbreak.', ''],
  ['The radio went quiet a week ago.', ''],
  ['You wake up in the woods. Still breathing.', 'dim'],
]

export default function Intro({ onDone, soundOn, onToggleSound }) {
  const [lines, setLines] = useState([])
  const [fading, setFading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await wait(500)
      for (const [text, cls] of LINES) {
        if (cancelled) return
        setLines(l => [...l, { text: '', cls }])
        for (const ch of text) {
          if (cancelled) return
          setLines(l => {
            const next = l.slice()
            const last = next[next.length - 1]
            next[next.length - 1] = { ...last, text: last.text + ch }
            return next
          })
          if (ch !== ' ') Sound.blip(rand(1000, 1400), 0.012)
          await wait(/[.,]/.test(ch) ? 160 : rand(18, 36))
        }
        await wait(420)
      }
      if (cancelled) return
      await wait(200)
      setFading(true)
      await wait(700)
      if (!cancelled) onDone(false)
    }
    run()
    const beat = setInterval(() => Sound.beat(1, 60), 1150)
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      onDone(true)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelled = true
      clearInterval(beat)
      window.removeEventListener('keydown', onKey)
    }
  }, [onDone])

  return (
    <motion.div
      className="intro"
      role="dialog"
      aria-label="Intro"
      onClick={() => onDone(true)}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      <motion.div
        className="intro-lines"
        aria-live="polite"
        animate={fading ? { opacity: 0, scale: 0.98, filter: 'blur(4px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8 }}
      >
        {lines.map((l, i) => (
          <p key={i} className={l.cls}>{l.text}</p>
        ))}
      </motion.div>
      <svg className="ecg" viewBox="0 0 180 40" aria-hidden="true">
        <path d="M0 22 H62 L68 22 L73 12 L79 22 L84 22 L89 2 L95 36 L100 16 L105 22 H180" />
      </svg>
      <div className="intro-ui">
        <SoundButton on={soundOn} onToggle={onToggleSound} />
        <span className="hint">Headphones recommended · press any key to skip</span>
        <button
          className="skip"
          type="button"
          onClick={e => {
            e.stopPropagation()
            onDone(true)
          }}
        >
          Skip intro ›
        </button>
      </div>
    </motion.div>
  )
}
