import type { Metadata } from 'next'

import './globals.css'
import { textFont } from '@/config/fonts'

export const metadata: Metadata = {
  title: 'PristinoPlant',
  description:
    'Da vida a tus espacios con PristinoPlant. Explora nuestra colección de orquídeas, rosas del desierto, kokedama, cactus y suculentas. Ofrecemos abonos especializados, macetas, agroquímicos y la asesoría experta que tu coleccion necesita.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${textFont.className} antialiased`}>{children}</body>
    </html>
  )
}
