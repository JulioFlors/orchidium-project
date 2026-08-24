'use client'

import type { SaleType } from '@package/database/enums'

import Link from 'next/link'
import { useState } from 'react'
import {
  PiArrowSquareOutBold,
  PiCalendarBlankBold,
  PiCurrencyDollarBold,
  PiGlobeBold,
  PiMagnifyingGlassBold,
  PiReceiptBold,
  PiStorefrontBold,
  PiTrendUpBold,
  PiUserBold,
} from 'react-icons/pi'

import { Heading } from '@/components'
import { useFormatPrice } from '@/lib'

export interface SaleRecordItem {
  id: string
  type: SaleType
  orderId: string | null
  totalUsd: number
  totalVes: number
  exchangeRate: number
  notes: string | null
  createdById: string | null
  createdAt: Date | string
  order?: {
    id: string
    orderNumber: string
    user: {
      id: string
      name: string | null
      email: string | null
    }
    items: Array<{
      id: string
      speciesName: string
      quantity: number
    }>
  } | null
  createdBy?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

interface Props {
  initialSales: SaleRecordItem[]
}

export function SalesView({ initialSales }: Props) {
  const sales = initialSales
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const { format: formatPrice } = useFormatPrice()

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      (sale.order && sale.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.order?.user.name &&
        sale.order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.notes && sale.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.createdBy?.name && sale.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = typeFilter === 'ALL' || sale.type === typeFilter

    return matchesSearch && matchesType
  })

  // Totales financieros
  const totalUsd = sales.reduce((sum, s) => sum + s.totalUsd, 0)
  const totalVes = sales.reduce((sum, s) => sum + s.totalVes, 0)
  const onlineCount = sales.filter((s) => s.type === 'ONLINE_ORDER').length
  const directCount = sales.filter((s) => s.type === 'DIRECT_MANUAL').length

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <Heading
        description="Auditoría financiera consolidada de órdenes web y ventas directas en el orquideario"
        title="Historial de Ventas"
      />

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-canvas border-input-outline flex items-center justify-between rounded-xl border p-4 shadow-sm">
          <div>
            <p className="text-secondary text-xs font-semibold">Total Facturado (USD)</p>
            <p className="text-primary mt-1 text-2xl font-black">{formatPrice(totalUsd)}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-500">
            <PiCurrencyDollarBold />
          </span>
        </div>

        <div className="bg-canvas border-input-outline flex items-center justify-between rounded-xl border p-4 shadow-sm">
          <div>
            <p className="text-secondary text-xs font-semibold">Total Facturado (VES)</p>
            <p className="text-primary mt-1 text-2xl font-black">Bs. {totalVes.toFixed(2)}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-500">
            <PiTrendUpBold />
          </span>
        </div>

        <div className="bg-canvas border-input-outline flex items-center justify-between rounded-xl border p-4 shadow-sm">
          <div>
            <p className="text-secondary text-xs font-semibold">Ventas en Línea (Web)</p>
            <p className="text-primary mt-1 text-2xl font-black">{onlineCount}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-xl text-violet-500">
            <PiGlobeBold />
          </span>
        </div>

        <div className="bg-canvas border-input-outline flex items-center justify-between rounded-xl border p-4 shadow-sm">
          <div>
            <p className="text-secondary text-xs font-semibold">Ventas Directas / Sede</p>
            <p className="text-primary mt-1 text-2xl font-black">{directCount}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-xl text-amber-500">
            <PiStorefrontBold />
          </span>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-canvas border-input-outline flex flex-col gap-4 rounded-xl border p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <PiMagnifyingGlassBold className="text-secondary absolute top-1/2 left-3.5 -translate-y-1/2 text-base" />
          <input
            className="border-input-outline bg-surface text-primary w-full rounded-xl border py-2.5 pr-4 pl-10 text-xs outline-none focus:border-emerald-500"
            placeholder="Buscar por orden, cliente, nota o usuario..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'Todas las Ventas' },
            { id: 'ONLINE_ORDER', label: 'Ventas Web' },
            { id: 'DIRECT_MANUAL', label: 'Ventas Directas' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                typeFilter === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-surface text-secondary hover:text-primary border-input-outline border'
              }`}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Registros de Ventas */}
      {filteredSales.length === 0 ? (
        <div className="bg-canvas border-input-outline flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <PiReceiptBold className="text-secondary mb-3 text-4xl opacity-40" />
          <p className="text-primary text-base font-bold">No hay registros de ventas</p>
          <p className="text-secondary mt-1 text-xs">
            Las ventas confirmadas se registrarán automáticamente en este historial.
          </p>
        </div>
      ) : (
        <div className="bg-canvas border-input-outline overflow-hidden rounded-xl border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/60 border-input-outline border-b text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 font-semibold">Referencia / Orden</th>
                  <th className="px-5 py-3 font-semibold">Fecha y Hora</th>
                  <th className="px-5 py-3 font-semibold">Cliente / Beneficiario</th>
                  <th className="px-5 py-3 text-right font-semibold">Monto USD</th>
                  <th className="px-5 py-3 text-right font-semibold">Monto VES</th>
                  <th className="px-5 py-3 text-right font-semibold">Tasa</th>
                  <th className="px-5 py-3 font-semibold">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredSales.map((sale) => {
                  const isOnline = sale.type === 'ONLINE_ORDER'

                  return (
                    <tr key={sale.id} className="hover:bg-surface/50 transition-colors">
                      {/* Tipo */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            isOnline
                              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isOnline ? (
                            <>
                              <PiGlobeBold className="text-xs" /> Web
                            </>
                          ) : (
                            <>
                              <PiStorefrontBold className="text-xs" /> Directa
                            </>
                          )}
                        </span>
                      </td>

                      {/* Referencia */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold">
                        {sale.order ? (
                          <Link
                            className="text-primary hover:text-emerald-500 inline-flex items-center gap-1 underline transition-colors"
                            href={`/orders/${sale.order.id}`}
                          >
                            #{sale.order.orderNumber}
                            <PiArrowSquareOutBold className="text-xs" />
                          </Link>
                        ) : (
                          <span className="text-secondary">#{sale.id.slice(-8).toUpperCase()}</span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="text-secondary px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <PiCalendarBlankBold className="text-xs" />
                          {new Date(sale.createdAt).toLocaleDateString('es-VE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-primary font-medium">
                            {sale.order?.user.name || 'Venta directa en mostrador'}
                          </span>
                          {sale.order?.user.email && (
                            <span className="text-secondary text-[11px]">
                              {sale.order.user.email}
                            </span>
                          )}
                          {sale.notes && (
                            <span className="text-secondary text-[10px] italic">{sale.notes}</span>
                          )}
                        </div>
                      </td>

                      {/* Monto USD */}
                      <td className="text-primary px-5 py-3.5 text-right font-black whitespace-nowrap">
                        {formatPrice(sale.totalUsd)}
                      </td>

                      {/* Monto VES */}
                      <td className="text-secondary px-5 py-3.5 text-right font-bold whitespace-nowrap">
                        Bs. {sale.totalVes.toFixed(2)}
                      </td>

                      {/* Tasa */}
                      <td className="text-secondary px-5 py-3.5 text-right whitespace-nowrap">
                        Bs. {sale.exchangeRate.toFixed(2)}
                      </td>

                      {/* Registrado por */}
                      <td className="text-secondary px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <PiUserBold className="text-xs text-emerald-500" />
                          <span>{sale.createdBy?.name || 'Sistema'}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
