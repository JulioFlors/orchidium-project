'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react'

export function TeslaContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulación de envío
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
    setFormData({ name: '', email: '', message: '' })

    // Ocultar mensaje de éxito después de 5 segundos
    setTimeout(() => setIsSubmitted(false), 5000)
  }

  return (
    <section
      className="bg-surface dark:bg-canvas relative flex min-h-dvh w-full snap-start flex-col justify-between overflow-y-auto pt-24 pb-16"
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
          ¿Tienes alguna duda sobre nuestras orquídeas, plantas o asesorías de cultivo? Escríbenos y
          te responderemos lo antes posible.
        </motion.p>
      </div>

      {/* Contenedor Principal */}
      <div className="mx-auto mt-8 flex w-full max-w-7xl grow items-center px-4 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Información de Contacto */}
          <motion.div
            className="flex flex-col justify-center space-y-6 lg:col-span-5"
            initial={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div className="space-y-4">
              <h3 className="text-primary text-xl font-semibold">Información del Orquideario</h3>
              <p className="text-secondary text-sm leading-relaxed">
                Estamos ubicados en Ciudad Guayana, cultivando plantas sanas y perfectamente
                adaptadas a las condiciones climáticas de nuestra región.
              </p>
            </div>

            <div className="space-y-4">
              {/* WhatsApp / Teléfono */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-primary text-sm font-semibold">Teléfono / WhatsApp</h4>
                  <a
                    className="text-secondary text-sm transition-colors hover:text-emerald-500"
                    href="https://wa.me/584121234567"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    +58 (412) 123-4567
                  </a>
                </div>
              </div>

              {/* Correo */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-primary text-sm font-semibold">Correo Electrónico</h4>
                  <a
                    className="text-secondary text-sm transition-colors hover:text-emerald-500"
                    href="mailto:contacto@pristinoplant.com"
                  >
                    contacto@pristinoplant.com
                  </a>
                </div>
              </div>

              {/* Ubicación */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-primary text-sm font-semibold">Ubicación</h4>
                  <p className="text-secondary text-sm">
                    Invernadero PristinoPlant, Sector Altavista, Ciudad Guayana, Estado Bolívar,
                    Venezuela.
                  </p>
                </div>
              </div>

              {/* Horario */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-primary text-sm font-semibold">Horario de Atención</h4>
                  <p className="text-secondary text-sm">Lunes a Sábado: 8:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Formulario */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div className="bg-canvas border-input-outline/50 dark:border-input-outline/10 rounded-2xl border p-6 shadow-sm sm:p-8">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-primary mb-1.5 block text-sm font-semibold" htmlFor="name">
                    Nombre completo
                  </label>
                  <input
                    required
                    className="border-input-outline/50 bg-surface dark:bg-canvas text-primary w-full rounded-lg border px-4 py-2.5 text-sm transition duration-200 placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    id="name"
                    name="name"
                    placeholder="Ej. Juan Pérez"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label
                    className="text-primary mb-1.5 block text-sm font-semibold"
                    htmlFor="email"
                  >
                    Correo electrónico
                  </label>
                  <input
                    required
                    className="border-input-outline/50 bg-surface dark:bg-canvas text-primary w-full rounded-lg border px-4 py-2.5 text-sm transition duration-200 placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    id="email"
                    name="email"
                    placeholder="correo@ejemplo.com"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label
                    className="text-primary mb-1.5 block text-sm font-semibold"
                    htmlFor="message"
                  >
                    Mensaje
                  </label>
                  <textarea
                    required
                    className="border-input-outline/50 bg-surface dark:bg-canvas text-primary min-h-32 w-full resize-none rounded-lg border px-4 py-2.5 text-sm transition duration-200 placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    id="message"
                    name="message"
                    placeholder="Escribe tu mensaje o consulta..."
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-2">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar Mensaje
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Mensaje de Éxito */}
              {isSubmitted && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400"
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span className="text-sm">
                    ¡Mensaje enviado con éxito! Te responderemos muy pronto.
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Margen inferior */}
      <div className="h-4" />
    </section>
  )
}
