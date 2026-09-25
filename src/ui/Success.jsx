import { motion } from 'motion/react'
import Steps from './Steps.jsx'

const ease = [0.16, 1, 0.3, 1]
const listV = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } } }
const itemV = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }

export default function Success({ email, parcel, tracking, onDashboard, onSignOut }) {
  return (
    <motion.div className="success" variants={listV} initial="hidden" animate="show">
      <svg className="check" viewBox="0 0 64 64" aria-hidden="true">
        <motion.circle
          cx="32" cy="32" r="28"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease }}
        />
        <motion.path
          d="M20 33l8 8 16-17"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.55, ease }}
        />
      </svg>
      <motion.h1 variants={itemV}>You’re signed in!</motion.h1>
      <motion.p className="lead" variants={itemV}>
        Your parcel left the depot and is heading to <b>{email}</b>.
      </motion.p>
      <motion.div variants={itemV}>
        <Steps level={3} />
      </motion.div>
      <motion.dl className="ticket" variants={itemV}>
        <div>
          <dt>Tracking</dt>
          <dd className="mono">{tracking}</dd>
        </div>
        <div>
          <dt>Parcel</dt>
          <dd><span className="dot" style={{ background: parcel?.hex }} />{parcel?.name}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>Out for delivery</dd>
        </div>
      </motion.dl>
      <motion.div className="actions" variants={itemV}>
        <motion.button className="primary" type="button" onClick={onDashboard} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          Go to dashboard
        </motion.button>
        <motion.button className="ghost" type="button" onClick={onSignOut} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          Sign out
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
