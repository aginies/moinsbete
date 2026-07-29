'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { VisibilityButton } from './visibility-button'

interface CardVisibilityGuardProps {
  isVisible?: boolean
  onToggle?: () => void
  showToggle?: boolean
  buttonColor: 'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange' | 'emerald' | 'indigo'
  label: string
  onExitComplete?: () => void
  children: React.ReactNode
}

const cardVariants = {
  enterHidden: { opacity: 0, rotateY: -90 },
  visible: { opacity: 1, rotateY: 0 },
  exitHidden: { opacity: 0, rotateY: 90 },
}

const buttonVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export function CardVisibilityGuard({
  isVisible = true,
  onToggle,
  showToggle = true,
  buttonColor,
  label,
  onExitComplete,
  children,
}: CardVisibilityGuardProps) {
  return (
    <div style={{ perspective: 1200 }}>
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          if (!isVisible) {
            onExitComplete?.()
          }
        }}
      >
        {isVisible ? (
          <motion.div
            key="card"
            variants={cardVariants}
            initial="enterHidden"
            animate="visible"
            exit="exitHidden"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ backfaceVisibility: "hidden" }}
          >
            {children}
          </motion.div>
        ) : showToggle ? (
          <motion.div
            key="button"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <VisibilityButton color={buttonColor} label={label} onClick={onToggle || (() => {})} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
