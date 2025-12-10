import type { Metadata } from 'next'

import { CheckoutView } from './ui/CheckoutView'

// Metadata SEO
export const metadata: Metadata = {
  title: 'PristinoPlant | Finalizar Compra',
  description:
    'Procede al pago y finaliza la compra de tus plantas seleccionadas en PristinoPlant.',
  openGraph: {
    title: 'PristinoPlant | Finalizar Compra',
    description:
      'Estás a un paso de tener tus plantas. Completa tu compra de forma segura en PristinoPlant.',
    url: 'https://pristinoplant.vercel.app/checkout',
    siteName: 'PristinoPlant',
    images: [
      {
        url: '/imgs/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Finalizar Compra de Plantas en PristinoPlant',
      },
    ],
    locale: 'es_VE',
    type: 'website',
  },
}

export default function CheckoutPage() {
  return <CheckoutView />
}
