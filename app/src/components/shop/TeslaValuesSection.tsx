'use client'

import { motion } from 'motion/react'
import { Truck, Sparkles, Award, MapPin } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Envíos',
    description: 'Despachos rápidos a nivel nacional con embalaje protector diseñado a medida.',
  },
  {
    icon: Sparkles,
    title: 'Asesoría Familiar',
    description:
      'Cada miembro de nuestra familia se especializa en un tipo de planta para guiarte.',
  },
  {
    icon: Award,
    title: 'Cultivo de Especialidad',
    description: 'Plantas aclimatadas y cultivadas bajo riguroso control en nuestro orquideario.',
  },
  {
    icon: MapPin,
    title: 'Desde Ciudad Guayana',
    description: 'Orgullosamente locales del estado Bolívar, ideales para el clima venezolano.',
  },
]

export function TeslaValuesSection() {
  return (
    <section className="bg-surface dark:bg-canvas relative flex h-screen w-full snap-start flex-col justify-between overflow-hidden pt-24 pb-16">
      {/* Elementos decorativos sutiles */}
      <div className="absolute top-1/3 left-10 -z-10 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute right-10 bottom-1/3 -z-10 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />

      {/* Título de Sección */}
      <div className="px-4 pt-4 text-center">
        <motion.h2
          className="text-primary text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Nuestra Promesa
        </motion.h2>
        <motion.p
          className="text-secondary mt-2 text-sm sm:text-base"
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          La dedicación de un orquideario familiar en cada detalle de tu compra
        </motion.p>
      </div>

      {/* Grid de Características */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.div
                key={feature.title}
                className="bg-canvas border-input-outline/50 dark:border-input-outline/10 flex flex-col items-center rounded-2xl border p-6 text-center shadow-sm sm:p-8"
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: '-50px' }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-primary mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="text-secondary mt-2 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Margen inferior para balance visual */}
      <div className="h-4" />
    </section>
  )
}
