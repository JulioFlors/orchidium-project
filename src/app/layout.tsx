import type { Metadata } from 'next'

import './globals.css'
import { textFont } from '@/config/fonts'

export const metadata: Metadata = {
  title: 'Orchidium Project',
  description:
    'Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente para el Cultivo de Orquídeas',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${textFont.className} antialiased`}>{children}</body>
    </html>
  )
}
