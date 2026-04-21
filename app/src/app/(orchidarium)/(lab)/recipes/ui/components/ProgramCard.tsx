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

import { Badge, StatusCircleIcon, ActionMenu, ActionMenuItem } from '@/components'

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
      className="bg-surface border-input-outline group hover:bg-hover-overlay relative flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-all"
      initial={{ opacity: 0, y: 5 }}
    >
      <div className="flex flex-col gap-4">
        {/* CABECERA: Contexto Principal */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 items-center gap-4 overflow-hidden">
            <StatusCircleIcon
              className="tds-xs:flex hidden shrink-0"
              colorClassName={colorStyle}
              icon={<Icon className="size-5" />}
              size="md"
              variant="vibrant"
            />
            <div className="flex flex-1 flex-col gap-y-1 overflow-hidden text-left">
              <div className="tds-xs:flex-row tds-xs:items-center tds-xs:gap-x-2 tds-xs:gap-y-0 tds-xs:flex contents">
                <h3
                  className="text-primary tds-xs:truncate tds-xs:whitespace-nowrap order-1 text-[15px] leading-tight font-bold antialiased"
                  title={program.name}
                >
                  {program.name}
                </h3>
                <div className="order-3 flex">
                  <Badge className={colorStyle} size="sm" variant="status">
                    {isFertilization ? 'Fertirriego' : 'Fitosanitario'}
                  </Badge>
                </div>
              </div>
              {/* Métricas del Ciclo */}
              <div className="text-secondary tds-xs:mt-1 order-2 flex items-center gap-2 text-[11px] font-medium opacity-60">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <IoRepeatOutline className="size-3.5 opacity-40" />
                  <span>
                    {isFertilization
                      ? `Repite cada ${program.weeklyFrequency} sem`
                      : `Repite cada ${program.monthlyFrequency} mes`}
                  </span>
                </div>
                <span className="opacity-40">•</span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <IoCalendarOutline className="size-3.5 opacity-40" />
                  <span>{program.productsCycle.length} Pasos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 pt-0.5">
            <ActionMenu items={menuItems} />
          </div>
        </div>

        {/* CUERPO: Lista de Insumos */}
        <div className="border-black-and-white/5 flex flex-col gap-2 border-t border-dashed pt-4">
          {program.productsCycle.map((pc, idx) => (
            <div key={pc.id} className="flex items-center gap-2.5 overflow-hidden">
              <div className="bg-secondary/10 text-secondary flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold opacity-40">
                {idx + 1}
              </div>
              <span className="text-primary truncate text-[11px] font-medium opacity-80">
                {pc.agrochemical.name}
              </span>
              <span className="text-secondary shrink-0 text-[10px] underline decoration-dotted opacity-40">
                {pc.agrochemical.preparation}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
