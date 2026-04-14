import { TaskLog, TaskStatus } from './generated/prisma/client'
import prisma from './client'
import { Cron } from 'croner'

const GRACE_WINDOW_MINUTES = 15

export class CollisionGuard {
  /**
   * Verifica si una ventana de tiempo específica colisiona con tareas programadas
   * o ejecutándose en el Circuito Hidráulico único.
   */
  static async checkTimeWindow(
    startTime: Date,
    durationMinutes: number,
    excludeTaskId?: string
  ): Promise<{ hasCollision: boolean; conflictingTasks: TaskLog[] }> {
    const windowStart = startTime
    const windowEnd = new Date(startTime.getTime() + (durationMinutes + GRACE_WINDOW_MINUTES) * 60000)

    const activeStatuses: TaskStatus[] = [
      'PENDING',
      'WAITING_CONFIRMATION',
      'CONFIRMED',
      'DISPATCHED',
      'ACKNOWLEDGED',
      'IN_PROGRESS',
    ]

    const potentialConflicts = await prisma.taskLog.findMany({
      where: {
        status: { in: activeStatuses },
        ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
        scheduledAt: {
          lt: windowEnd,
        }
      }
    })

    const conflictingTasks = potentialConflicts.filter((task) => {
      // 1. Calculamos la ventana ocupada REAL de la tarea en la BD
      // Asumimos que la tarea ocupará el relé desde su scheduledAt hasta: scheduledAt + duration + grace
      const taskStartTime = task.scheduledAt
      const taskEndTime = new Date(taskStartTime.getTime() + (task.duration + GRACE_WINDOW_MINUTES) * 60000)
      
      // 2. Comprobamos Intersección Estricta:
      // ¿El inicio de nuestra nueva tarea cae antes de que termine la vieja, 
      // Y el fin de nuestra nueva tarea cae después de que inicie la vieja?
      const seSolapan = windowStart < taskEndTime && windowEnd > taskStartTime

      // Adicional: Si la tarea de la BD ya está IN_PROGRESS, la realidad manda. 
      // Su ventana de ocupación empezó en `executedAt`
      if (task.status === 'IN_PROGRESS' && task.executedAt) {
          const realEndTime = new Date(task.executedAt.getTime() + task.duration * 60000)
          return windowStart < realEndTime
      }

      return seSolapan
    })

    return {
      hasCollision: conflictingTasks.length > 0,
      conflictingTasks
    }
  }

  /**
   * Verifica si una expresión Cron generará colisiones matemáticas (solapamiento 
   * de intervalos) con las otras rutinas habilitadas, mapeando N días en el futuro.
   */
  static async validateCronSchedule(
    cronTrigger: string,
    durationMinutes: number,
    daysToCheck: number = 7,
    excludeScheduleId?: string
  ): Promise<{ hasCollision: boolean; details?: string }> {
    const activeSchedules = await prisma.automationSchedule.findMany({
      where: {
        isEnabled: true,
        ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {})
      }
    })

    if (activeSchedules.length === 0) return { hasCollision: false }

    const now = new Date()
    const endDate = new Date(now.getTime() + daysToCheck * 24 * 60 * 60 * 1000)

    const myDates = this.getCronDates(cronTrigger, now, endDate)
    const myDurationMs = (durationMinutes + GRACE_WINDOW_MINUTES) * 60000

    // 1. Recopilar todos los intervalos ocupados por otros programas activos
    const occupiedIntervals: { start: number; end: number; name: string }[] = []
    
    for (const schedule of activeSchedules) {
        const theirDates = this.getCronDates(schedule.cronTrigger, now, endDate)
        const theirDurationMs = (schedule.durationMinutes + GRACE_WINDOW_MINUTES) * 60000
        
        for (const start of theirDates) {
            occupiedIntervals.push({
                start: start.getTime(),
                end: start.getTime() + theirDurationMs,
                name: schedule.name
            })
        }
    }

    // 2. Ordenar intervalos ocupados por tiempo de inicio para búsqueda eficiente
    occupiedIntervals.sort((a, b) => a.start - b.start)
    
    // 3. Validar mis fechas contra la línea de tiempo ocupada
    for (const myStart of myDates) {
        const myStartTime = myStart.getTime()
        const myEndTime = myStartTime + myDurationMs
        
        for (const interval of occupiedIntervals) {
            // Optimización: si el inicio del intervalo ajeno es posterior a nuestro fin, 
            // ya no chocamos con este ni con los siguientes (por estar ordenados).
            if (interval.start >= myEndTime) break
            
            // Condición de colisión: solapamiento de ventanas
            if (myStartTime < interval.end && interval.start < myEndTime) {
                return {
                    hasCollision: true,
                    details: `Colisión detectada con '${interval.name}' el ${myStart.toLocaleDateString()} a las ${myStart.toLocaleTimeString()}`
                }
            }
        }
    }

    return { hasCollision: false }
  }

  private static getCronDates(cronStr: string, start: Date, end: Date): Date[] {
    const dates: Date[] = []
    try {
        const interval = new Cron(cronStr, { timezone: 'America/Caracas' })
        let next = interval.nextRun(start)
        
        // Límite estricto de iteraciones para prevenir bucles infinitos en Node (Secuestro del Event Loop)
        let maxIterations = 500

        while (next && next <= end && maxIterations > 0) {
            dates.push(next)
            next = interval.nextRun(next)
            maxIterations--
        }
    } catch {
        return []
    }
    return dates
  }
}
