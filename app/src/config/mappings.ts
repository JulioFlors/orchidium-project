import {
  Role,
  Severity,
  PlantType,
  PotSize,
  ZoneType,
  TableType,
  AgrochemicalType,
  AgrochemicalPurpose,
  DosageUnit,
  TaskStatus,
  TaskPurpose,
  TaskSource,
  DosingSource,
} from '@package/database/enums'

export {
  PlantType,
  PotSize,
  ZoneType,
  TableType,
  AgrochemicalType,
  AgrochemicalPurpose,
  DosageUnit,
  TaskStatus,
  Role,
  TaskPurpose,
  TaskSource,
  DosingSource,
  Severity,
}

export const DosingSourceLabels: Record<DosingSource, string> = {
  [DosingSource.ROUTINE]: 'Rutina Programada',
  [DosingSource.DEFERRED]: 'Aplicación Manual Diferida',
}

export const RoleLabels: Record<Role, string> = {
  [Role.ADMIN]: 'Administrador',
  [Role.USER]: 'Usuario',
}

export const SeverityLabels: Record<Severity, string> = {
  [Severity.LOW]: 'Baja',
  [Severity.MEDIUM]: 'Media',
  [Severity.HIGH]: 'Alta',
  [Severity.CRITICAL]: 'Crítica',
}

export const PlantTypeLabels: Record<PlantType, string> = {
  [PlantType.ADENIUM_OBESUM]: 'Adenium Obesum',
  [PlantType.BROMELIAD]: 'Bromelia',
  [PlantType.CACTUS]: 'Cactus',
  [PlantType.ORCHID]: 'Orquídea',
  [PlantType.SUCCULENT]: 'Suculenta',
}

export const PotSizeLabels: Record<PotSize, string> = {
  [PotSize.NRO_3]: 'P3',
  [PotSize.NRO_5]: 'P5',
  [PotSize.NRO_7]: 'P7',
  [PotSize.NRO_8]: 'P8',
  [PotSize.NRO_10]: 'P10',
  [PotSize.NRO_12]: 'P12',
  [PotSize.NRO_14]: 'P14',
  [PotSize.NRO_15]: 'P15',
  [PotSize.CT1]: 'CT1',
  [PotSize.CT2]: 'CT2',
  [PotSize.CT3]: 'CT3',
  [PotSize.CT4]: 'CT4',
}

export const PotSizeDimensions: Record<PotSize, string> = {
  [PotSize.NRO_3]: '3cm',
  [PotSize.NRO_5]: '5cm',
  [PotSize.NRO_7]: '7cm',
  [PotSize.NRO_8]: '8cm',
  [PotSize.NRO_10]: '10cm',
  [PotSize.NRO_12]: '12cm',
  [PotSize.NRO_14]: '14cm',
  [PotSize.NRO_15]: '15cm',
  [PotSize.CT1]: '13.9cm',
  [PotSize.CT2]: '16.7cm',
  [PotSize.CT3]: '19.7cm',
  [PotSize.CT4]: '22.4cm',
}

