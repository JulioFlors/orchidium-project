import type { Metadata } from 'next'

import { CartView } from './ui/CartView'

// Metadata SEO
export const metadata: Metadata = {
  title: 'PristinoPlant | Su Carrito',
  description:
    'Gestiona tus plantas seleccionadas y prepárate para finalizar tu compra en PristinoPlant.',
  openGraph: {
    title: 'PristinoPlant | Su Carrito',
    description: 'Revisa tus plantas seleccionadas. Un paso más cerca de tu colección ideal.',
    url: 'https://pristinoplant.vercel.app/cart',
    siteName: 'PristinoPlant',
    images: [
      {
        url: '/imgs/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Carrito de Compra de Plantas en PristinoPlant',
      },
    ],
    locale: 'es_VE',
    type: 'website',
  },
}

export default function CartPage() {
  return <CartView />
}
