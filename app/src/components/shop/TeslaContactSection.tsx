'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export function TeslaContactSection() {
  return (
    <section
      className="bg-surface dark:bg-canvas relative flex min-h-[50dvh] w-full snap-start flex-col justify-center overflow-y-auto py-20"
      id="contact"
    >
      {/* Elementos decorativos sutiles */}
      <div className="absolute top-1/4 right-10 -z-10 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 left-10 -z-10 h-72 w-72 rounded-full bg-purple-500/5 blur-3xl" />

      {/* Título de Sección */}
      <div className="px-4 text-center">
        <motion.h2
          className="text-primary text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Contáctanos
        </motion.h2>
        <motion.p
          className="text-secondary mx-auto mt-2 max-w-xl text-sm sm:text-base"
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          ¿Tienes alguna duda sobre nuestras orquídeas, plantas o asesorías de cultivo? Ponte en contacto con nosotros.
        </motion.p>
      </div>

      {/* Contenedor Principal (Grilla Informativa Centrada de 4 Columnas) */}
      <div className="mx-auto mt-12 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* WhatsApp / Teléfono */}
          <motion.div
            className="flex flex-col items-center text-center p-6 bg-canvas dark:bg-surface rounded-xl border border-input-outline/25 dark:border-input-outline/10 shadow-xs"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-4">
              <Phone className="h-6 w-6" />
            </div>
            <h4 className="text-primary text-base font-semibold mb-2">Teléfono / WhatsApp</h4>
            <a
              className="text-secondary text-sm font-medium transition-colors hover:text-emerald-500"
              href="https://wa.me/584121234567"
              rel="noopener noreferrer"
              target="_blank"
            >
              +58 (412) 123-4567
            </a>
          </motion.div>

          {/* Correo */}
          <motion.div
            className="flex flex-col items-center text-center p-6 bg-canvas dark:bg-surface rounded-xl border border-input-outline/25 dark:border-input-outline/10 shadow-xs"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h4 className="text-primary text-base font-semibold mb-2">Correo Electrónico</h4>
            <a
              className="text-secondary text-sm font-medium transition-colors hover:text-emerald-500"
              href="mailto:contacto@pristinoplant.com"
            >
              contacto@pristinoplant.com
            </a>
          </motion.div>

          {/* Ubicación */}
          <motion.div
            className="flex flex-col items-center text-center p-6 bg-canvas dark:bg-surface rounded-xl border border-input-outline/25 dark:border-input-outline/10 shadow-xs"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h4 className="text-primary text-base font-semibold mb-2">Ubicación</h4>
            <p className="text-secondary text-sm leading-relaxed font-medium">
              Invernadero PristinoPlant, Sector Altavista, Ciudad Guayana, Estado Bolívar, Venezuela.
            </p>
          </motion.div>

          {/* Horario */}
          <motion.div
            className="flex flex-col items-center text-center p-6 bg-canvas dark:bg-surface rounded-xl border border-input-outline/25 dark:border-input-outline/10 shadow-xs"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h4 className="text-primary text-base font-semibold mb-2">Horario de Atención</h4>
            <p className="text-secondary text-sm font-medium">Lunes a Sábado: 8:00 AM - 5:00 PM</p>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

