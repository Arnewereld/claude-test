import { useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { ArrowIcon, EyeIcon, LockIcon, MailIcon } from './icons.jsx'
import Steps from './Steps.jsx'

const ease = [0.16, 1, 0.3, 1]
const listV = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }
const itemV = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }

function Err({ id, msg }) {
  return (
    <AnimatePresence initial={false}>
      {msg && (
        <motion.p
          key={msg}
          id={id}
          className="err"
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
        >
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

export default function SignInForm({
  email, setEmail, password, setPassword, remember, setRemember,
  parcel, level, status, busy, errors, onSubmit, onToast,
}) {
  const [showPass, setShowPass] = useState(false)
  const [scope, animate] = useAnimate()
  const passRef = useRef(null)

  const submit = e => {
    e.preventDefault()
    if (!onSubmit()) animate(scope.current, { x: [0, -10, 9, -7, 5, -2, 0] }, { duration: 0.45 })
  }

  return (
    <motion.div ref={scope} className="signin" variants={listV} initial="hidden" animate="show">
      <motion.h1 variants={itemV}>Welcome back</motion.h1>
      <motion.p className="lead" variants={itemV}>
        Sign in and watch your account get packed, picked up and shipped.
      </motion.p>
      <motion.div variants={itemV}>
        <Steps level={level} />
      </motion.div>

      <form onSubmit={submit} noValidate>
        <motion.div variants={itemV} className={'field' + (errors.email ? ' bad' : '')}>
          <label htmlFor="email">Email</label>
          <div className="control">
            <MailIcon className="ico" />
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              spellCheck={false}
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby="email-err"
              disabled={busy}
            />
            <AnimatePresence>
              {parcel && (
                <motion.span
                  key={parcel.hex}
                  className="swatch"
                  title={`Your parcel color: ${parcel.name}`}
                  style={{ background: parcel.hex }}
                  initial={{ scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                />
              )}
            </AnimatePresence>
          </div>
          <Err id="email-err" msg={errors.email} />
        </motion.div>

        <motion.div variants={itemV} className={'field' + (errors.password ? ' bad' : '')}>
          <label htmlFor="password">Password</label>
          <div className="control">
            <LockIcon className="ico" />
            <input
              ref={passRef}
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby="password-err"
              disabled={busy}
            />
            <button
              type="button"
              className="eye"
              aria-label={showPass ? 'Hide password' : 'Show password'}
              aria-pressed={showPass}
              onClick={() => {
                setShowPass(v => !v)
                passRef.current?.focus()
              }}
            >
              <EyeIcon off={!showPass} />
            </button>
          </div>
          <Err id="password-err" msg={errors.password} />
        </motion.div>

        <motion.div variants={itemV} className="row">
          <label className="check">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span className="box" aria-hidden="true" />
            Remember me
          </label>
          <button type="button" className="link" onClick={() => onToast('Password reset isn’t connected yet. Hook it up to your backend.')}>
            Forgot password?
          </button>
        </motion.div>

        <motion.button variants={itemV} className="primary" type="submit" disabled={busy} whileHover={busy ? undefined : { y: -2 }} whileTap={busy ? undefined : { scale: 0.98 }}>
          {busy ? (
            <>
              <span className="spin" aria-hidden="true" />
              Shipping your parcel…
            </>
          ) : (
            <>
              Sign in
              <ArrowIcon size={18} />
            </>
          )}
        </motion.button>
      </form>

      <motion.div variants={itemV} className="status" aria-live="polite">
        <span className="pulse" aria-hidden="true" />
        <AnimatePresence mode="wait">
          <motion.span key={status} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {status}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <motion.p variants={itemV} className="foot">
        New to Depot?{' '}
        <button type="button" className="link" onClick={() => onToast('Sign-up isn’t connected yet. Hook it up to your backend.')}>
          Create an account
        </button>
      </motion.p>
    </motion.div>
  )
}
