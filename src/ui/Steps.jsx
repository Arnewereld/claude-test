import { motion } from 'motion/react'
import { BoxIcon, ForkliftIcon, TruckIcon } from './icons.jsx'

const STEPS = [
  { label: 'Packed', Icon: BoxIcon },
  { label: 'Picked up', Icon: ForkliftIcon },
  { label: 'Shipped', Icon: TruckIcon },
]

// level: 0 = nothing yet, 1 = packed, 2 = picked up, 3 = shipped
export default function Steps({ level }) {
  return (
    <ol className="steps" aria-label="Parcel progress">
      <span className="steps-track" aria-hidden="true">
        <motion.span
          className="steps-fill"
          initial={false}
          animate={{ scaleX: level <= 1 ? 0 : (level - 1) / 2 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </span>
      {STEPS.map(({ label, Icon }, i) => {
        const done = level >= i + 1
        return (
          <li key={label} className={done ? 'done' : level === i ? 'next' : ''} aria-current={level === i ? 'step' : undefined}>
            <motion.span
              className="bubble"
              initial={false}
              animate={done ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.45 }}
            >
              <Icon size={16} />
            </motion.span>
            <span className="step-label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
