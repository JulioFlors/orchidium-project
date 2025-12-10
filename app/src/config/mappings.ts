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
  [PotSize.NRO_5]: 'Nro 5',
  [PotSize.NRO_7]: 'Nro 7',
  [PotSize.NRO_10]: 'Nro 10',
  [PotSize.NRO_14]: 'Nro 14',
}

export const ZoneTypeLabels: Record<ZoneType, string> = {
  [ZoneType.ZONA_A]: 'Zona A',
  [ZoneType.ZONA_B]: 'Zona B',
  [ZoneType.ZONA_C]: 'Zona C',
  [ZoneType.ZONA_D]: 'Zona D',
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
  [TaskStatus.SKIPPED]: 'Omitida',
  [TaskStatus.CONFIRMED]: 'Confirmada',
  [TaskStatus.IN_PROGRESS]: 'En Progreso',
  [TaskStatus.WAITING_CONFIRMATION]: 'Esperando Confirmación',
}

export const TaskPurposeLabels: Record<TaskPurpose, string> = {
  [TaskPurpose.IRRIGATION]: 'Riego',
  [TaskPurpose.FERTIGATION]: 'Fertirriego',
  [TaskPurpose.FUMIGATION]: 'Fumigación',
  [TaskPurpose.HUMIDIFICATION]: 'Humidificación',
  [TaskPurpose.SOIL_WETTING]: 'Humedecer Suelo',
}
