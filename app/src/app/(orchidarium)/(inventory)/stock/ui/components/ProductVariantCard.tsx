'use client'

import type { PotSize } from '@package/database/enums'

import { clsx } from 'clsx'
import { motion } from 'motion/react'
import { MdEdit, MdDelete } from 'react-icons/md'

import { StatusCircleIcon, ActionMenu } from '@/components'
import {
  PotSizeLabels as POT_SIZE_LABELS,
  PotSizeColors as POT_SIZE_COLORS,
} from '@/config/mappings'
import { useFormatPrice } from '@/lib'

export interface VariantData {
  id: string
  size: PotSize
  price: number
  quantity: number
  available: boolean
}

interface ProductVariantCardProps {
  variant: VariantData
  onEdit: (variant: VariantData) => void
  onDelete: (variant: VariantData) => void
}

export function ProductVariantCard({ variant, onEdit, onDelete }: ProductVariantCardProps) {
  const { format: formatPrice } = useFormatPrice()
  const potCode = POT_SIZE_LABELS[variant.size] || variant.size
  const potColor = POT_SIZE_COLORS[variant.size]

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group hover:bg-hover-overlay isolate relative flex min-w-[160px] items-center justify-between gap-2.5 rounded-xl border p-2.5 shadow-xs transition-all duration-300 tds-xs:gap-4 tds-xs:p-4"
      initial={{ opacity: 0, y: 5 }}
    >
      {/* 1. Maceta (StatusCircleIcon sin glow y con color por PotSize) */}
      <StatusCircleIcon
        className="shrink-0"
        colorClassName={clsx(
          potColor?.border || 'border-input-outline',
          potColor?.text || 'text-primary',
          potColor?.bg || 'bg-surface',
        )}
        icon={
          <span className="font-mono text-[11px] font-black tracking-tighter tds-xs:text-xs">
            {potCode}
          </span>
        }
        size="md"
        variant="surface"
      />

      {/* 2. Monto en dólares (Centrado) */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-1 text-center">
        <span className="text-primary font-mono text-sm font-bold tds-xs:text-base sm:text-lg">
          {formatPrice(variant.price)}
        </span>
      </div>

      {/* 3. Menú de opciones (ActionMenu) */}
      <ActionMenu
        className="shrink-0"
        hoverOnly={false}
        items={[
          {
            label: 'Editar Precio',
            icon: <MdEdit />,
            onClick: () => onEdit(variant),
          },
          {
            label: 'Eliminar Tamaño',
            icon: <MdDelete />,
            onClick: () => onDelete(variant),
            variant: 'destructive',
          },
        ]}
      />
    </motion.div>
  )
}
