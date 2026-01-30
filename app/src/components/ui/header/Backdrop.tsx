'use client'

import { AnimatePresence, motion } from 'motion/react'

interface Props {
  isNavbarOpen: boolean
}

export function Backdrop({ isNavbarOpen }: Props) {
  return (
    <AnimatePresence>
      {isNavbarOpen && (
        <>
          {/* ---- Background black ---- */}
          <motion.div
            animate={{ opacity: 0.3 }}
            className="fixed top-0 left-0 z-10 h-dvh w-dvw bg-black"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />

          {/* ---- Blur Backdrop ---- */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed top-0 left-0 z-5 h-dvh w-dvw backdrop-blur-xs backdrop-filter"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        </>
      )}
    </AnimatePresence>
  )
}
