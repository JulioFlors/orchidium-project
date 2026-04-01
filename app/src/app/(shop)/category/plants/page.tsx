import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import PlantsCategoryClient from './PlantsCategoryClient'

import { shopRoutes } from '@/config'
import { ShopRoute } from '@/interfaces'

export const metadata: Metadata = {
  title: 'Plantas',
  description:
    'Descubre nuestra amplia variedad de plantas, incluyendo Orquídeas, Cactus y Suculentas.',
}

export default async function PlantsCategoryPage() {
  // Obtenemos la información de la ruta estática
  const route: ShopRoute | undefined = shopRoutes.find((route) => route.slug === 'plants')

  // Si no existe, mostrar 404
  if (!route) {
    notFound()
  }

  return <PlantsCategoryClient route={route} />
}
