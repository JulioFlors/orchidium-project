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

    try {
      const body = await request.json()

      if (body.reason && typeof body.reason === 'string') {
        reason = body.reason.trim()
      }
    } catch {
      // Body vacío o no JSON — usar motivo por defecto
    }

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
    // eslint-disable-next-line no-console
    console.error('Error cancelando tarea diferida:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
