/* eslint-disable prettier/prettier */

import type { Variants } from 'motion/react'

// ==========================================
// 🧠 LEYENDA DE EASINGS (Curvas de velocidad)
// ==========================================
// Úsalas para definir la "personalidad" del movimiento. 
// easeOut: Empieza rápido y frena suave al final. 
// Ideal para elementos que ENTRAN a la pantalla (se siente natural). 

// easeIn: Empieza lento y acelera al final.
// Ideal para elementos que SALEN (se van rápido). 
// elastic: Rebota un poco al final. 

// smooth: Lineal pero con bordes suavizados (Standard Material Design)

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

export const motionDropdown: Variants = {
  initial: {
    boxShadow: "0px 0px 0px rgba(0,0,0,0)", // Sombra invisible al inicio
    // "inset(0 0 15% 0)" significa: recorta el 15% de abajo.
    // Usamos clipPath para simular que empieza desde el 85%
    clipPath: "inset(0% 0% 15% 0%)",
    opacity: 0,
    overflow: 'hidden',
    y: 0,
  },
  animate: {
    opacity: 1,
    y: 0, // Se asegura que esté en su posición original
    clipPath: "inset(0% 0% 0% 0%)", // Se muestra completo
    boxShadow: 'var(--shadow-tesla)',

    transition: {
      // La opacidad es INMEDIATA para que el fondo blanco 
      // aparezca y tape el backdrop.
      opacity: { duration: 0, ease: "linear" },
      boxShadow: { duration: 0.2 }, // La sombra aparece suavemente

      // Control del despliegue (ClipPath o Height)
      default: {
        duration: 0.6,
        ease: 'easeOut'
      }
    },
  },
  exit: {
    boxShadow: "0px 0px 0px rgba(0,0,0,0)",
    // Recortamos el (15%) Desde abajo para simular el "cierre"
    clipPath: "inset(0% 0% 15% 0%)",
    // Lift: Movemos la caja un poco hacia arriba. 
    y: -60,
    // Junto con el Recorte de abajo, da la sensación de que se contrae hacia arriba.

    opacity: 0,
    overflow: 'hidden', // Oculta el contenido mientras se expande

    transition: {
      boxShadow: { duration: 0.2 },
      // Hacemos que la opacidad dure un poco más para que se vea el efecto de movimiento
      opacity: { duration: 0.6, ease: "easeIn" },
      // El movimiento y el corte deben ir sincronizados
      default: { duration: 0.6, ease: "easeIn" }

    },
  }
}

export const motionContent: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      delay: 0.2 // Pequeño retraso para esperar al contenedor
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.4, ease: 'easeIn' }
  },
}
