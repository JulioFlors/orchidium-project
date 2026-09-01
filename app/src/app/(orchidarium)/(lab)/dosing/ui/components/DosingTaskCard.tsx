'use client'

import type { DosingTaskItem } from '@/actions/lab'

import React from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCalendarClearOutline,
  IoCloseOutline,
  IoTrashOutline,
  IoPencilOutline,
} from 'react-icons/io5'
import { MdOutlineStickyNote2, MdLayers } from 'react-icons/md'
import { TbBug, TbSpider } from 'react-icons/tb'
import { FaBacteria } from 'react-icons/fa'
import { GiSuperMushroom, GiChemicalDrop } from 'react-icons/gi'
import { PiSprayBottle, PiFlowerThin } from 'react-icons/pi'
import { GrCycle } from 'react-icons/gr'

import { StatusCircleIcon, ActionMenu, ActionMenuItem } from '@/components'
import { TaskStatusBadge } from '@/app/(orchidarium)/(operations)/queue/ui/components/TaskStatusBadge'
import { formatTime12h } from '@/utils'
import {
  AgrochemicalPurposeStyles,
  type AgrochemicalPurpose,
  formatAgrochemicalDosage,
  formatDosage,
  ZoneTypeLabels,
} from '@/config'

const PURPOSE_ICONS: Record<string, React.ReactNode> = {
  DESARROLLO: <PiSprayBottle />,
  FLORACION: <PiFlowerThin />,
  MANTENIMIENTO: <GrCycle />,
  ACARICIDA: <TbSpider />,
  BACTERICIDA: <FaBacteria />,
  FUNGICIDA: <GiSuperMushroom />,
  INSECTICIDA: <TbBug />,
}

interface DosingTaskCardProps {
  task: DosingTaskItem
  onStatusChange: (taskId: string, status: string, postponeHours?: number) => void
  onDelete: (task: DosingTaskItem) => void
  onCancel?: (task: DosingTaskItem) => void
  onEdit?: (task: DosingTaskItem) => void
}

/**
 * Tarjeta de Tarea de Dosificación de Agroquímicos (DosingTaskCard)
 *
 * 1. Cabecera superior fluida (StatusCircleIcon + Título + TaskStatusBadge al lado cuando no colapsa + Subtítulo).
 * 2. Sección inferior de metadatos en cuadrícula Grid donde CADA TAG (insumo, dosis, fecha, hora y zonas individuales)
 *    es una celda participante independiente alineada al píxel.
 * 3. ActionMenu protegido en un contenedor `flex shrink-0` a la derecha.
 * 4. Sección de notas observacionales en el footer a ancho completo.
 */
