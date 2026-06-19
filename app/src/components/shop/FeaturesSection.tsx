'use client'

import { motion } from 'motion/react'
import { Truck, Sparkles, Award, MapPin } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Envíos por Zoom',
    description:
      'Despachos rápidos a nivel nacional con embalaje protector diseñado para asegurar que tu planta llegue intacta.',
  },
  {
    icon: Sparkles,
    title: 'Asesoría Familiar',
    description:
      'Cada miembro de nuestra familia se especializa en un tipo de planta para ofrecerte asistencia experta post-compra.',
  },
  {
    icon: Award,
    title: 'Cultivo de Especialidad',
    description:
      'Plantas cultivadas en nuestro orquideario con un riguroso proceso de aclimatación y control sanitario.',
  },
  {
    icon: MapPin,
    title: 'Desde Ciudad Guayana',
    description:
      'Orgullosamente locales del estado Bolívar, cultivando y adaptando plantas ideales para el clima venezolano.',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-surface/50 dark:bg-surface/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.div
                key={feature.title}
                className="bg-canvas border-input-outline/50 dark:border-input-outline/20 flex flex-col items-center rounded-2xl border p-6 text-center shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
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
    </section>
  )
}
