'use client'

import type { Agrochemical } from '@package/database'

import { clsx } from 'clsx'
import React from 'react'
import { motion } from 'motion/react'
import { TbBug, TbSpider } from 'react-icons/tb'
import { FaBacteria } from 'react-icons/fa'
import { GiSuperMushroom } from 'react-icons/gi'
import { PiSprayBottle, PiFlowerThin } from 'react-icons/pi'
import { GrCycle } from 'react-icons/gr'
import { IoSettingsOutline, IoCloseOutline } from 'react-icons/io5'

import { Badge, StatusCircleIcon, ActionMenu, ActionMenuItem } from '@/components'
import { AgrochemicalPurpose } from '@/config/mappings'
import {
  AgrochemicalPurposeLabels,
  AgrochemicalPurposeStyles,
  AgrochemicalTypeLabels,
} from '@/config/mappings'

interface AgrochemicalCardProps {
  agrochemical: Agrochemical
  onEdit: (agro: Agrochemical) => void
  onDelete: (id: string) => void
}

const PURPOSE_ICONS: Record<AgrochemicalPurpose, React.ReactNode> = {
  DESARROLLO: <PiSprayBottle />,
  FLORACION: <PiFlowerThin />,
  MANTENIMIENTO: <GrCycle />,
  ACARICIDA: <TbSpider />,
  BACTERICIDA: <FaBacteria />,
  FUNGICIDA: <GiSuperMushroom />,
  INSECTICIDA: <TbBug />,
}

export function AgrochemicalCard({ agrochemical, onEdit, onDelete }: AgrochemicalCardProps) {
  const purposeStyle = AgrochemicalPurposeStyles[agrochemical.purpose] || 'text-secondary'
  const purposeLabel = AgrochemicalPurposeLabels[agrochemical.purpose] || agrochemical.purpose

  const menuItems: ActionMenuItem[] = [
    {
      label: 'Editar',
      icon: <IoSettingsOutline className="size-4" />,
      onClick: () => onEdit(agrochemical),
    },
    {
      label: 'Eliminar',
      icon: <IoCloseOutline className="size-4" />,
      onClick: () => onDelete(agrochemical.id),
      variant: 'destructive',
    },
  ]

  return (
    <motion.div
      className="bg-surface border-input-outline group hover:bg-hover-overlay relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-all"
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-center gap-4 overflow-hidden">
          <StatusCircleIcon
            className="tds-xs:flex hidden shrink-0"
            colorClassName={purposeStyle}
            icon={PURPOSE_ICONS[agrochemical.purpose]}
            variant="overlay"
          />

          <div className="flex flex-1 flex-col overflow-hidden text-left">
            <div className="tds-xs:flex-row tds-xs:items-center tds-xs:gap-x-2 tds-xs:gap-y-0 tds-xs:flex contents">
              <h3
                className="text-primary tds-xs:truncate tds-xs:whitespace-nowrap order-1 text-[15px] leading-tight font-bold antialiased"
                title={agrochemical.name}
              >
                {agrochemical.name}
              </h3>
              <div className="order-3 flex">
                <Badge className={clsx('shrink-0', purposeStyle)} size="sm" variant="status">
                  {purposeLabel}
                </Badge>
              </div>
            </div>

            <div className="text-secondary tds-xs:mt-1 order-2 flex items-baseline gap-2 text-[11px] font-medium opacity-60">
              <span>{AgrochemicalTypeLabels[agrochemical.type]}</span>
              <span className="opacity-40">•</span>
              <span className="font-mono font-bold tracking-tight">{agrochemical.preparation}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 pt-0.5">
          <ActionMenu items={menuItems} />
        </div>
      </div>

      {/* Descripción / Notas (Visible en todo momento si existe) */}
      {agrochemical.description && (
        <div className="border-black-and-white/5 mt-1 border-t border-dashed pt-3">
          <p className="text-secondary text-[11px] leading-relaxed italic opacity-60">
            {agrochemical.description}
          </p>
        </div>
      )}
    </motion.div>
  )
}