export const PotSizeColors: Record<PotSize, { border: string; text: string; bg: string }> = {
  [PotSize.NRO_3]: {
    border: 'border-emerald-500/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  [PotSize.NRO_5]: {
    border: 'border-teal-500/40',
    text: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10',
  },
  [PotSize.NRO_7]: {
    border: 'border-cyan-500/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  [PotSize.NRO_8]: {
    border: 'border-sky-500/40',
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
  },
  [PotSize.NRO_10]: {
    border: 'border-blue-500/40',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  [PotSize.NRO_12]: {
    border: 'border-indigo-500/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  [PotSize.NRO_14]: {
    border: 'border-violet-500/40',
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
  },
  [PotSize.NRO_15]: {
    border: 'border-purple-500/40',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
  [PotSize.CT1]: {
    border: 'border-fuchsia-500/40',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
  },
  [PotSize.CT2]: {
    border: 'border-pink-500/40',
    text: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-500/10',
  },
  [PotSize.CT3]: {
    border: 'border-rose-500/40',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
  },
  [PotSize.CT4]: {
    border: 'border-amber-500/40',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
}

export const ZoneTypeLabels: Record<ZoneType, string> = {
  [ZoneType.ZONA_A]: 'Orquideario',
  [ZoneType.ZONA_B]: 'Jardín',
  [ZoneType.ZONA_C]: 'Terraza',
  [ZoneType.ZONA_D]: 'Ventanas',
  [ZoneType.EXTERIOR]: 'Exterior',
}

export const ZONE_OPTIONS = Object.values(ZoneType).map((z) => ({
  label: ZoneTypeLabels[z],
  value: z,
}))

export const TableTypeLabels: Record<TableType, string> = {
  [TableType.MESA_1]: 'Mesa 1',
  [TableType.MESA_2]: 'Mesa 2',
  [TableType.MESA_3]: 'Mesa 3',
  [TableType.MESA_4]: 'Mesa 4',
  [TableType.MESA_5]: 'Mesa 5',
  [TableType.MESA_6]: 'Mesa 6',
}

export const AgrochemicalTypeLabels: Record<AgrochemicalType, string> = {
  [AgrochemicalType.FERTILIZANTE]: 'Fertilizante',
  [AgrochemicalType.FITOSANITARIO]: 'Fitosanitario',
}

export const AgrochemicalPurposeLabels: Record<AgrochemicalPurpose, string> = {
  [AgrochemicalPurpose.DESARROLLO]: 'Desarrollo',
  [AgrochemicalPurpose.FLORACION]: 'Floración',
  [AgrochemicalPurpose.MANTENIMIENTO]: 'Mantenimiento',
  [AgrochemicalPurpose.ACARICIDA]: 'Acaricida',
  [AgrochemicalPurpose.BACTERICIDA]: 'Bactericida',
  [AgrochemicalPurpose.FUNGICIDA]: 'Fungicida',
  [AgrochemicalPurpose.INSECTICIDA]: 'Insecticida',
}

export const DosageUnitLabels: Record<DosageUnit, string> = {
  [DosageUnit.ML_L]: 'mL/L',
  [DosageUnit.G_L]: 'g/L',
  [DosageUnit.CDA_L]: 'cda/L',
  [DosageUnit.CDITA_L]: 'cdita/L',
  [DosageUnit.CDITA_PLANTA]: 'cdita/planta',
  [DosageUnit.G_PLANTA]: 'g/planta',
  [DosageUnit.ML_PLANTA]: 'mL/planta',
  [DosageUnit.PORCENTAJE]: '%',
  [DosageUnit.GOTAS_L]: 'gotas/L',
  [DosageUnit.CC_L]: 'cc/L',
}

export const DOSAGE_UNIT_OPTIONS = [
  { label: 'mL/L', value: DosageUnit.ML_L },
  { label: 'g/L', value: DosageUnit.G_L },
  { label: 'cda/L', value: DosageUnit.CDA_L },
  { label: 'cdita/L', value: DosageUnit.CDITA_L },
  { label: 'cdita/planta', value: DosageUnit.CDITA_PLANTA },
  { label: 'g/planta', value: DosageUnit.G_PLANTA },
  { label: 'mL/planta', value: DosageUnit.ML_PLANTA },
  { label: '%', value: DosageUnit.PORCENTAJE },
  { label: 'gotas/L', value: DosageUnit.GOTAS_L },
  { label: 'cc/L', value: DosageUnit.CC_L },
]

export function formatDosage(value?: number | null, unit?: DosageUnit | string | null): string {
  if (value == null || !unit) return ''

  const unitLabel = (unit in DosageUnitLabels ? DosageUnitLabels[unit as DosageUnit] : unit) || unit

  const isSpoon =
    unit === DosageUnit.CDA_L || unit === DosageUnit.CDITA_L || unit === DosageUnit.CDITA_PLANTA

  let valDisplay = String(value)

  if (isSpoon) {
    if (value === 0.5) valDisplay = '1/2'
    else if (value === 0.25) valDisplay = '1/4'
    else if (value === 0.75) valDisplay = '3/4'
    else if (value === 0.125) valDisplay = '1/8'
    else if (value === 1.5) valDisplay = '1 1/2'
  }

  return `${valDisplay} ${unitLabel}`
}

export function formatAgrochemicalDosage(
  agro?: {
    dosageValue?: number | null
    dosageUnit?: DosageUnit | string | null
    isMix?: boolean
    mixIngredients?: {
      dosageValue: number
      dosageUnit: DosageUnit | string
      ingredient?: { name: string } | null
    }[]
  } | null,
): string {
  if (!agro) return ''

  if (agro.isMix && agro.mixIngredients && agro.mixIngredients.length > 0) {
    return agro.mixIngredients
      .map((item) => {
        const name = item.ingredient?.name || 'Insumo'
        const unit =
          (item.dosageUnit in DosageUnitLabels
            ? DosageUnitLabels[item.dosageUnit as DosageUnit]
            : item.dosageUnit) || item.dosageUnit

        return `${name} (${item.dosageValue} ${unit})`
      })
      .join(' + ')
  }

  return formatDosage(agro.dosageValue, agro.dosageUnit)
}

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'Pendiente',
  [TaskStatus.COMPLETED]: 'Completada',
  [TaskStatus.CANCELLED]: 'Cancelada',
  [TaskStatus.FAILED]: 'Fallida',
  [TaskStatus.EXPIRED]: 'Fallida',
  [TaskStatus.CONFIRMED]: 'Confirmada',
  [TaskStatus.IN_PROGRESS]: 'Ejecutando',
  [TaskStatus.WAITING_CONFIRMATION]: 'Esperando',
  [TaskStatus.AUTHORIZED]: 'Autorizada',
  [TaskStatus.DISPATCHED]: 'Despachada',
  [TaskStatus.ACKNOWLEDGED]: 'Recibida',
}

/**
 * Mapeo de estados especializado para dosificación manual de laboratorio (/dosing).
 * En este contexto agronómico, EXPIRED representa una tarea vencida por tiempo ("Expirada"),
 * a diferencia del hardware de riego donde representa una falla de ejecución ("Fallida").
 */
export const DosingTaskStatusLabels: Record<TaskStatus, string> = {
  ...TaskStatusLabels,
  [TaskStatus.EXPIRED]: 'Expirada',
}

export const TaskPurposeLabels: Record<TaskPurpose, string> = {
  [TaskPurpose.IRRIGATION]: 'Riego por Aspersión',
  [TaskPurpose.HUMIDIFICATION]: 'Nebulización',
  [TaskPurpose.SOIL_WETTING]: 'Humectación del Suelo',
  [TaskPurpose.FERTIGATION]: 'Fertirriego',
  [TaskPurpose.FUMIGATION]: 'Control Fitosanitario',
}

export const TaskSourceLabels: Record<TaskSource, string> = {
  [TaskSource.MANUAL]: 'Manual',
  [TaskSource.DEFERRED]: 'Diferido',
  [TaskSource.ROUTINE]: 'Rutina',
  [TaskSource.INFERENCE]: 'Inferencia',
}

/**
 * Mapa de Capacidades (Capability Map)
 * Define qué zonas físicas tienen hardware instalado para soportar ciertas operaciones.
 * Actualmente, solo el Orquideario (ZONA_A) cuenta con actuadores de riego.
 */
export const ZoneCapabilities: Record<TaskPurpose, ZoneType[]> = {
  [TaskPurpose.IRRIGATION]: [ZoneType.ZONA_A],
  [TaskPurpose.FERTIGATION]: [ZoneType.ZONA_A],
  [TaskPurpose.FUMIGATION]: [ZoneType.ZONA_A],
  [TaskPurpose.HUMIDIFICATION]: [ZoneType.ZONA_A],
  [TaskPurpose.SOIL_WETTING]: [ZoneType.ZONA_A],
}

/**
 * Clases CSS de Tailwind asociadas a cada estado de tarea.
 * Uso: colorear badges, iconos y bordes de tarjetas de forma centralizada.
 */
export const TaskStatusStyles: Record<TaskStatus, string> = {
  // 1. Fase de Gestación (Azules y Violetas)
  [TaskStatus.PENDING]: 'text-blue-600 dark:text-blue-400',
  [TaskStatus.WAITING_CONFIRMATION]: 'text-violet-500',

  // 2. Fase de Conectividad (Indigo y Cian)
  [TaskStatus.DISPATCHED]: 'text-indigo-500',
  [TaskStatus.ACKNOWLEDGED]: 'text-cyan-500',
  [TaskStatus.CONFIRMED]: 'text-cyan-500',

  // 3. Fase de Acción (Verdes)
  [TaskStatus.AUTHORIZED]: 'text-lime-500',
  [TaskStatus.IN_PROGRESS]: 'text-emerald-500',
  [TaskStatus.COMPLETED]: 'text-green-600',

  // 4. Fase Terminal (Gris, Naranja y Rojos)
  [TaskStatus.CANCELLED]: 'text-orange-600',
  [TaskStatus.FAILED]: 'text-red-500',
  [TaskStatus.EXPIRED]: 'text-red-500',
}

/**
 * Estilos visuales asociados al propósito del agroquímico.
 * Define la identidad cromática de la sustancia en la UI.
 */
export const AgrochemicalPurposeStyles: Record<AgrochemicalPurpose, string> = {
  // Fertilizantes
  [AgrochemicalPurpose.DESARROLLO]: 'text-green-500',
  [AgrochemicalPurpose.FLORACION]: 'text-violet-500',
  [AgrochemicalPurpose.MANTENIMIENTO]: 'text-blue-500',

  // Fitosanitarios
  [AgrochemicalPurpose.ACARICIDA]: 'text-orange-500',
  [AgrochemicalPurpose.BACTERICIDA]: 'text-red-500',
  [AgrochemicalPurpose.FUNGICIDA]: 'text-amber-500',
  [AgrochemicalPurpose.INSECTICIDA]: 'text-rose-600',
}

/**
 * Mapa de Sensores (Sensor Map)
 * Define qué métricas de telemetría están disponibles para cada zona.
 */
export const ZoneMetrics: Partial<Record<ZoneType, string[]>> = {
  [ZoneType.EXTERIOR]: ['temperature', 'humidity', 'illuminance', 'rain_intensity'],
  [ZoneType.ZONA_A]: ['temperature', 'humidity', 'illuminance'],
}

/**
 * Etiquetas estéticas para las métricas (UI)
 */
export const MetricLabels: Record<string, string> = {
  temperature: 'Temperatura',
  humidity: 'Humedad Relativa',
  illuminance: 'Iluminancia',
  rain_intensity: 'Precipitación',
  rain_events: 'Sensor de lluvia',
  dli: 'DLI (Luz Acumulada)',
  vpd_avg: 'VPD (Presión de Vapor)',
  dif: 'DIF (Contraste Térmico)',
  high_humidity_hours: 'Riesgo Fúngico',
}

/**
 * Unidades asociadas a cada métrica
 */
export const MetricUnits: Record<string, string> = {
  temperature: '°C',
  humidity: '%',
  illuminance: 'lux',
  rain_intensity: '%',
  dli: 'mol/m²/d',
  vpd_avg: 'kPa',
  dif: '°C',
  high_humidity_hours: 'horas',
}

/** Orden jerárquico de tamaños de maceta de MENOR a MAYOR (Macetas P3..P15 ➔ Cestas CT1..CT4) */
export const POT_SIZE_ORDER_ASC: PotSize[] = [
  PotSize.NRO_3,
  PotSize.NRO_5,
  PotSize.NRO_7,
  PotSize.NRO_8,
  PotSize.NRO_10,
  PotSize.NRO_12,
  PotSize.NRO_14,
  PotSize.NRO_15,
  PotSize.CT1,
  PotSize.CT2,
  PotSize.CT3,
  PotSize.CT4,
]

export const getPotSizeAscIndex = (size: PotSize | string): number => {
  const index = POT_SIZE_ORDER_ASC.indexOf(size as PotSize)

  return index !== -1 ? index : 999
}

export function sortVariantsByPotSizeAsc<T extends { size: PotSize | string }>(variants: T[]): T[] {
  return [...variants].sort((a, b) => getPotSizeAscIndex(a.size) - getPotSizeAscIndex(b.size))
}
