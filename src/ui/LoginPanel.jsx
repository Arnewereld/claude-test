import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate, useMotionTemplate, useSpring, useTransform } from 'motion/react'
import { Sound } from '../lib/sound.js'
import { clamp, finePointer, rand, store, wait } from '../lib/util.js'
import { EyeIcon, LockIcon, UserIcon } from './icons.jsx'

const ease = [0.16, 1, 0.3, 1]

// The whole panel flies in from deep in the fog, and when you log in
// you run straight through it.
const panelV = {
  hidden: { opacity: 0, z: -520, rotateX: 32, y: 80 },
  show: { opacity: 1, z: 0, rotateX: 0, y: 0, transition: { duration: 1.2, ease } },
  exit: { opacity: 0, z: 650, rotateX: -6, y: 30, filter: 'blur(10px)', transition: { duration: 0.85, ease: [0.55, 0, 0.9, 0.35] } },
}
const listV = { hidden: {}, show: { transition: { staggerChildren: 0.065, delayChildren: 0.35 } } }
const itemV = {
  hidden: { opacity: 0, y: 18, rotateX: -35 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.7, ease } },
}
const logoV = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } }
const letterV = {
  hidden: { opacity: 0, rotateY: -100, y: 24 },
  show: { opacity: 1, rotateY: 0, y: 0, transition: { duration: 0.9, ease } },
}

const SERVERS = [
  { id: 'Chernarus', region: 'EU', size: '225 km²', pop: 57, max: 60, ping: 34 },
  { id: 'Livonia', region: 'EU', size: '163 km²', pop: 41, max: 60, ping: 58 },
  { id: 'Sakhal', region: 'NA', size: '230 km²', pop: 22, max: 50, ping: 112 },
]

function Ping({ ms }) {
  const q = ms < 50 ? 4 : ms < 90 ? 3 : ms < 140 ? 2 : 1
  return (
    <span className={'ping' + (q <= 2 ? ' mid' : '')} title={`${ms} ms`} aria-label={`${ms} ms ping`}>
      {[0, 1, 2, 3].map(i => <i key={i} className={i < q ? 'on' : ''} />)}
    </span>
  )
}

