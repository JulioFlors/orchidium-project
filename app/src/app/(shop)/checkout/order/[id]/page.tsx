import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PiCheckCircleFill, PiWhatsappLogoFill } from 'react-icons/pi'

import { buttonVariants } from '@/components'
import { getOrderById } from '@/actions'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { id } = await params
  const res = await getOrderById(id)

  if (!res.ok || !res.order) {
    notFound()
  }

  const { order } = res

  const whatsappMessage = encodeURIComponent(
    `¡Hola Pristinoplant! He realizado mi pedido #${order.orderNumber} por un total de $${order.totalUsd.toFixed(2)} (Bs. ${order.totalVes.toFixed(2)}). Adjunto mi comprobante de pago por el método ${order.paymentMethod}.`,
  )

  const whatsappLink = `https://wa.me/584148724205?text=${whatsappMessage}`

  return (
    <div className="mx-auto w-full max-w-225 px-4 py-12 sm:px-6">
      <div className="bg-canvas border-input-outline flex flex-col gap-8 rounded-2xl border p-6 sm:p-8">
        {/* Banner de Confirmación */}
        <div className="flex flex-col items-center justify-center gap-3 border-b border-zinc-100 pb-6 text-center dark:border-zinc-800/50">
          <PiCheckCircleFill className="h-16 w-16 text-emerald-500" />
          <h1 className="text-primary text-2xl font-black tracking-tight sm:text-3xl">
            ¡Pedido Registrado con Éxito!
          </h1>
          <p className="text-secondary font-mono text-sm font-bold">Orden #{order.orderNumber}</p>
          <p className="text-secondary max-w-[62ch] text-xs leading-relaxed">
            ¡Buenas noticias! Tus ejemplares han sido apartados especialmente para ti. Congelaremos
            el stock de tu pedido durante las próximas <strong>12 horas</strong>. Para confirmar la
            compra, solo debes realizar tu pago y enviarnos el comprobante vía WhatsApp.
            Transcurrido este lapso sin recibir el reporte de pago, la orden se cancelará
            automáticamente para liberar las plantas a otros coleccionistas.
          </p>
        </div>

        {/* Instrucciones de Pago según Método */}
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-xs">
          <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Instrucciones para Pago por{' '}
            {order.paymentMethod === 'PAGO_MOVIL'
              ? 'Pago Móvil'
              : order.paymentMethod === 'TRANSFERENCIA_VES'
                ? 'Transferencia Bancaria'
                : 'Efectivo'}
          </h2>
          {order.paymentMethod === 'PAGO_MOVIL' && (
            <div className="text-primary flex flex-col gap-1.5 font-mono">
              <span>• Banco: Mercantil</span>
              <span>• Cédula / RIF: 24847678</span>
              <span>• Teléfono: 0414-8724205</span>
              <span className="pt-1 font-bold text-emerald-600 dark:text-emerald-400">
                • Monto exacto a pagar: Bs. {order.totalVes.toFixed(2)} (Tasa BCV: Bs.{' '}
                {order.exchangeRate.toFixed(2)})
              </span>
            </div>
          )}
          {order.paymentMethod === 'TRANSFERENCIA_VES' && (
            <div className="text-primary flex flex-col gap-1.5 font-mono">
              <span>• Banco: Mercantil</span>
              <span>• Cuenta Corriente: 0105 0188 1311 8817 5750</span>
              <span className="pt-1 font-bold text-emerald-600 dark:text-emerald-400">
                • Monto exacto a pagar: Bs. {order.totalVes.toFixed(2)} (Tasa BCV: Bs.{' '}
                {order.exchangeRate.toFixed(2)})
              </span>
            </div>
          )}
          {order.paymentMethod === 'EFECTIVO_DIVISAS' && (
            <div className="text-primary flex flex-col gap-1 font-mono">
              <span>• Monto a entregar en efectivo: ${order.totalUsd.toFixed(2)} USD</span>
              <span className="text-secondary font-sans text-[11px]">
                Por favor entrega el monto en billetes en buen estado al momento de retirar en el
                Orquideario o recibir el delivery.
              </span>
            </div>
          )}
        </div>

        {/* Botón WhatsApp */}
        <div className="flex flex-col items-center gap-3">
          <a
            className={buttonVariants({
              variant: 'primary',
              className:
                'w-full justify-center gap-2 bg-emerald-600 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-700 sm:w-auto',
            })}
            href={whatsappLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            <PiWhatsappLogoFill className="h-5 w-5" />
            Enviar Comprobante por WhatsApp
          </a>
          <span className="text-secondary text-[11px]">
            Se abrirá WhatsApp con los datos precargados de tu orden.
          </span>
        </div>

        {/* Ítems del Pedido */}
        <div className="flex flex-col gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800/50">
          <h2 className="text-primary text-base font-bold">Detalles del Pedido</h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-zinc-100 pb-3 text-xs dark:border-zinc-800/30"
              >
                <span className="text-primary font-medium">
                  {item.quantity}x {item.speciesName} ({item.size})
                </span>
                <span className="text-primary font-semibold">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="text-primary flex items-center justify-between pt-2 text-sm font-bold">
            <span>Total del Pedido</span>
            <span>
              ${order.totalUsd.toFixed(2)} (Bs. {order.totalVes.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Link className={buttonVariants({ variant: 'secondary' })} href="/category/plants">
            Volver a la Tienda
          </Link>
        </div>
      </div>
    </div>
  )
}
