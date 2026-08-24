'use client'

import type { Agrochemical } from '@package/database'

import React from 'react'
import { motion } from 'motion/react'
import {
  IoLeafOutline,
  IoShieldCheckmarkOutline,
  IoRepeatOutline,
  IoCalendarOutline,
  IoSettingsOutline,
  IoCloseOutline,
} from 'react-icons/io5'

import { StatusCircleIcon, ActionMenu, ActionMenuItem } from '@/components'

export interface ProgramCycle {
  id: string
  sequence: number
  agrochemical: Agrochemical
  agrochemicalId: string
}

export interface ProgramData {
  id: string
  name: string
  weeklyFrequency?: number
  monthlyFrequency?: number
  productsCycle: ProgramCycle[]
}

interface ProgramCardProps {
  program: ProgramData
  type: 'fertilization' | 'phytosanitary'
  onEdit: (type: 'fertilization' | 'phytosanitary', data: ProgramData) => void
  onDelete: (type: 'fertilization' | 'phytosanitary', id: string) => void
}

export function ProgramCard({ program, type, onEdit, onDelete }: ProgramCardProps) {
  const isFertilization = type === 'fertilization'
  const colorStyle = isFertilization ? 'text-purple-500' : 'text-emerald-500'
  const Icon = isFertilization ? IoLeafOutline : IoShieldCheckmarkOutline

  const menuItems: ActionMenuItem[] = [
    {
      label: 'Editar',
      icon: <IoSettingsOutline className="size-4" />,
      onClick: () => onEdit(type, program),
    },
    {
      label: 'Eliminar',
      icon: <IoCloseOutline className="size-4" />,
      onClick: () => onDelete(type, program.id),
      variant: 'destructive',
    },
  ]

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group hover:bg-hover-overlay focus-within:z-5 relative flex h-full flex-col rounded-xl border p-4 shadow-sm transition-colors duration-200"
      initial={{ opacity: 0, y: 5 }}
    >
      <div className="flex h-full flex-1 flex-col justify-between gap-4">
        {/* CABECERA: Contexto Principal */}
        <div className="flex items-start gap-4">
          <StatusCircleIcon
            className="tds-xs:flex hidden shrink-0"
            colorClassName={colorStyle}
            icon={<Icon className="size-5" />}
            size="md"
            variant="overlay"
          />
          <div className="flex flex-1 flex-col gap-y-1 overflow-hidden text-left">
            <h3
              className="text-primary text-[15px] leading-tight font-bold whitespace-normal wrap-break-word antialiased"
              title={program.name}
            >
              {program.name}
            </h3>

            {/* Metadatos del Ciclo (tags fluidos y colapsables, reducidos en < tds-sm) */}
            <div className="text-secondary tds-sm:text-[11px] tds-sm:gap-x-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium opacity-60">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <IoRepeatOutline className="tds-sm:size-3.5 size-3 opacity-40" />
                <span>
                  {isFertilization
                    ? `Repite cada ${program.weeklyFrequency} sem`
                    : `Repite cada ${program.monthlyFrequency} mes`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <IoCalendarOutline className="tds-sm:size-3.5 size-3 opacity-40" />
                <span>{program.productsCycle.length} Pasos</span>
              </div>
            </div>
          </div>
        </div>

        {/* CUERPO: Lista de Insumos + Menú de Acciones Centrado Verticalmente en todo el alto disponible */}
        <div className="border-black-and-white/5 flex h-full flex-1 items-center justify-between gap-3 border-t border-dashed pt-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {program.productsCycle.map((pc, idx) => (
              <div key={pc.id} className="flex items-center gap-2">
                <div className="bg-secondary/10 text-secondary tds-sm:h-5 tds-sm:w-5 tds-sm:text-[9px] flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[8px] font-bold opacity-40">
                  {idx + 1}
                </div>
                <span className="text-primary text-[11px] leading-tight font-medium opacity-80 whitespace-normal wrap-break-word antialiased">
                  {pc.agrochemical.name}
                </span>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 items-center">
            <ActionMenu
              items={menuItems}
              triggerClassName="tds-sm:h-9 tds-sm:w-9 h-7 w-7 [&>svg]:size-3.5 tds-sm:[&>svg]:size-4"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
