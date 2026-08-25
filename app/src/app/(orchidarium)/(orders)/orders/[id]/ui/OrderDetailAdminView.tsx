'use client'

import type {
  OrderStatus,
  PaymentMethod,
  PotSize,
  ZoneType,
  TableType,
} from '@package/database/enums'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  PiArrowLeftBold,
  PiCheckCircleBold,
  PiClockBold,
  PiPackageBold,
  PiReceiptBold,
  PiStorefrontBold,
  PiTruckBold,
  PiUserBold,
  PiWarningCircleBold,
  PiWhatsappLogoFill,
  PiXCircleBold,
} from 'react-icons/pi'

import { Button, Heading } from '@/components'
import {
  assignPlantToOrderItem,
  cancelOrder,
  confirmOrderPayment,
  getAvailablePlantsForOrderItem,
  updateOrderStatus,
} from '@/actions'
import { PotSizeLabels, ZoneTypeLabels, TableTypeLabels } from '@/config/mappings'
import { useFormatPrice } from '@/lib'
import { authClient } from '@/lib/client/auth-client'

export interface PlantWithLocation {
  id: string
  currentSize: PotSize
  status: string
  location?: {
    id: string
    zone: ZoneType
    table: TableType
  } | null
}

export interface AdminOrderItem {
  id: string
  orderId: string
  variantId: string | null
  plantId: string | null
  speciesName: string
  size: PotSize
  unitPrice: number
  quantity: number
  plant?: {
    id: string
    currentSize: PotSize
    status: string
    location?: {
      id: string
      zone: ZoneType
      table: TableType
    } | null
  } | null
}

export interface AdminOrderDetail {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  subtotal: number
  tax: number
  totalUsd: number
  totalVes: number
  exchangeRate: number
  shippingAddress: unknown
  billingInfo: unknown
  expiresAt: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  user: {
    id: string
    name: string | null
    email: string | null
  }
  items: AdminOrderItem[]
  saleRecord?: unknown
}

interface Props {
  order: AdminOrderDetail
}

const STATUS_LABELS: Record<OrderStatus, { label: string; badge: string; icon: string }> = {
  PENDING_PAYMENT: {
    label: 'Pendiente de Pago',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400',
    icon: '⏳',
  },
  PAYMENT_VERIFYING: {
    label: 'Verificando Pago',
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
    icon: '🔍',
  },
  PAID: {
    label: 'Pagado',
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
    icon: '✅',
  },
  DISPATCHED: {
    label: 'Despachado / Entregado',
    badge: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400',
    icon: '📦',
  },
  CANCELLED: {
    label: 'Cancelado',
    badge: 'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400',
    icon: '❌',
  },
  EXPIRED: {
    label: 'Vencido',
    badge: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30 dark:text-zinc-400',
    icon: '⌛',
  },
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  PAGO_MOVIL: 'Pago Móvil (Mercantil)',
  TRANSFERENCIA_VES: 'Transferencia Bancaria (Mercantil)',
  EFECTIVO_DIVISAS: 'Efectivo en Divisas',
}

interface ShippingInfo {
  name?: string
  idNumber?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  deliveryType?: 'SHIPPING' | 'PICKUP'
  shippingMethod?: string
}

