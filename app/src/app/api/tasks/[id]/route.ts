import { NextResponse } from 'next/server'
import { prisma, TaskStatus } from '@package/database'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 })
    }

    // Leer el motivo de cancelación del body (opcional pero esperado)
    let reason = 'Tarea Cancelada por el Admin antes de iniciar'
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
            scheduleId: schedule.id,
            notes: `Rutina cancelada manualmente. Motivo: ${reason}`,
          },
        })

        // 3. Registrar el evento
        await tx.taskEventLog.create({
          data: {
            taskId: task.id,
            status: TaskStatus.CANCELLED,
            notes: `Rutina cancelada manualmente. Motivo: ${reason}`,
          },
        })

        return task
      })

      return NextResponse.json(canceledRoutineLog)
    }

    // ---- CASO B: Cancelación de Tarea Diferida Tradicional ----
    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await tx.taskLog.update({
        where: { id },
        data: {
          status: TaskStatus.CANCELLED,
          notes: reason,
        },
      })

      // Registrar el evento de cancelación en la línea de tiempo
      await tx.taskEventLog.create({
        data: {
          taskId: id,
          status: TaskStatus.CANCELLED,
          notes: reason,
        },
      })

      return task
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error cancelando tarea diferida:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
