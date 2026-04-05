import { NextResponse } from 'next/server'
import { prisma } from '@package/database'

// TTL de 7 días para los snapshots de auditoría
const AUDIT_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * GET /api/admin/audit?device=actuator&category=lux
 * Consulta los snapshots vigentes (< 7 días). Elimina los caducados en la misma query.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const device = searchParams.get('device')
  const category = searchParams.get('category')

  if (!device || !category) {
    return NextResponse.json({ error: 'Parámetros device y category requeridos' }, { status: 400 })
  }

  // Limpieza automática de snapshots caducados (> 7 días)
  const cutoff = new Date(Date.now() - AUDIT_TTL_MS)

  await prisma.auditSnapshot.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })

  // Consultar snapshots vigentes
  const snapshots = await prisma.auditSnapshot.findMany({
    where: { device, category },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ snapshots })
}

/**
 * POST /api/admin/audit
 * Persiste un nuevo snapshot de auditoría.
 * Body: { device: string, category: string, data: object }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      device: string
      category: string
      data: unknown
    }
    const { device, category, data } = body

    if (!device || !category || !data) {
      return NextResponse.json(
        { error: 'Campos device, category y data requeridos' },
        { status: 400 },
      )
    }

    const snapshot = await prisma.auditSnapshot.create({
      data: { device, category, data: data as object },
    })

    return NextResponse.json({ snapshot }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Error al persistir snapshot', details: String(err) },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/admin/audit?device=actuator&category=lux
 * Limpia todos los snapshots de una categoría específica (botón "Refrescar").
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const device = searchParams.get('device')
  const category = searchParams.get('category')

  if (!device || !category) {
    return NextResponse.json({ error: 'Parámetros device y category requeridos' }, { status: 400 })
  }

  const result = await prisma.auditSnapshot.deleteMany({
    where: { device, category },
  })

  return NextResponse.json({ deleted: result.count })
}
