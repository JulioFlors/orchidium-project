'use client'

import { useState, useEffect, useRef } from 'react'
import { IoChevronDownSharp, IoCheckmarkSharp } from 'react-icons/io5'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'

interface Props {
  quantity: number

  // Función para notificar el cambio al padre
  onQuantityChanged: (newQuantity: number) => void
}

const LABEL = 'Cantidad:'
const MAX_QUANTITY = 5

export function QuantityDropdown({ quantity, onQuantityChanged }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Generar opciones
  const options = Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1)

  // Cerrar dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelection = (newQuantity: number) => {
    // Llamar a la función del padre para actualizar la cantidad
    onQuantityChanged(newQuantity)
    setIsOpen(false) // Cerrar dropdown después de la selección
  }

  // Variantes de animación para el panel del dropdown
  // Similar a lo que viste en la documentación de Motion/Framer Motion
  const dropdownPanelVariants = {
    initial: { opacity: 0, scale: 0.95, y: -10 }, // Comienza invisible y ligeramente escalado/desplazado
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as any } }, // Anima a visible y tamaño normal
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15, ease: 'easeIn' as any } }, // Anima al salir
  }

  return (
    //----- Contenedor para etiqueta y dropdown ----//
    <div className="flex items-center">
      {LABEL && <span className="tracking-normal">{LABEL}</span>}

      <div ref={dropdownRef} className="relative mr-4 ml-2">
        <motion.button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="focus-dashed list-box"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {/*---- Cantidad Seleccionada ----*/}
          <span className="tracking-normal">{quantity}</span>

          {/*---- Animar la rotación del icono ----*/}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="ml-1"
            transition={{ duration: 0 }}
          >
            <IoChevronDownSharp className="h-[17px] w-[17.5px]" />
          </motion.div>
        </motion.button>

        {/*---- initial={false} para no animar en la carga inicial de la página ----*/}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.ul
              key="quantity-dropdown-panel" // Key es importante para AnimatePresence
              animate="animate" // Animar a este estado cuando entra
              className="border-search-box-outline absolute top-7 -left-0.5 z-2 max-h-48 w-max rounded border bg-white py-1 shadow-lg focus:outline-none"
              exit="exit" // Animar a este estado cuando sale
              initial="initial" // Estado inicial de las variantes
              role="listbox"
              variants={dropdownPanelVariants} // Aplicar las variantes definidas
            >
              {options.map((optionValue) => (
                <li
                  key={optionValue}
                  aria-selected={quantity === optionValue}
                  className={clsx(
                    'hover:bg-hover flex min-h-8 min-w-18 cursor-pointer items-center justify-between px-5 py-1 text-start leading-6',
                    quantity === optionValue && 'bg-search-box-icon-hover font-semibold', // Estilo para opción seleccionada
                  )}
                  role="option"
                  onClick={() => handleSelection(optionValue)}
                >
                  {/*---- Cantidad Seleccionada ----*/}
                  <span>{optionValue}</span>

                  {/*---- Icono de check para seleccionada ----*/}
                  {quantity === optionValue && <IoCheckmarkSharp className="ml-2 h-4 w-4" />}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
