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
      className="bg-surface dark:bg-canvas relative flex w-full flex-col justify-center overflow-hidden pt-[54px] pb-[16px] px-5"
      id="contact"
    >
      {/* Bento Grid Principal */}
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ================= CARD 1: WHATSAPP (2/3 columnas) ================= */}
          <motion.div
            className="md:col-span-2 bg-canvas dark:bg-surface border border-input-outline/25 dark:border-input-outline/10 rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between h-[360px] transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg"
            style={dotPatternStyle}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all duration-500" />
            
            <div className="flex flex-col md:flex-row justify-between items-start h-full gap-6">
              {/* Contenido Izquierda */}
              <div className="flex flex-col justify-between h-full max-w-md z-10">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Canal Directo
                  </span>
                  <h3 className="text-primary text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    Asesoría en línea por WhatsApp
                  </h3>
                  <p className="text-secondary text-sm sm:text-base leading-relaxed">
                    Recibe atención inmediata y personalizada para resolver tus dudas de cultivo, consultar disponibilidad de especies de colección o coordinar tus despachos.
                  </p>
                </div>

                <div className="mt-6 md:mt-0">
                  <a
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-md hover:shadow-emerald-500/20 group/btn"
                    href="https://wa.me/584121234567"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Iniciar chat
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </a>
                </div>
              </div>

              {/* Visual Celular de Chat Derecha */}
              <div className="hidden md:flex relative w-64 h-full items-end justify-center z-10 overflow-hidden">
                <div className="w-[220px] h-[220px] bg-zinc-950/90 border border-white/10 rounded-2xl p-3 flex flex-col gap-2 shadow-2xl rotate-[-3deg] group-hover:rotate-0 transition-all duration-500">
                  {/* Header Chat */}
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-white">Soporte PristinoPlant</span>
                  </div>
                  {/* Conversación */}
                  <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                    <motion.div 
                      className="bg-zinc-800 text-[10px] p-2 rounded-lg text-white max-w-[85%] self-start"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      ¡Hola! ¿Tienen Cattleya Mossiae en floración disponible?
                    </motion.div>
                    <motion.div 
                      className="bg-emerald-600/20 text-[10px] p-2 rounded-lg text-emerald-300 max-w-[85%] self-end"
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      ¡Hola! Sí, tenemos hermosas adultas listas para entregar. 🌸
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 2: CORREO ELECTRÓNICO (1/3 columnas) ================= */}
          <motion.div
            className="md:col-span-1 bg-canvas dark:bg-surface border border-input-outline/25 dark:border-input-outline/10 rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between h-[360px] transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg"
            style={dotPatternStyle}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/15 transition-all duration-500" />

            <div className="flex flex-col justify-between h-full z-10">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 mb-6">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-primary text-xl sm:text-2xl font-bold tracking-tight mb-2">
                  Correo Electrónico
                </h3>
                <p className="text-secondary text-sm leading-relaxed">
                  Para consultas formales, solicitudes corporativas o eventos especiales.
                </p>
                <div className="mt-4 p-3 bg-zinc-950/45 dark:bg-canvas/60 border border-white/5 rounded-xl flex items-center justify-between">
                  <span className="text-primary text-xs sm:text-sm font-semibold select-all">
                    contacto@pristinoplant.com
                  </span>
                  <button
                    onClick={handleCopyEmail}
                    type="button"
                    className="p-1.5 hover:bg-white/10 rounded-lg text-secondary hover:text-white transition-colors"
                    title="Copiar correo"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                        >
                          <Check className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                        >
                          <Copy className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              <div>
                <a
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors group/link"
                  href="mailto:contacto@pristinoplant.com"
                >
                  Enviar correo directo
                  <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 3: UBICACIÓN (2/3 columnas) ================= */}
          <motion.div
            className="md:col-span-2 bg-canvas dark:bg-surface border border-input-outline/25 dark:border-input-outline/10 rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between h-[360px] transition-all duration-300 hover:border-sky-500/30 hover:shadow-lg"
            style={dotPatternStyle}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/15 transition-all duration-500" />

            <div className="flex flex-col md:flex-row justify-between items-start h-full gap-6">
              {/* Contenido Izquierda */}
              <div className="flex flex-col justify-between h-full max-w-md z-10">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 mb-4">
                    Invernadero Físico
                  </span>
                  <h3 className="text-primary text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    Ubicación y Visitas
                  </h3>
                  <p className="text-secondary text-sm sm:text-base leading-relaxed">
                    Sector Altavista, Ciudad Guayana, Estado Bolívar, Venezuela. Ven a visitarnos para conocer nuestras instalaciones, ver las orquídeas en persona y recibir asesoramiento botánico directo de nuestro equipo.
                  </p>
                </div>

                <div className="mt-6 md:mt-0">
                  <a
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all hover:bg-zinc-800 shadow-md group/btn"
                    href="https://maps.google.com"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Cómo llegar
                    <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>
                </div>
              </div>

              {/* Radar animado de Ubicación Derecha */}
              <div className="hidden md:flex relative w-60 h-full items-center justify-center z-10">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* Ondas de Radar */}
                  <div className="absolute w-full h-full border border-sky-500/10 rounded-full animate-ping [animation-duration:3s]" />
                  <div className="absolute w-3/4 h-3/4 border border-sky-500/20 rounded-full animate-ping [animation-duration:2.5s]" />
                  <div className="absolute w-1/2 h-1/2 border border-sky-500/30 rounded-full animate-ping [animation-duration:2s]" />
                  
                  {/* Pin Central */}
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-500/50 flex items-center justify-center shadow-xl shadow-sky-500/10"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <MapPin className="w-6 h-6 text-sky-500" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 4: HORARIO DE ATENCIÓN (1/3 columnas) ================= */}
          <motion.div
            className="md:col-span-1 bg-canvas dark:bg-surface border border-input-outline/25 dark:border-input-outline/10 rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between h-[360px] transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg"
            style={dotPatternStyle}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/15 transition-all duration-500" />

            <div className="flex flex-col justify-between h-full z-10">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 mb-6">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-primary text-xl sm:text-2xl font-bold tracking-tight mb-2">
                  Horario de Atención
                </h3>
                
                {/* Indicador Dinámico Abierto/Cerrado */}
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/40 dark:bg-canvas/50 border border-white/5">
                  <span className={`w-2.5 h-2.5 rounded-full ${invernaderoStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  <span className="text-primary text-xs font-bold tracking-tight">
                    {invernaderoStatus.text}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-secondary text-xs sm:text-sm">Lunes a Sábado</span>
                    <span className="text-primary text-xs sm:text-sm font-semibold">
                      8:00 a. m. - 5:00 p. m.
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-secondary text-xs sm:text-sm">Domingo</span>
                    <span className="text-amber-500 text-xs sm:text-sm font-semibold">
                      Cerrado
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-secondary text-[11px] leading-relaxed select-none">
                * Los festivos nacionales pueden tener ventanas de atención reducidas. Consulta por WhatsApp.
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
