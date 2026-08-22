'use client'

import type { Agrochemical } from '@package/database'

import React from 'react'
import { motion } from 'motion/react'
import { TbBug, TbSpider } from 'react-icons/tb'
import { FaBacteria } from 'react-icons/fa'
import { GiSuperMushroom, GiChemicalDrop } from 'react-icons/gi'
import { PiSprayBottle, PiFlowerThin } from 'react-icons/pi'
import { GrCycle } from 'react-icons/gr'
import {
  IoSettingsOutline,
  IoCloseOutline,
  IoLeafOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'

import { StatusCircleIcon, ActionMenu, ActionMenuItem } from '@/components'
import {
  type AgrochemicalPurpose,
  AgrochemicalPurposeLabels,
  AgrochemicalPurposeStyles,
  AgrochemicalTypeLabels,
  DosageUnit,
  DosageUnitLabels,
  formatDosage,
} from '@/config'

export interface AgrochemicalMixIngredient {
  id?: string
  ingredientId: string
  dosageValue: number
  dosageUnit: DosageUnit
  ingredient?: Agrochemical
}

export type AgrochemicalWithMix = Agrochemical & {
  mixIngredients?: AgrochemicalMixIngredient[]
}

interface AgrochemicalCardProps {
  agrochemical: AgrochemicalWithMix
  onEdit: (agro: AgrochemicalWithMix) => void
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

  // Calcular el subtítulo evaluando si es una mezcla y si los propósitos de sus componentes difieren
  const subtitle = React.useMemo(() => {
    if (
      !agrochemical.isMix ||
      !agrochemical.mixIngredients ||
      agrochemical.mixIngredients.length === 0
    ) {
      return AgrochemicalPurposeLabels[agrochemical.purpose] || agrochemical.purpose
    }

    const ingredientPurposes = agrochemical.mixIngredients
      .map((item) => {
        const p = item.ingredient?.purpose

        return p ? AgrochemicalPurposeLabels[p] : null
      })
      .filter(Boolean) as string[]

    if (ingredientPurposes.length === 0) {
      return AgrochemicalPurposeLabels[agrochemical.purpose] || agrochemical.purpose
    }

    const allSame = ingredientPurposes.every(
      (p) => p.toLowerCase() === ingredientPurposes[0].toLowerCase(),
    )

    if (allSame) {
      return ingredientPurposes[0]
    }

    return ingredientPurposes.join(' + ')
  }, [agrochemical])

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

  const isMixWithIngredients = Boolean(
    agrochemical.isMix && agrochemical.mixIngredients && agrochemical.mixIngredients.length > 0,
  )

  return (
    <motion.div
      className="bg-surface border-input-outline group hover:bg-hover-overlay focus-within:z-5 relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-colors duration-200"
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {/* 1. CABECERA: Icono, Título completo y Subtítulo */}
      <div className="flex items-start gap-4">
        <StatusCircleIcon
          className="tds-xs:flex hidden shrink-0"
          colorClassName={purposeStyle}
          icon={PURPOSE_ICONS[agrochemical.purpose]}
          variant="overlay"
        />

        <div className="flex flex-1 flex-col gap-y-0.5 overflow-hidden text-left">
          <h3
            className="text-primary text-[15px] leading-tight font-bold whitespace-normal break-words antialiased"
            title={agrochemical.name}
          >
            {agrochemical.name}
          </h3>

          <span className="text-secondary text-[11px] font-medium opacity-60">{subtitle}</span>
        </div>
      </div>

      {/* 2. CUERPO: Metadatos/Tags Técnicos y Menú de Acciones */}
      <div className="border-black-and-white/5 border-t border-dashed pt-3.5">
        {isMixWithIngredients ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              {/* Clasificación Macro */}
              <div className="text-secondary flex shrink-0 items-center gap-1.5 text-[11px] font-medium opacity-70 whitespace-nowrap">
                {agrochemical.type === 'FERTILIZANTE' ? (
                  <IoLeafOutline className="h-4 w-4 opacity-40" />
                ) : (
                  <IoShieldCheckmarkOutline className="h-4 w-4 opacity-40" />
                )}
                <span>{AgrochemicalTypeLabels[agrochemical.type]}</span>
              </div>

              <div className="flex shrink-0 items-center">
                <ActionMenu items={menuItems} />
              </div>
            </div>

            {/* Desglose de insumos y dosificaciones individuales */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              {agrochemical.mixIngredients!.map((item, idx) => {
                const unitLabel =
                  (item.dosageUnit in DosageUnitLabels
                    ? DosageUnitLabels[item.dosageUnit]
                    : item.dosageUnit) || item.dosageUnit
                const ingName = item.ingredient?.name || `Insumo ${idx + 1}`

                return (
                  <div
                    key={item.id || `${item.ingredientId}-${idx}`}
                    className="flex items-center justify-between gap-3 overflow-hidden text-[11px]"
                  >
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <span className="text-secondary/50 font-mono text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-primary truncate font-medium">{ingName}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <GiChemicalDrop className="text-secondary h-3.5 w-3.5 opacity-40" />
                      <span className="text-primary font-mono text-[11px] font-bold tracking-tight">
                        {item.dosageValue} {unitLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-row flex-wrap items-center gap-x-5 gap-y-2">
              {/* Clasificación Macro */}
              <div className="text-secondary flex shrink-0 items-center gap-1.5 text-[11px] font-medium opacity-70 whitespace-nowrap">
                {agrochemical.type === 'FERTILIZANTE' ? (
                  <IoLeafOutline className="h-4 w-4 opacity-40" />
                ) : (
                  <IoShieldCheckmarkOutline className="h-4 w-4 opacity-40" />
                )}
                <span>{AgrochemicalTypeLabels[agrochemical.type]}</span>
              </div>

              {/* Preparación / Dosis */}
              {agrochemical.dosageValue != null && agrochemical.dosageUnit && (
                <div className="text-primary flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                  <GiChemicalDrop className="text-secondary h-4 w-4 opacity-40" />
                  <span className="font-mono text-[11px] font-bold tracking-tight">
                    {formatDosage(agrochemical.dosageValue, agrochemical.dosageUnit)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center">
              <ActionMenu items={menuItems} />
            </div>
          </div>
        )}
      </div>

      {/* 3. PIE: Descripción / Notas de la sustancia (si existen) */}
      {agrochemical.description && (
        <div className="border-black-and-white/5 border-t border-dashed pt-2.5">
          <p className="text-secondary text-[11px] leading-relaxed italic opacity-60">
            {agrochemical.description}
          </p>
        </div>
      )}
    </motion.div>
  )
}
