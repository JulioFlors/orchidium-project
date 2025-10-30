/* eslint-disable prettier/prettier */

// Animación para el SearchBox
export const motionSearchBox = {
  initial: { width: 0, opacity: 0 },
  animate: {
    width: 'auto',
    opacity: 1,
    transition: {
      x: { duration: 0.6, ease: 'easeOut' },
      opacity: { duration: 0.4, ease: 'easeOut', delay: 0.1 },
    },
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: {
      x: { duration: 0.6, ease: 'easeInOut' },
      opacity: { duration: 0.3, ease: 'easeInOut', delay: 0.1 },
    },
  },
} as const

// Animación para el IconSearch
export const motionIconSearch = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.6, opacity: { duration: 0.6, ease: 'easeInOut' } },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1, opacity: { duration: 0.1, ease: 'easeOut' } },
  },
}

// Animaciones del submenú
export const motionSubMenu = {
  initial: {
    opacity: 0,
    scaleY: 0,
    transformOrigin: 'top', // Asegura que escale desde/hacia el borde superior
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
          scaleY: { duration: 0.4, ease: 'easeOut' },
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
          opacity: { duration: 0.6, ease: 'easeOut' },
          scaleY: { duration: 0.4, ease: 'easeOut' },
        },
    }
  },
}
