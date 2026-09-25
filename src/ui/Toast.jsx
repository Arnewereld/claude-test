import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export default function Toast({ toast, onClear }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClear, 3600)
    return () => clearTimeout(t)
  }, [toast, onClear])

  return (
    <div className="toast" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.35 }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
