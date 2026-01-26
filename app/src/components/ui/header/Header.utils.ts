/* eslint-disable prettier/prettier */

import type { Variants } from 'motion/react'

// ---- Animaciones ----
export const motionSearchBox: Variants = {
  initial: {
    width: 0,
    opacity: 0,
    overflow: 'hidden',
    // overflow: 'hidden' es Necesario al inicio
    // para que no se vea el texto mientras crece.
  },
  animate: {
    // ⚠️ Framer Motion detectará que es una variable CSS y calculará el valor final.
    width: 'var(--search-width)',
    opacity: 1,
    overflow: 'hidden',
    // overflow: 'hidden' es Necesario DURANTE la animación
    transition: {
      width: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }, // Easing suave (bezier)
      opacity: { duration: 0.2, delay: 0.1 }, // El texto aparece un poco después
    },
    transitionEnd: {
      overflow: 'visible',
      // Al terminar la animación, cambiamos a 'visible'
      // para permitir que el dropdown de resultados se vea. 
    },
  },
  exit: {
    width: 0,
    opacity: 0,
    overflow: 'hidden',
    // overflow: 'hidden' Volvemos a ocultar al cerrar
    transition: {
      width: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.1 }, // Desaparece rápido
    },
  },
}

export const motionIconSearch = {
  initial: {
    width: 'auto',
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    width: 'auto',
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    width: 0,
    opacity: 0,
    scale: 0.5,
    transition: { duration: 0.2 },
  },
}

export const motionSubMenu = {
  initial: {
    opacity: 0,
    scaleY: 0,
    transformOrigin: 'top',
  },
  animate: (isSwitch: boolean) => {
    return {
      opacity: 1,
      scaleY: 1,
      transformOrigin: 'top',
      transition: isSwitch
        ? { duration: 0 }
        : {
          opacity: { duration: 0.2, ease: 'easeOut' },
          scaleY: { duration: 0.3, ease: 'easeOut' }, // Ligeramente más rápido
        },
    }
  },
  exit: (isSwitch: boolean) => {
    return {
      opacity: 0,
      scaleY: 0,
      transformOrigin: 'top',
      transition: isSwitch
        ? { duration: 0 }
        : {
          opacity: { duration: 0.3, ease: 'easeIn' }, // Más rápido al salir
          scaleY: { duration: 0.3, ease: 'easeIn' },
        },
    }
  },
}