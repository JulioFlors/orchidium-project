import {
  PlantType,
  PotSize,
  ZoneType,
  TableType,
  AgrochemicalType,
  AgrochemicalPurpose,
  TaskStatus,
  Role,
  TaskPurpose,
  TaskSource,
} from '@package/database/enums'

export const RoleLabels: Record<Role, string> = {
  [Role.ADMIN]: 'Administrador',
  [Role.USER]: 'Usuario',
}

export const PlantTypeLabels: Record<PlantType, string> = {
  [PlantType.ADENIUM_OBESUM]: 'Adenium Obesum',
  [PlantType.BROMELIAD]: 'Bromelia',
  [PlantType.CACTUS]: 'Cactus',
  [PlantType.ORCHID]: 'Orquídea',
  [PlantType.SUCCULENT]: 'Suculenta',
}

export const PotSizeLabels: Record<PotSize, string> = {
  [PotSize.NRO_5]: 'P5',
  [PotSize.NRO_7]: 'P7',
  [PotSize.NRO_10]: 'P10',
  /* [PotSize.NRO_12]: 'P12', */
  [PotSize.NRO_14]: 'P14',
}

export const PotSizeDimensions: Record<PotSize, string> = {
  [PotSize.NRO_5]: '5cm',
  [PotSize.NRO_7]: '7cm',
  [PotSize.NRO_10]: '10cm',
  /* [PotSize.NRO_12]: '12cm', */
  [PotSize.NRO_14]: '14cm',
}

export const ZoneTypeLabels: Record<ZoneType, string> = {
  [ZoneType.ZONA_A]: 'Orquideario',
  [ZoneType.ZONA_B]: 'Zona B',
  [ZoneType.ZONA_C]: 'Zona C',
  [ZoneType.ZONA_D]: 'Zona D',
  [ZoneType.EXTERIOR]: 'Exterior',
}

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

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'Pendiente',
  [TaskStatus.COMPLETED]: 'Completada',
  [TaskStatus.CANCELLED]: 'Cancelada',
  [TaskStatus.FAILED]: 'Fallida',
  [TaskStatus.EXPIRED]: 'Expirada',
  [TaskStatus.SKIPPED]: 'Omitida',
  [TaskStatus.CONFIRMED]: 'Confirmada',
  [TaskStatus.IN_PROGRESS]: 'Ejecutando',
  [TaskStatus.WAITING_CONFIRMATION]: 'Esperando',
  [TaskStatus.AUTHORIZED]: 'Autorizada',
  [TaskStatus.DISPATCHED]: 'Despachada',
  [TaskStatus.ACKNOWLEDGED]: 'Recibida',
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
  [TaskStatus.PENDING]: 'text-blue-500',
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
  [TaskStatus.SKIPPED]: 'text-slate-400',
  [TaskStatus.CANCELLED]: 'text-orange-600',
  [TaskStatus.FAILED]: 'text-red-500',
  [TaskStatus.EXPIRED]: 'text-red-500',
}
