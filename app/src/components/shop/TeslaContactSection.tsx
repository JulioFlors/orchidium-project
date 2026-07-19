'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, MapPin, Clock, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react'

export function TeslaContactSection() {
  const [copied, setCopied] = useState(false)
  const [invernaderoStatus, setInvernaderoStatus] = useState({
    isOpen: false,
    text: 'Cargando estado...',
  })

  // ---- Verificación de Estado Abierto/Cerrado (Caracas UTC-4) ----
  useEffect(() => {
    const checkStatus = () => {
      const now = new Date()
      // Obtener hora local de Caracas desfasando UTC por -4 horas
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000
      const caracasDate = new Date(utcTime - 4 * 3600000)

      const day = caracasDate.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      const hours = caracasDate.getHours()

      // Abierto de Lunes (1) a Sábado (6) de 8:00 a. m. (8) a 5:00 p. m. (17)
      const isOpen = day >= 1 && day <= 6 && hours >= 8 && hours < 17

      setInvernaderoStatus({
        isOpen,
        text: isOpen ? 'Abierto ahora' : 'Cerrado en este momento',
      })
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000)

    return () => clearInterval(interval)
  }, [])

  // ---- Copiar Correo al Portapapeles ----
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('contacto@pristinoplant.com')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error al copiar correo:', err)
    }
  }

  // Estilo de cuadrícula de puntos tipo Google Stitch
  const dotPatternStyle = {
    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)',
    backgroundSize: '20px 20px',
  }

  return (
    <section
      className="bg-surface dark:bg-canvas relative flex w-full flex-col justify-center overflow-hidden px-5 pt-[54px] pb-[16px]"
      id="contact"
    >
      {/* Bento Grid Principal */}
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* ================= CARD 1: WHATSAPP (2/3 columnas) ================= */}
          <motion.div
            className="bg-canvas dark:bg-surface border-input-outline/25 dark:border-input-outline/10 group relative flex h-[360px] flex-col justify-between overflow-hidden rounded-3xl border p-8 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            style={dotPatternStyle}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/15" />

            <div className="flex h-full flex-col items-start justify-between gap-6 md:flex-row">
              {/* Contenido Izquierda */}
              <div className="z-10 flex h-full max-w-md flex-col justify-between">
                <div>
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    WhatsApp
                  </span>
                  <h3 className="text-primary mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Asesoría en línea
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed sm:text-base">
                    Recibe atención inmediata y personalizada para resolver tus dudas de cultivo,
                    consultar disponibilidad de especies de colección o coordinar tus despachos.
                  </p>
                </div>

                <div className="mt-6 md:mt-0">
                  <a
                    className="group/btn inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-500 hover:shadow-emerald-500/20"
                    href="https://wa.me/+584148724205"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Iniciar chat
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </a>
                </div>
              </div>

              {/* Visual Celular de Chat Derecha */}
              <div className="relative z-10 hidden h-full w-64 items-end justify-center overflow-hidden md:flex">
                <div className="flex h-[220px] w-[220px] rotate-[-3deg] flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-950/90 p-3 shadow-2xl transition-all duration-500 group-hover:rotate-0">
                  {/* Header Chat */}
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-white">PristinoPlant</span>
                  </div>
                  {/* Conversación */}
                  <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                    <motion.div
                      className="max-w-[85%] self-start rounded-lg bg-zinc-800 p-2 text-[10px] text-white"
                      initial={{ opacity: 0, x: -10 }}
                      transition={{ delay: 0.6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                    >
                      ¡Hola! ¿Tienen Cattleya Mossiae en floración disponible?
                    </motion.div>
                    <motion.div
                      className="max-w-[85%] self-end rounded-lg bg-emerald-600/20 p-2 text-[10px] text-emerald-300"
                      initial={{ opacity: 0, x: 10 }}
                      transition={{ delay: 1.2 }}
                      whileInView={{ opacity: 1, x: 0 }}
                    >
                      Sí, las tenemos en floración listas para entregar.
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 2: CORREO ELECTRÓNICO (1/3 columnas) ================= */}
          <motion.div
            className="bg-canvas dark:bg-surface border-input-outline/25 dark:border-input-outline/10 group relative flex h-[360px] flex-col justify-between overflow-hidden rounded-3xl border p-8 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            style={dotPatternStyle}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl transition-all duration-500 group-hover:bg-purple-500/15" />

            <div className="z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-primary mb-2 text-xl font-bold tracking-tight sm:text-2xl">
                  Correo Electrónico
                </h3>
                <p className="text-secondary text-sm leading-relaxed">
                  Para consultas formales, solicitudes corporativas o eventos especiales.
                </p>
                <div className="dark:bg-canvas/60 mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/45 p-3">
                  <span className="text-primary text-xs font-semibold select-all sm:text-sm">
                    contacto@pristinoplant.com
                  </span>
                  <button
                    className="text-secondary rounded-lg p-1.5 transition-colors hover:bg-white/10 hover:text-white"
                    title="Copiar correo"
                    type="button"
                    onClick={handleCopyEmail}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          initial={{ scale: 0.5, opacity: 0 }}
                        >
                          <Check className="h-4 w-4 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          initial={{ scale: 0.5, opacity: 0 }}
                        >
                          <Copy className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              <div>
                <a
                  className="group/link inline-flex items-center gap-2 text-xs font-semibold text-purple-600 transition-colors hover:text-purple-500 sm:text-sm dark:text-purple-400 dark:hover:text-purple-300"
                  href="mailto:contacto@pristinoplant.com"
                >
                  Enviar correo directo
                  <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 3: UBICACIÓN (2/3 columnas) ================= */}
          <motion.div
            className="bg-canvas dark:bg-surface border-input-outline/25 dark:border-input-outline/10 group relative flex h-[360px] flex-col justify-between overflow-hidden rounded-3xl border p-8 transition-all duration-300 hover:border-sky-500/30 hover:shadow-lg md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            style={dotPatternStyle}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl transition-all duration-500 group-hover:bg-sky-500/15" />

            <div className="flex h-full flex-col items-start justify-between gap-6 md:flex-row">
              {/* Contenido Izquierda */}
              <div className="z-10 flex h-full max-w-md flex-col justify-between">
                <div>
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                    Invernadero
                  </span>
                  <h3 className="text-primary mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Ubicación
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed sm:text-base">
                    UD-102 San Félix, Ciudad Guayana, Estado Bolívar, Venezuela. conoce nuestro
                    Orquideario, distruta de nuestras orquídeas en persona y recibe asesoramiento
                    botánico directo de nuestros cultivadores especializados.
                  </p>
                </div>

                <div className="mt-6 md:mt-0">
                  <a
                    className="group/btn inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-5 text-sm font-semibold text-white shadow-md transition-all hover:border-white/20 hover:bg-zinc-800"
                    href="https://maps.google.com"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Cómo llegar
                    <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>
                </div>
              </div>

              {/* Radar animado de Ubicación Derecha */}
              <div className="relative z-10 hidden h-full w-60 items-center justify-center md:flex">
                <div className="relative flex h-40 w-40 items-center justify-center">
                  {/* Ondas de Radar */}
                  <div className="absolute h-full w-full animate-ping rounded-full border border-sky-500/10 [animation-duration:3s]" />
                  <div className="absolute h-3/4 w-3/4 animate-ping rounded-full border border-sky-500/20 [animation-duration:2.5s]" />
                  <div className="absolute h-1/2 w-1/2 animate-ping rounded-full border border-sky-500/30 [animation-duration:2s]" />

                  {/* Pin Central */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-500/50 bg-sky-500/20 shadow-xl shadow-sky-500/10"
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <MapPin className="h-6 w-6 text-sky-500" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 4: HORARIO DE ATENCIÓN (1/3 columnas) ================= */}
          <motion.div
            className="bg-canvas dark:bg-surface border-input-outline/25 dark:border-input-outline/10 group relative flex h-[360px] flex-col justify-between overflow-hidden rounded-3xl border p-8 transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            style={dotPatternStyle}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl transition-all duration-500 group-hover:bg-amber-500/15" />

            <div className="z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-primary mb-2 text-xl font-bold tracking-tight sm:text-2xl">
                  Horario de Atención
                </h3>

                {/* Indicador Dinámico Abierto/Cerrado */}
                <div className="dark:bg-canvas/50 mt-3 inline-flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-950/40 px-3 py-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${invernaderoStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}
                  />
                  <span className="text-primary text-xs font-bold tracking-tight">
                    {invernaderoStatus.text}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-white/5 py-1">
                    <span className="text-secondary text-xs sm:text-sm">Lunes a Sábado</span>
                    <span className="text-primary text-xs font-semibold sm:text-sm">
                      8:00 a. m. - 5:00 p. m.
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-secondary text-xs sm:text-sm">Domingo</span>
                    <span className="text-xs font-semibold text-amber-500 sm:text-sm">Cerrado</span>
                  </div>
                </div>
              </div>

              <div className="text-secondary text-[11px] leading-relaxed select-none">
                * Las visitas son previa cita. Escribenos por WhatsApp para agendar.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