export function DosingTaskCard({
  task,
  onStatusChange,
  onDelete,
  onCancel,
  onEdit,
}: DosingTaskCardProps) {
  const dateObj = React.useMemo(() => new Date(task.scheduledAt), [task.scheduledAt])
  const isPast = React.useMemo(() => dateObj < new Date(), [dateObj])

  const agroPurpose = (task.agrochemical?.purpose || 'DESARROLLO') as AgrochemicalPurpose
  const purposeStyle = AgrochemicalPurposeStyles[agroPurpose] || 'text-purple-500'
  const purposeIcon = PURPOSE_ICONS[agroPurpose] || <GiChemicalDrop />

  const menuItems: ActionMenuItem[] = [
    ...(task.status === 'PENDING' || task.status === 'WAITING_CONFIRMATION'
      ? [
          ...(onEdit
            ? [
                {
                  label: 'Editar',
                  icon: <IoPencilOutline className="text-primary" />,
                  onClick: () => onEdit(task),
                },
              ]
            : []),
          {
            label: 'Marcar Completado',
            icon: <IoCheckmarkCircleOutline className="text-emerald-500" />,
            onClick: () => onStatusChange(task.id, 'COMPLETED'),
          },
          {
            label: 'Posponer 24h',
            icon: <IoCalendarClearOutline className="text-blue-400" />,
            onClick: () => onStatusChange(task.id, 'PENDING', 24),
          },
          {
            label: 'Cancelar Tarea',
            icon: <IoCloseOutline className="text-amber-500" />,
            onClick: () => (onCancel ? onCancel(task) : onStatusChange(task.id, 'CANCELLED')),
            variant: 'destructive' as const,
          },
        ]
      : []),
    {
      label: 'Eliminar Registro',
      icon: <IoTrashOutline className="text-red-500" />,
      onClick: () => onDelete(task),
      variant: 'destructive' as const,
    },
  ]

  const productName = task.agrochemical?.name || 'Insumo no especificado'
  const preparation = formatAgrochemicalDosage(task.agrochemical) || 'Sin especificación de dosis'

  // Sanitizar el nombre del subtítulo para eliminar cualquier prefijo "Programa:"
  const rawRoutine = task.routineName || 'Aplicación Manual Independiente'
  const routineName = rawRoutine.replace(/^Programa:\s*/i, '')

  const isMix = Boolean(
    task.agrochemical?.isMix &&
    task.agrochemical.mixIngredients &&
    task.agrochemical.mixIngredients.length > 0,
  )

  // Construir el arreglo plano unificado con todos los tags independientes
  const allTags = React.useMemo(() => {
    const tags: { key: string; textLength: number; node: React.ReactNode }[] = []

    if (isMix) {
      task.agrochemical!.mixIngredients!.forEach((item, idx) => {
        const ingName = item.ingredient?.name || `Insumo ${idx + 1}`
        const dosageStr = formatDosage(item.dosageValue, item.dosageUnit)
        const itemKey = item.ingredient?.name ? `${item.ingredient.name}-${idx}` : `ing-${idx}`

        tags.push({
          key: `ing-${itemKey}`,
          textLength: ingName.length + 4,
          node: (
            <div className="text-primary flex min-w-0 items-center gap-1.5 font-medium whitespace-nowrap overflow-hidden">
              <div className="bg-secondary/10 text-secondary flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[9px] font-bold opacity-50">
                {idx + 1}
              </div>
              <span className="text-primary text-[11px] font-semibold truncate" title={ingName}>
                {ingName}
              </span>
            </div>
          ),
        })

        if (dosageStr) {
          tags.push({
            key: `dos-${itemKey}`,
            textLength: dosageStr.length + 4,
            node: (
              <div className="text-primary flex min-w-0 items-center gap-1.5 whitespace-nowrap overflow-hidden">
                <div className="bg-secondary/10 text-secondary flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[9px] font-bold opacity-50">
                  {idx + 1}
                </div>
                <span
                  className="font-mono text-[11px] font-bold tracking-tight truncate"
                  title={dosageStr}
                >
                  {dosageStr}
                </span>
              </div>
            ),
          })
        }
      })
    } else {
      tags.push({
        key: 'prep-single',
        textLength: preparation.length + 4,
        node: (
          <div className="text-primary flex min-w-0 items-center gap-1.5 font-medium whitespace-nowrap overflow-hidden">
            <GiChemicalDrop className="text-secondary h-4 w-4 shrink-0 opacity-40" />
            <span
              className="font-mono text-[11px] font-bold tracking-tight truncate"
              title={preparation}
            >
              {preparation}
            </span>
          </div>
        ),
      })
    }

    // Tag Fecha
    const dateStr = dateObj.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
    })

    tags.push({
      key: 'date',
      textLength: dateStr.length + 4,
      node: (
        <div className="text-primary flex min-w-0 items-center gap-1.5 font-bold whitespace-nowrap overflow-hidden">
          <IoCalendarOutline className="h-4 w-4 shrink-0 opacity-40" />
          <span className="text-[11px] tracking-tight uppercase truncate" title={dateStr}>
            {dateStr}
          </span>
        </div>
      ),
    })

    // Tag Hora
    const timeStr = formatTime12h(
      task.status === 'COMPLETED' && task.executedAt ? new Date(task.executedAt) : dateObj,
    )

    tags.push({
      key: 'time',
      textLength: timeStr.length + 4,
      node: (
        <div className="text-primary flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold tracking-tighter whitespace-nowrap uppercase overflow-hidden">
          <IoTimeOutline className="h-4 w-4 shrink-0 opacity-40" />
          <span
            className={clsx('truncate', isPast && task.status === 'PENDING' && 'opacity-30')}
            title={timeStr}
          >
            {timeStr}
          </span>
        </div>
      ),
    })

    // Tags Zonas
    task.zones?.forEach((z) => {
      const zoneLabel = ZoneTypeLabels[z as keyof typeof ZoneTypeLabels] || z

      tags.push({
        key: `zone-${z}`,
        textLength: zoneLabel.length + 4,
        node: (
          <div className="text-primary flex min-w-0 items-center gap-1.5 font-bold whitespace-nowrap overflow-hidden">
            <MdLayers className="h-4 w-4 shrink-0 opacity-40" />
            <span
              className="font-mono text-[11px] tracking-tight uppercase truncate"
              title={zoneLabel}
            >
              {zoneLabel}
            </span>
          </div>
        ),
      })
    })

    return tags
  }, [
    dateObj,
    isMix,
    isPast,
    preparation,
    task.agrochemical,
    task.executedAt,
    task.status,
    task.zones,
  ])

  const tagsContainerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState<number>(0)

  React.useEffect(() => {
    if (!tagsContainerRef.current) return
    const el = tagsContainerRef.current

    setContainerWidth(el.offsetWidth)

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    ro.observe(el)

    return () => ro.disconnect()
  }, [])

  const totalTags = allTags.length

  // Ancho estimado por celda calculado dinámicamente según el tag más largo con límites seguros
  const estimatedColWidth = React.useMemo(() => {
    if (totalTags === 0) return 120
    const maxTagLen = Math.max(...allTags.map((t) => t.textLength))

    // ~8px por caracter + 36px para icono/número y padding/gap
    return Math.max(125, Math.min(185, maxTagLen * 8 + 36))
  }, [allTags, totalTags])

  // Calcular número óptimo de columnas balanceadas para una distribución uniforme en N filas
  const columnsCount = React.useMemo(() => {
    if (!containerWidth || totalTags <= 1) return Math.min(totalTags, 6)

    // 1. ¿Cuántas columnas máximas caben físicamente en el ancho disponible con el ancho calculado?
    const maxColsThatFit = Math.max(1, Math.floor((containerWidth + 20) / estimatedColWidth))

    // 2. ¿Cuántas filas mínimas se necesitan para distribuir todos los tags?
    const minRowsNeeded = Math.ceil(totalTags / maxColsThatFit)

    // 3. ¿Cuántas columnas exactas balancean los tags uniformemente en ese número de filas?
    const balancedCols = Math.ceil(totalTags / minRowsNeeded)

    return Math.max(1, Math.min(balancedCols, maxColsThatFit))
  }, [containerWidth, estimatedColWidth, totalTags])

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-input-outline group hover:bg-hover-overlay focus-within:z-5 relative flex min-w-0 w-full flex-col gap-3.5 rounded-xl border p-4 shadow-sm transition-colors duration-200"
      initial={{ opacity: 0, y: 5 }}
    >
      {/* 1. Cabecera Superior: Icono + Título + Badge al lado + Subtítulo */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 overflow-hidden min-w-0">
          <StatusCircleIcon
            active={task.status === 'IN_PROGRESS'}
            className="tds-xs:flex hidden shrink-0"
            colorClassName={purposeStyle}
            icon={purposeIcon}
            size="md"
            variant="overlay"
          />

          <div className="flex flex-1 flex-col overflow-hidden text-left min-w-0">
            <div className="tds-xs:flex-row tds-xs:items-center tds-xs:gap-x-2 tds-xs:gap-y-0 tds-xs:flex contents">
              {/* Título de producto (order-1) */}
              <h3
                className="text-primary tds-xs:order-1 order-1 text-[15px] leading-tight font-bold whitespace-normal break-words antialiased"
                title={productName}
              >
                {productName}
              </h3>

              {/* Badge de Estado: al lado del título en 1 fila (tds-xs:order-2) y DEBAJO del subtítulo al colapsar (order-3) */}
              <div className="tds-xs:order-2 order-3 flex mt-1 tds-xs:mt-0">
                <TaskStatusBadge context="dosing" hasDbId={Boolean(task.id)} status={task.status} />
              </div>
            </div>

            {/* Subtítulo de la rutina (order-2) */}
            <div className="text-secondary tds-xs:mt-0.5 order-2 flex items-center gap-2 text-[11px] font-medium opacity-60">
              <span className="whitespace-normal break-words">{routineName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sección Inferior de Metadatos en Cuadrícula Matrix Balanceada */}
      <div className="border-black-and-white/5 mt-1 border-t border-dashed pt-3.5 w-full">
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Contenedor Grid con columnas alineadas en 2D al píxel y balanceadas uniformemente */}
          <div
            ref={tagsContainerRef}
            className="grid flex-1 min-w-0 items-center gap-x-5 gap-y-2.5"
            style={{
              gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
            }}
          >
            {allTags.map((t) => (
              <React.Fragment key={t.key}>{t.node}</React.Fragment>
            ))}
          </div>

          {/* ActionMenu Protegido (Centrado verticalmente con items-center) */}
          <div className="flex shrink-0 items-center">
            <ActionMenu items={menuItems} />
          </div>
        </div>
      </div>

      {/* 3. Sección de Notas Observacionales en el Footer (Full-Width) */}
      {task.notes && task.notes.trim().length > 0 && (
        <div className="border-black-and-white/5 mt-0.5 border-t border-dashed pt-2.5 w-full">
          <div className="flex items-start gap-2">
            <MdOutlineStickyNote2 className="text-secondary mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
            <p className="text-secondary text-[12px] leading-relaxed italic opacity-80 whitespace-pre-wrap break-words">
              {task.notes}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
