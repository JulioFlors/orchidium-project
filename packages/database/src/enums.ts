// Re-exportamos directamente el archivo generado por Prisma 7
// Este archivo es seguro para el cliente (Browser)
export * from './generated/prisma/enums'

export const ExecutionType = {
  HARDWARE: 'HARDWARE',
  MANUAL: 'MANUAL',
} as const

export type ExecutionType = (typeof ExecutionType)[keyof typeof ExecutionType]