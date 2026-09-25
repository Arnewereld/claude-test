import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Warehouse from './scene/Warehouse.jsx'
import SignInForm from './ui/SignInForm.jsx'
import Success from './ui/Success.jsx'
import { Logo } from './ui/icons.jsx'
import { BRAND, EMAIL_RE, inkOn, parcelFor, trackingNumber } from './lib/parcel.js'
import { store } from './lib/util.js'

const ORDER = ['idle', 'drop', 'belt', 'painted', 'ready', 'approach', 'lift', 'holding', 'reverse', 'toTruck', 'load', 'backoff', 'door', 'drive', 'done']
const at = step => ORDER.indexOf(step)

function statusFor(step, parcel) {
  switch (step) {
    case 'drop': return 'A fresh parcel just dropped onto the belt.'
    case 'belt': return 'Rolling into the paint booth…'
    case 'painted': return `Painted ${parcel?.name.toLowerCase() ?? ''}! Rolling to the pickup point.`
    case 'ready': return 'Packed and ready. Type your password to call the forklift.'
    case 'approach': return 'The forklift is on its way…'
    case 'lift': return 'Lifting your parcel…'
    case 'holding': return 'Parcel picked up. Press Sign in to ship it!'
    case 'reverse': case 'toTruck': return 'Driving your parcel to the truck…'
    case 'load': return 'Loading it into the truck…'
    case 'backoff': case 'door': return 'Closing the truck doors…'
    case 'drive': case 'done': return 'Your parcel is on its way!'
    case 'arrive': case 'reopen': return 'A new truck is backing in…'
    default: return 'Type your email and a parcel drops onto the belt.'
  }
}

export default function App() {
  const remembered = store.get('depot_email') || ''
  const [email, setEmail] = useState(remembered)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(!!remembered)
  const [settled, setSettled] = useState(remembered) // email after the user pauses typing
  const [shipTo, setShipTo] = useState('') // last valid email: the parcel's address
  const [submitted, setSubmitted] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [step, setStep] = useState('idle')
  const [errors, setErrors] = useState({})
  const [tracking, setTracking] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setSettled(email.trim()), 650)
    return () => clearTimeout(t)
  }, [email])

  useEffect(() => {
    if (EMAIL_RE.test(settled)) setShipTo(settled)
  }, [settled])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast])

  const parcel = shipTo ? parcelFor(shipTo) : null

  // How far the warehouse is allowed to go.
  let target = shipTo ? 1 : 0
  if (target && password.length > 0) target = 2
  if (submitted) target = 3
  if (resetting) target = -1

  const onStep = useCallback(s => {
    setStep(s)
    if (s === 'idle') setResetting(false)
  }, [])

  const updateEmail = v => {
    setEmail(v)
    setErrors(e => ({ ...e, email: '' }))
  }
  const updatePassword = v => {
    setPassword(v)
    setErrors(e => ({ ...e, password: '' }))
  }

  const submit = () => {
    const trimmed = email.trim()
    const errs = {
      email: EMAIL_RE.test(trimmed) ? '' : trimmed ? 'That doesn’t look like an email address.' : 'Enter your email so we know where to ship.',
      password: password.length >= 6 ? '' : password ? 'Use at least 6 characters.' : 'Enter your password to call the forklift.',
    }
    setErrors(errs)
    if (errs.email || errs.password) return false
    setSettled(trimmed)
    setShipTo(trimmed)
    if (remember) store.set('depot_email', trimmed)
    else store.del('depot_email')
    setTracking(trackingNumber(trimmed))
    setSubmitted(true)
    return true
  }

  const signOut = () => {
    setSubmitted(false)
    setPassword('')
    setResetting(true)
    setStep('arrive')
    if (!remember) {
      setEmail('')
      setSettled('')
      setShipTo('')
    }
  }

  const idx = at(step)
  const level = idx >= at('drive') ? 3 : idx >= at('holding') ? 2 : idx >= at('painted') ? 1 : 0
  const done = submitted && step === 'done'
  const accent = parcel?.hex ?? BRAND

  return (
    <>
      <div className="scene" aria-hidden="true">
        <Warehouse target={target} colorHex={parcel?.hex ?? null} email={shipTo} onStep={onStep} />
      </div>

      <motion.aside
        className="card"
        style={{ '--accent': accent, '--accent-ink': inkOn(accent) }}
        initial={{ opacity: 0, x: -40, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <header className="brand">
          <Logo />
          <span className="brand-name">Depot</span>
          <span className="pill">Warehouse login</span>
        </header>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="success" initial={{ opacity: 0, rotateY: -25 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: 25 }} transition={{ duration: 0.5 }} style={{ transformPerspective: 900 }}>
              <Success
                email={shipTo}
                parcel={parcel}
                tracking={tracking}
                onDashboard={() => setToast('This is a demo: connect “Go to dashboard” to your app.')}
                onSignOut={signOut}
              />
            </motion.div>
          ) : (
            <motion.div key="signin" initial={{ opacity: 0, rotateY: 25 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -25 }} transition={{ duration: 0.5 }} style={{ transformPerspective: 900 }}>
              <SignInForm
                email={email}
                setEmail={updateEmail}
                password={password}
                setPassword={updatePassword}
                remember={remember}
                setRemember={setRemember}
                parcel={parcel}
                level={level}
                status={statusFor(step, parcel)}
                busy={submitted}
                errors={errors}
                onSubmit={submit}
                onToast={setToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      <div className="toast" role="status" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div key={toast} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
