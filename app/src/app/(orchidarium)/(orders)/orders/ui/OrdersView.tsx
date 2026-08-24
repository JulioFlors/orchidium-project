'use client'

import type { OrderStatus, PaymentMethod, PotSize } from '@package/database/enums'

import Link from 'next/link'
import { useState } from 'react'
import {
  PiArrowRightBold,
  PiCalendarBlankBold,
  PiCheckCircleBold,
  PiClockBold,
  PiMagnifyingGlassBold,
  PiPackageBold,
  PiReceiptBold,
  PiStorefrontBold,
  PiTruckBold,
  PiUserBold,
  PiWhatsappLogoFill,
} from 'react-icons/pi'

import { Heading } from '@/components'
import { PotSizeLabels } from '@/config/mappings'
import { useFormatPrice } from '@/lib'

export interface AdminOrder {
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
  items: Array<{
    id: string
    speciesName: string
    size: PotSize
    unitPrice: number
    quantity: number
    plantId: string | null
  }>
  saleRecord?: unknown
}

interface Props {
  initialOrders: AdminOrder[]
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
  PAGO_MOVIL: 'Pago Móvil',
  TRANSFERENCIA_VES: 'Transferencia VES',
  EFECTIVO_DIVISAS: 'Efectivo Divisas',
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

export function OrdersView({ initialOrders }: Props) {
  const orders = initialOrders
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const { format: formatPrice } = useFormatPrice()

  const filteredOrders = orders.filter((order) => {
    const shipping = (order.shippingAddress as ShippingInfo) || {}
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Boolean(
        order.user.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ) ||
      Boolean(
        order.user.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ) ||
      Boolean(shipping.name && shipping.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      Boolean(shipping.phone && shipping.phone.includes(searchTerm))

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Métricas rápidas
  const pendingCount = orders.filter(
    (o) => o.status === 'PENDING_PAYMENT' || o.status === 'PAYMENT_VERIFYING',
  ).length
  const paidCount = orders.filter((o) => o.status === 'PAID').length
  const totalVolumeUsd = orders
    .filter((o) => o.status === 'PAID' || o.status === 'DISPATCHED')
    .reduce((sum, o) => sum + o.totalUsd, 0)

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <Heading
        description="Supervisión, verificación de pagos y asignación física de ejemplares del stock"
        title="Gestión de Pedidos"
      />

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-canvas border-input-outline flex items-center justify-between rounded-xl border p-4 shadow-sm">
          <div>
            <p className="text-secondary text-xs font-semibold">Por Verificar / Pendientes</p>
            <p className="text-primary mt-1 text-2xl font-black">{pendingCount}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-xl text-amber-500">
            ⏳
          </span>
        </div>

        <div className="bg-canvas border-input-outline flex items-center justify-between rounded-xl border p-4 shadow-sm">
          <div>
            <p className="text-secondary text-xs font-semibold">Listos para Despacho</p>
            <p className="text-primary mt-1 text-2xl font-black">{paidCount}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-500">
            📦
          </span>
        </div>

        <div className="bg-canvas border-input-outline flex items-center justify-between rounded-xl border p-4 shadow-sm">
          <div>
            <p className="text-secondary text-xs font-semibold">Volumen Total Pagado</p>
            <p className="text-primary mt-1 text-2xl font-black">{formatPrice(totalVolumeUsd)}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-xl text-violet-500">
            💰
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-canvas border-input-outline flex flex-col gap-4 rounded-xl border p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Buscador */}
        <div className="relative flex-1">
          <PiMagnifyingGlassBold className="text-secondary absolute top-1/2 left-3.5 -translate-y-1/2 text-base" />
          <input
            className="border-input-outline bg-surface text-primary w-full rounded-xl border py-2.5 pr-4 pl-10 text-xs outline-none focus:border-emerald-500"
            placeholder="Buscar por # Orden, cliente, correo o teléfono..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros por Estado */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'PENDING_PAYMENT', label: 'Pendientes' },
            { id: 'PAYMENT_VERIFYING', label: 'Verificando' },
            { id: 'PAID', label: 'Pagadas' },
            { id: 'DISPATCHED', label: 'Despachadas' },
            { id: 'CANCELLED', label: 'Canceladas' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-surface text-secondary hover:text-primary border-input-outline border'
              }`}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Órdenes */}
      {filteredOrders.length === 0 ? (
        <div className="bg-canvas border-input-outline flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <PiReceiptBold className="text-secondary mb-3 text-4xl opacity-40" />
          <p className="text-primary text-base font-bold">No se encontraron pedidos</p>
          <p className="text-secondary mt-1 text-xs">
            Ajusta los filtros de búsqueda o espera nuevas órdenes de compra.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order) => {
            const shipping = (order.shippingAddress as ShippingInfo) || {}
            const isPickup = shipping.deliveryType === 'PICKUP'
            const statusConfig = STATUS_LABELS[order.status] || {
              label: order.status,
              badge: 'bg-zinc-500/10 text-zinc-600',
              icon: '📋',
            }

            // Total de ejemplares asignados físicamente
            const assignedPlantsCount = order.items.filter((item) => item.plantId).length
            const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
            const allPlantsAssigned = assignedPlantsCount === totalItemsCount

            // Limpieza de teléfono para WhatsApp
            const cleanPhone = shipping.phone ? shipping.phone.replace(/[^0-9]/g, '') : ''
            const formattedPhone = cleanPhone.startsWith('0')
              ? `58${cleanPhone.slice(1)}`
              : cleanPhone.startsWith('58')
                ? cleanPhone
                : `58${cleanPhone}`

            const whatsappMessage = encodeURIComponent(
              `¡Hola ${shipping.name || order.user.name || 'Cliente'}! Te escribimos de Pristinoplant sobre tu orden #${order.orderNumber}.`,
            )

            return (
              <div
                key={order.id}
                className="bg-canvas border-input-outline flex flex-col gap-4 rounded-xl border p-5 shadow-sm transition-all hover:border-emerald-500/40"
              >
                {/* Fila Superior: Encabezado de la Orden */}
                <div className="flex flex-col justify-between gap-3 border-b border-zinc-100 pb-3 sm:flex-row sm:items-center dark:border-zinc-800/50">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-primary text-base font-black tracking-tight">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.badge}`}
                    >
                      <span>{statusConfig.icon}</span>
                      {statusConfig.label}
                    </span>

                    <span className="text-secondary flex items-center gap-1 text-xs">
                      <PiCalendarBlankBold className="text-sm" />
                      {new Date(order.createdAt).toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Estado de asignación física de ejemplares */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                        allPlantsAssigned
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {allPlantsAssigned ? (
                        <PiCheckCircleBold className="text-sm" />
                      ) : (
                        <PiClockBold className="text-sm" />
                      )}
                      {assignedPlantsCount} de {totalItemsCount} ejemplares asignados
                    </span>
                  </div>
                </div>

                {/* Contenido Central: Cliente, Método y Productos */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Columna 1: Datos del Cliente y Entrega */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    <p className="text-primary flex items-center gap-1.5 font-bold">
                      <PiUserBold className="text-sm text-emerald-500" />
                      {shipping.name || order.user.name || 'Sin nombre registrado'}
                    </p>
                    <p className="text-secondary">
                      C.I./RIF: {shipping.idNumber || 'No especificada'}
                    </p>
                    <p className="text-secondary">
                      Email: {order.user.email || 'Sin correo asociado'}
                    </p>

                    {shipping.phone && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-secondary font-medium">📱 {shipping.phone}</span>
                        <a
                          aria-label="Contactar por WhatsApp"
                          className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white dark:text-emerald-400"
                          href={`https://wa.me/${formattedPhone}?text=${whatsappMessage}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <PiWhatsappLogoFill className="text-xs" /> WhatsApp
                        </a>
                      </div>
                    )}

                    <div className="text-secondary mt-2 flex items-center gap-1.5 font-medium">
                      {isPickup ? (
                        <>
                          <PiStorefrontBold className="text-sm text-amber-500" />
                          <span>Retiro en Orquideario</span>
                        </>
                      ) : (
                        <>
                          <PiTruckBold className="text-sm text-blue-500" />
                          <span>
                            Envío Nacional ({shipping.shippingMethod || 'Cobro a destino'})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Columna 2: Ítems del Pedido */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-secondary text-xs font-bold tracking-wider uppercase">
                      Ejemplares Solicitados ({order.items.length})
                    </p>
                    <div className="flex flex-col gap-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-surface/50 border-input-outline flex items-center justify-between rounded-lg border p-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {item.quantity}x
                            </span>
                            <span className="text-primary font-medium">{item.speciesName}</span>
                            <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {PotSizeLabels[item.size] || item.size}
                            </span>
                          </div>

                          <div className="text-right">
                            {item.plantId ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                🌿 Asignada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                ⚠️ Sin asignar
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Columna 3: Información Financiera y Acción */}
                  <div className="flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-1 text-xs">
                      <p className="text-secondary font-bold tracking-wider uppercase">
                        Pago & Monto
                      </p>
                      <p className="text-primary font-semibold">
                        Método: {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-primary text-lg font-black">
                          {formatPrice(order.totalUsd)}
                        </span>
                        <span className="text-secondary text-xs">
                          (Bs. {order.totalVes.toFixed(2)})
                        </span>
                      </div>
                      <p className="text-secondary text-[11px]">
                        Tasa: Bs. {order.exchangeRate.toFixed(2)}
                      </p>
                    </div>

                    {/* Botón para ir al Detalle / Asignación */}
                    <Link
                      className="border-input-outline bg-surface text-primary hover:bg-emerald-500 hover:text-white flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all"
                      href={`/orders/${order.id}`}
                    >
                      <PiPackageBold className="text-base" />
                      Gestionar Pedido y Asignar Stock
                      <PiArrowRightBold className="text-xs" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