export function OrderDetailAdminView({ order }: Props) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { format: formatPrice } = useFormatPrice()
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  // Estado para desplegables de selección de plantas físicas por ítem
  const [availablePlantsMap, setAvailablePlantsMap] = useState<Record<string, PlantWithLocation[]>>(
    {},
  )
  const [loadingPlantsForItem, setLoadingPlantsForItem] = useState<string | null>(null)
  const [selectedPlantForItem, setSelectedPlantForItem] = useState<Record<string, string>>({})

  const shipping = (order.shippingAddress as ShippingInfo) || {}
  const isPickup = shipping.deliveryType === 'PICKUP'
  const statusConfig = STATUS_LABELS[order.status] || {
    label: order.status,
    badge: 'bg-zinc-500/10 text-zinc-600',
    icon: '📋',
  }

  // Teléfono formateado para WhatsApp
  const cleanPhone = shipping.phone ? shipping.phone.replace(/[^0-9]/g, '') : ''
  const formattedPhone = cleanPhone.startsWith('0')
    ? `58${cleanPhone.slice(1)}`
    : cleanPhone.startsWith('58')
      ? cleanPhone
      : `58${cleanPhone}`

  const whatsappMessage = encodeURIComponent(
    `¡Hola ${shipping.name || order.user.name || 'Cliente'}! Te contactamos de Pristinoplant sobre tu pedido #${order.orderNumber}.`,
  )

  // Abrir selector de plantas disponibles para un ítem
  async function handleLoadAvailablePlants(orderItemId: string) {
    if (availablePlantsMap[orderItemId]) {
      // Toggle
      setAvailablePlantsMap((prev) => {
        const next = { ...prev }

        delete next[orderItemId]

        return next
      })

      return
    }

    setLoadingPlantsForItem(orderItemId)
    const result = await getAvailablePlantsForOrderItem(orderItemId)

    setLoadingPlantsForItem(null)

    if (result.ok && result.plants) {
      setAvailablePlantsMap((prev) => ({
        ...prev,
        [orderItemId]: result.plants as PlantWithLocation[],
      }))
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'No se pudieron consultar las plantas disponibles.',
      })
    }
  }

  // Asignar planta seleccionada
  function handleAssignPlant(orderItemId: string) {
    const plantId = selectedPlantForItem[orderItemId]

    if (!plantId) {
      setFeedback({ type: 'error', message: 'Selecciona una planta física para asignar.' })

      return
    }

    startTransition(async () => {
      setFeedback(null)
      const res = await assignPlantToOrderItem(orderItemId, plantId)

      if (res.ok) {
        setFeedback({ type: 'success', message: 'Ejemplar físico asignado exitosamente.' })
        // Limpiar selector
        setAvailablePlantsMap((prev) => {
          const next = { ...prev }

          delete next[orderItemId]

          return next
        })
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: res.message || 'Error al asignar la planta.' })
      }
    })
  }

  // Confirmar pago
  function handleConfirmPayment() {
    startTransition(async () => {
      setFeedback(null)
      const res = await confirmOrderPayment(order.id, session?.user?.id)

      if (res.ok) {
        setFeedback({
          type: 'success',
          message:
            'Pago confirmado. Venta registrada en el historial y stock actualizado a VENDIDO.',
        })
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: res.message || 'Error al confirmar pago.' })
      }
    })
  }

  // Actualizar estado general
  function handleUpdateStatus(newStatus: OrderStatus) {
    startTransition(async () => {
      setFeedback(null)
      const res = await updateOrderStatus(order.id, newStatus)

      if (res.ok) {
        setFeedback({ type: 'success', message: `Estado actualizado a ${newStatus}.` })
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: res.message || 'Error al actualizar estado.' })
      }
    })
  }

  // Cancelar orden
  function handleCancelOrder() {
    startTransition(async () => {
      setFeedback(null)
      const res = await cancelOrder(order.id)

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: 'Orden cancelada y ejemplares físicos liberados a DISPONIBLE.',
        })
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: res.message || 'Error al cancelar la orden.' })
      }
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Botón Volver y Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            className="border-input-outline bg-canvas text-primary hover:bg-hover-overlay rounded-xl border p-2.5 transition-colors"
            href="/orders"
          >
            <PiArrowLeftBold className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Heading
                description={`Creado el ${new Date(order.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                title={`Pedido #${order.orderNumber}`}
              />
            </div>
          </div>
        </div>

        {/* Badge de Estado Principal */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold shadow-sm ${statusConfig.badge}`}
          >
            <span>{statusConfig.icon}</span>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Mensajes de Feedback */}
      {feedback && (
        <div
          className={`rounded-xl border p-4 text-xs font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Barra de Acciones Administrativas */}
      <div className="bg-canvas border-input-outline flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-secondary text-xs font-semibold">Acciones rápidas:</span>

          {order.status !== 'PAID' &&
            order.status !== 'DISPATCHED' &&
            order.status !== 'CANCELLED' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isPending}
                size="sm"
                variant="primary"
                onClick={handleConfirmPayment}
              >
                <PiCheckCircleBold className="mr-1 text-base" />
                Confirmar Pago y Registrar Venta
              </Button>
            )}

          {order.status === 'PENDING_PAYMENT' && (
            <Button
              className="border-input-outline bg-surface text-primary"
              disabled={isPending}
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateStatus('PAYMENT_VERIFYING')}
            >
              <PiClockBold className="mr-1 text-base text-blue-500" />
              Marcar como Verificando
            </Button>
          )}

          {order.status === 'PAID' && (
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isPending}
              size="sm"
              variant="primary"
              onClick={() => handleUpdateStatus('DISPATCHED')}
            >
              <PiPackageBold className="mr-1 text-base" />
              Marcar como Despachado / Entregado
            </Button>
          )}

          {order.status !== 'CANCELLED' && (
            <Button
              className="border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
              disabled={isPending}
              size="sm"
              variant="ghost"
              onClick={handleCancelOrder}
            >
              <PiXCircleBold className="mr-1 text-base" />
              Cancelar Pedido
            </Button>
          )}
        </div>

        {shipping.phone && (
          <a
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-400"
            href={`https://wa.me/${formattedPhone}?text=${whatsappMessage}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <PiWhatsappLogoFill className="text-base" />
            Contactar Cliente por WhatsApp
          </a>
        )}
      </div>

      {/* Grid Principal: Ítems y Asignación vs Fichas Informativas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna Izquierda (2 Cols): Lista de Ítems y Asignación de Plantas Físicas */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="bg-canvas border-input-outline flex flex-col gap-4 rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <h2 className="text-primary text-base font-bold">
                Ejemplares del Pedido ({order.items.length})
              </h2>
              <span className="text-secondary text-xs">
                Asigna el código físico real del stock para cada planta
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {order.items.map((item) => {
                const assignedPlant = item.plant
                const availablePlants = availablePlantsMap[item.id] || []
                const isSelectorOpen = Boolean(availablePlantsMap[item.id])

                return (
                  <div
                    key={item.id}
                    className="border-input-outline bg-surface/40 flex flex-col gap-3 rounded-xl border p-4 transition-all"
                  >
                    {/* Fila del Ítem */}
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="text-primary text-sm font-bold">{item.speciesName}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {PotSizeLabels[item.size] || item.size}
                            </span>
                            <span className="text-secondary">
                              Precio unitario: {formatPrice(item.unitPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-primary text-sm font-bold">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>

                    {/* Ficha de Asignación de Planta Física */}
                    <div className="bg-canvas border-input-outline flex flex-col gap-2 rounded-lg border p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-secondary font-semibold">Ejemplar en Stock:</span>
                          {assignedPlant ? (
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                🌿 #{assignedPlant.id.slice(-8).toUpperCase()}
                              </span>
                              {assignedPlant.location && (
                                <span className="text-secondary text-[11px]">
                                  📍{' '}
                                  {ZoneTypeLabels[assignedPlant.location.zone] ||
                                    assignedPlant.location.zone}{' '}
                                  -{' '}
                                  {TableTypeLabels[assignedPlant.location.table] ||
                                    assignedPlant.location.table}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600 dark:text-amber-400">
                              <PiWarningCircleBold className="text-sm" />
                              Sin asignar
                            </span>
                          )}
                        </div>

                        {/* Botón para abrir selector de plantas físicas */}
                        <button
                          className="text-primary hover:text-emerald-600 cursor-pointer text-xs font-bold underline transition-colors"
                          type="button"
                          onClick={() => handleLoadAvailablePlants(item.id)}
                        >
                          {isSelectorOpen
                            ? 'Cerrar selector'
                            : assignedPlant
                              ? 'Cambiar ejemplar'
                              : 'Asignar ejemplar físico'}
                        </button>
                      </div>

                      {/* Selector desplegable de plantas físicas disponibles */}
                      {isSelectorOpen && (
                        <div className="border-input-outline mt-2 flex flex-col gap-2 border-t pt-3">
                          {loadingPlantsForItem === item.id ? (
                            <p className="text-secondary py-2 text-center text-xs">
                              Buscando plantas disponibles en el stock...
                            </p>
                          ) : availablePlants.length === 0 ? (
                            <p className="text-secondary py-2 text-center text-xs">
                              No hay plantas físicas disponibles en stock para esta especie y
                              tamaño.
                            </p>
                          ) : (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <select
                                className="border-input-outline bg-surface text-primary flex-1 rounded-lg border px-3 py-2 text-xs outline-none focus:border-emerald-500"
                                value={selectedPlantForItem[item.id] || assignedPlant?.id || ''}
                                onChange={(e) =>
                                  setSelectedPlantForItem((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">Selecciona un ejemplar físico...</option>
                                {availablePlants.map((plant) => (
                                  <option key={plant.id} value={plant.id}>
                                    #{plant.id.slice(-8).toUpperCase()} — (
                                    {plant.location
                                      ? `${ZoneTypeLabels[plant.location.zone]} / ${TableTypeLabels[plant.location.table]}`
                                      : 'Sin ubicación'}
                                    ) [{plant.status}]
                                  </option>
                                ))}
                              </select>

                              <Button
                                disabled={isPending || !selectedPlantForItem[item.id]}
                                size="sm"
                                variant="primary"
                                onClick={() => handleAssignPlant(item.id)}
                              >
                                Guardar Asignación
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Datos de Entrega, Cliente y Resumen Financiero */}
        <div className="flex flex-col gap-6">
          {/* Ficha 1: Datos del Cliente y Entrega */}
          <div className="bg-canvas border-input-outline flex flex-col gap-4 rounded-xl border p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <PiUserBold className="text-lg text-emerald-500" />
              <h2 className="text-primary text-base font-bold">Cliente y Entrega</h2>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary font-medium">Nombre:</span>
                <span className="text-primary font-bold">
                  {shipping.name || order.user.name || 'Sin especificar'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary font-medium">Cédula / RIF:</span>
                <span className="text-primary font-semibold">
                  {shipping.idNumber || 'No especificada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary font-medium">Email:</span>
                <span className="text-primary font-semibold">
                  {order.user.email || 'Sin correo'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary font-medium">Teléfono:</span>
                <span className="text-primary font-semibold">
                  {shipping.phone || 'Sin teléfono'}
                </span>
              </div>

              <div className="border-input-outline my-2 border-t pt-2">
                <p className="text-secondary mb-1 font-bold">Modalidad de Entrega:</p>
                <div className="text-primary flex items-center gap-1.5 font-bold">
                  {isPickup ? (
                    <>
                      <PiStorefrontBold className="text-base text-amber-500" />
                      <span>Retiro en Orquideario</span>
                    </>
                  ) : (
                    <>
                      <PiTruckBold className="text-base text-blue-500" />
                      <span>Envío ({shipping.shippingMethod || 'Cobro a destino'})</span>
                    </>
                  )}
                </div>
                {shipping.address && (
                  <p className="text-secondary mt-1 leading-relaxed">
                    Dirección: {shipping.address}, {shipping.city}, {shipping.state}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ficha 2: Resumen Financiero */}
          <div className="bg-canvas border-input-outline flex flex-col gap-4 rounded-xl border p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
              <PiReceiptBold className="text-lg text-emerald-500" />
              <h2 className="text-primary text-base font-bold">Resumen de Pago</h2>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Método de Pago:</span>
                <span className="text-primary font-bold">
                  {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-secondary">Subtotal:</span>
                <span className="text-primary font-semibold">{formatPrice(order.subtotal)}</span>
              </div>

              <div className="border-input-outline my-1 border-t pt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-primary text-sm font-bold">Total USD:</span>
                  <span className="text-primary text-xl font-black">
                    {formatPrice(order.totalUsd)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-secondary text-xs">Total en Bolívares:</span>
                  <span className="text-primary text-sm font-bold">
                    Bs. {order.totalVes.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-100 p-2.5 text-[11px] text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
                <span className="font-semibold">Tasa de cambio:</span> Bs.{' '}
                {order.exchangeRate.toFixed(2)} por USD
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
