'use client'

import { AnimatePresence, motion } from 'motion/react'
import { ReactNode } from 'react'

interface Props {
  visible: boolean
  children?: ReactNode
}

export function Backdrop({ visible, children }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* ---- Background black ---- */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-xs backdrop-filter"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
