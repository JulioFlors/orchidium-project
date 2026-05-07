import { prisma, TaskStatus } from '@package/database'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { Logger } from '@/lib'
import { auth, sendMqttCommand } from '@/lib/server'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 })
    }

    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id
    const userName = session?.user?.name || 'Administrador'

    // Leer el motivo de cancelación del body (opcional pero esperado)
    let reason = `Tarea Cancelada por ${userName} antes de iniciar`
    let scheduledAtOverride: Date | null = null

    try {
      const body = await request.json()

      if (body.reason && typeof body.reason === 'string') {
        reason = body.reason.trim()
      }
      if (body.scheduledAt) {
        scheduledAtOverride = new Date(body.scheduledAt)
      }
    } catch {
      // Body vacío o no JSON — usar motivo por defecto
    }

    // ---- CASO A: Cancelación de Rutina Programada (Proyección) ----
    if (id.startsWith('routine-')) {
      const scheduleId = id.replace('routine-', '')

      const schedule = await prisma.automationSchedule.findUnique({
        where: { id: scheduleId },
      })

      if (!schedule) {
        return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
      }

      // 1. Usar el Override exacto del cliente (Preferido)
      // 2. Si no viene, usar Croner como fallback
      let nextScheduledAt = scheduledAtOverride || new Date()

      if (!scheduledAtOverride) {
        try {
          const { Cron } = await import('croner')
          const job = new Cron(schedule.cronTrigger, { timezone: 'America/Caracas' })
          const nextRun = job.nextRun()

          if (nextRun) {
            nextScheduledAt = nextRun
          }
        } catch {
          // Ignorar si hay error en cron
        }
      }

      const canceledRoutineLog = await prisma.$transaction(async (tx) => {
        // 1. (Omitido) Ya no deshabilitamos la rutina completa, solo cancelamos esta ejecución específica
        // creando un registro CANCELLED que servirá de marcador para el Scheduler.

        // 2. Crear una entrada CANCELADA "fantasma" en el TaskLog para el historial
        const task = await tx.taskLog.create({
          data: {
            purpose: schedule.purpose,
            zones: schedule.zones,
            status: TaskStatus.CANCELLED,
            source: 'ROUTINE',
            duration: schedule.durationMinutes,
            scheduledAt: nextScheduledAt,
            executedAt: nextScheduledAt,
            scheduleId: schedule.id,
            notes: `Rutina cancelada manualmente. Motivo: ${reason}`,
          },
        })

        // 3. Registrar el evento
        await tx.taskEventLog.create({
          data: {
            taskId: task.id,
            status: TaskStatus.CANCELLED,
            notes: `Rutina cancelada por ${userName}. Motivo: ${reason}`,
            userId,
          },
        })

        return task
      })

      return NextResponse.json(canceledRoutineLog)
    }

    // ---- CASO B: Cancelación de Tarea Diferida Tradicional ----
    const task = await prisma.taskLog.findUnique({
      where: { id },
      select: { status: true, purpose: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const activeStatuses: TaskStatus[] = [
      TaskStatus.DISPATCHED,
      TaskStatus.ACKNOWLEDGED,
      TaskStatus.IN_PROGRESS,
    ]
    const isActivelyRunning = activeStatuses.includes(task.status)

    const finalStatus = TaskStatus.CANCELLED
    const finalReason =
      reason ||
      (isActivelyRunning
        ? 'Tarea Cancelada durante su ejecución.'
        : 'Tarea Cancelada antes de su ejecución.')

    // 1. Si está activa, enviar OFF al hardware
    if (isActivelyRunning) {
      try {
        await sendMqttCommand('PristinoPlant/Actuator_Controller/irrigation/cmd', {
          circuit: task.purpose,
          state: 'OFF',
          task_id: id,
        })
      } catch (err) {
        Logger.error('Error al enviar comando de parada (OFF) desde la API:', err)
        // Continuamos con el cambio de estado en DB para que la UI refleje la intención
      }
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.taskLog.update({
        where: { id },
        data: {
          status: finalStatus,
          notes: finalReason,
        },
      })

      // Registrar el evento con discriminación semántica
      await tx.taskEventLog.create({
        data: {
          taskId: id,
          status: finalStatus,
          notes: finalReason,
          userId,
        },
      })

      return updated
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    Logger.error('Error al procesar la cancelación de la tarea:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
