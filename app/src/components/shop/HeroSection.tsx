'use client'

import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  const handleScrollToProducts = () => {
    const element = document.getElementById('productos-destacados')

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Orbes de fondo difuminados para dar profundidad premium */}
      <div className="absolute top-1/4 -left-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
      <div className="absolute -right-1/4 bottom-1/4 -z-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/5" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-400"
            initial={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <span>🌸</span> Orquideario Familiar en Ciudad Guayana
          </motion.div>

          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="text-primary mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Especialistas en{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-purple-400">
              Orquídeas de Colección
            </span>
          </motion.h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-secondary mx-auto mt-6 max-w-2xl text-lg md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Cultivamos y seleccionamos con dedicación familiar piezas botánicas únicas. Cada miembro
            de nuestra familia se especializa en el cuidado de variedades de orquídeas y plantas
            exóticas, aclimatadas y con envíos seguros por Zoom a nivel nacional.
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <button
              className="group flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-600/20 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              type="button"
              onClick={handleScrollToProducts}
            >
              Explorar Colección
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