function Err({ msg, id }) {
  return (
    <AnimatePresence initial={false}>
      {msg && (
        <motion.p
          key={msg}
          id={id}
          className="err"
          role="alert"
          initial={{ opacity: 0, height: 0, x: -8 }}
          animate={{ opacity: 1, height: 'auto', x: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

export default function LoginPanel({ onSubmit, onHurt, onToast }) {
  const [name, setName] = useState(() => store.get('dz_survivor') || '')
  const [pass, setPass] = useState('')
  const [remember, setRemember] = useState(() => !!store.get('dz_survivor'))
  const [server, setServer] = useState('Chernarus')
  const [servers, setServers] = useState(SERVERS)
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [caps, setCaps] = useState(false)
  const [busy, setBusy] = useState(false)
  const nameRef = useRef(null)
  const passRef = useRef(null)
  const [scope, animate] = useAnimate()

  // 3D tilt toward the cursor, with a moving glare
  const tiltX = useSpring(0, { stiffness: 110, damping: 16 })
  const tiltY = useSpring(0, { stiffness: 110, damping: 16 })
  const gx = useTransform(tiltY, [-7, 7], [15, 85])
  const gy = useTransform(tiltX, [6, -6], [5, 95])
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,236,210,.09), transparent 55%)`

  useEffect(() => {
    if (!finePointer) return
    const onMove = e => {
      tiltY.set((e.clientX / window.innerWidth - 0.5) * 12)
      tiltX.set(-(e.clientY / window.innerHeight - 0.5) * 10)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [tiltX, tiltY])

  useEffect(() => {
    if (finePointer) {
      const t = setTimeout(() => (name ? passRef : nameRef).current?.focus({ preventScroll: true }), 1300)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // live-ish server numbers
  useEffect(() => {
    const id = setInterval(() => {
      setServers(list => list.map(s => ({
        ...s,
        pop: Math.random() < 0.45 ? s.pop : clamp(s.pop + (Math.random() < 0.55 ? 1 : -1), Math.floor(s.max * 0.4), s.max),
        ping: clamp(Math.round(s.ping + rand(-6, 6)), 18, 180),
      })))
    }, 2600)
    return () => clearInterval(id)
  }, [])

  const submit = async e => {
    e.preventDefault()
    if (busy) return
    const n = name.trim()
    const errs = {
      name: !n ? 'Every survivor needs a name.' : n.length < 3 ? 'Too short. Use at least 3 characters.' : '',
      pass: !pass ? 'No password, no way in.' : pass.length < 4 ? 'That lock won’t hold. Use 4+ characters.' : '',
    }
    setErrors(errs)
    if (errs.name || errs.pass) {
      onHurt()
      animate(scope.current, { x: [0, -12, 11, -9, 8, -5, 3, 0] }, { duration: 0.55 })
      ;(errs.name ? nameRef : passRef).current?.focus()
      return
    }
    setBusy(true)
    if (remember) store.set('dz_survivor', n)
    else store.del('dz_survivor')
    setPass('')
    await wait(900)
    onSubmit({ name: n, server })
  }

  const type = setter => e => {
    setter(e.target.value)
    setErrors(er => ({ ...er, [e.target.id]: '' }))
    Sound.blip(rand(1100, 1500), 0.015)
  }
  const capsCheck = e => e.getModifierState && setCaps(e.getModifierState('CapsLock'))

  return (
    <motion.div className="panel-3d" style={{ transformPerspective: 1100 }} variants={panelV} initial="hidden" animate="show" exit="exit">
      <div ref={scope}>
        <motion.section
          className="panel"
          aria-labelledby="logo"
          style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 900 }}
          variants={listV}
        >
          <motion.div className="glare" style={{ background: glare }} />
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <motion.div
            className="scan"
            initial={{ top: '0%', opacity: 0 }}
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
          />

          <motion.div className="strip" variants={itemV}>
            <span className="rec"><i />Live</span>
            <span>Survivor auth · v1.26</span>
            <span className="signal" aria-hidden="true"><i /><i /><i /><i /></span>
          </motion.div>

          <motion.h1 className="logo" id="logo" data-text="DAYZ" variants={logoV} aria-label="DayZ">
            {'DAYZ'.split('').map((c, i) => (
              <motion.span key={i} className="ch" variants={letterV} style={{ transformPerspective: 400 }} aria-hidden="true">{c}</motion.span>
            ))}
          </motion.h1>
          <motion.div
            className="slash"
            aria-hidden="true"
            variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.9, delay: 0.5, ease } } }}
          />
          <motion.p className="tagline" variants={itemV}>Stay alive. Trust no one.</motion.p>

          <form onSubmit={submit} noValidate autoComplete="on">
            <motion.div className={'field' + (errors.name ? ' bad' : '')} variants={itemV}>
              <label className="lbl" htmlFor="name">Survivor name</label>
              <div className="control">
                <UserIcon className="ico i" />
                <input
                  ref={nameRef}
                  id="name"
                  name="username"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="off"
                  maxLength={24}
                  placeholder="e.g. Hunter_from_Cherno"
                  value={name}
                  onChange={type(setName)}
                  aria-invalid={!!errors.name}
                  aria-describedby="name-err"
                />
                <span className="bar" />
              </div>
              <Err msg={errors.name} id="name-err" />
            </motion.div>

            <motion.div className={'field' + (errors.pass ? ' bad' : '')} variants={itemV}>
              <label className="lbl" htmlFor="pass">
                Password
                <AnimatePresence>
                  {caps && (
                    <motion.span className="caps" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      Caps lock on
                    </motion.span>
                  )}
                </AnimatePresence>
              </label>
              <div className="control">
                <LockIcon className="ico i" />
                <input
                  ref={passRef}
                  id="pass"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={pass}
                  onChange={type(setPass)}
                  onKeyDown={capsCheck}
                  onKeyUp={capsCheck}
                  onBlur={() => setCaps(false)}
                  aria-invalid={!!errors.pass}
                  aria-describedby="pass-err"
                />
                <button
                  type="button"
                  className={'eye' + (showPass ? ' on' : '')}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  aria-pressed={showPass}
                  onClick={() => {
                    setShowPass(v => !v)
                    passRef.current?.focus()
                  }}
                >
                  <EyeIcon />
                </button>
                <span className="bar" />
              </div>
              <Err msg={errors.pass} id="pass-err" />
            </motion.div>

            <motion.fieldset className="servers" variants={itemV}>
              <legend className="lbl">Server</legend>
              <div className="srv-grid">
                {servers.map(s => (
                  <motion.label key={s.id} className="srv" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                    <input type="radio" name="server" value={s.id} checked={server === s.id} onChange={() => setServer(s.id)} />
                    <span className="srv-card">
                      <b>{s.id}</b>
                      <small>{s.region} · {s.size}</small>
                      <span className="srv-meta">
                        <span>{s.pop}/{s.max}</span>
                        <Ping ms={s.ping} />
                      </span>
                    </span>
                  </motion.label>
                ))}
              </div>
            </motion.fieldset>

            <motion.div className="row" variants={itemV}>
              <label className="check">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <span className="box" />
                Remember me
              </label>
              <button type="button" className="link" onClick={() => onToast('Password resets go through your server admin. Next time, write it in your notebook.')}>
                Forgot password?
              </button>
            </motion.div>

            <motion.button
              className={'cta' + (busy ? ' busy' : '')}
              type="submit"
              variants={itemV}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
            >
              {busy && <span className="spin" aria-hidden="true" />}
              <span>{busy ? 'Connecting' : 'Wake up'}</span>
            </motion.button>

            <motion.p className="foot" variants={itemV}>
              New survivor?{' '}
              <button type="button" className="link" onClick={() => onToast('Character creation isn’t wired up yet. Plug this page into your own backend.')}>
                Create a character
              </button>
            </motion.p>
          </form>
        </motion.section>
      </div>
    </motion.div>
  )
}
