import type { Metadata } from 'next'

import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { textFont } from '@/config/fonts'

export const metadata: Metadata = {
  // Esto define la base para todas las imágenes OG y Twitter cards en la app.
  // Resuelve el warning y asegura que al compartir enlaces en redes sociales las imágenes se vean.
  metadataBase: new URL('https://pristinoplant.vercel.app'),

  title: {
    // %s se sustituye por el título que definas en cada página
    template: 'PristinoPlant | %s',
    default: 'PristinoPlant', // Título por defecto si una página no define uno propio
  },
  description:
    'Da vida a tus espacios con PristinoPlant. Explora nuestra colección de orquídeas, rosas del desierto, kokedama, cactus y suculentas. Ofrecemos abonos especializados, macetas, agroquímicos y la asesoría experta que tu coleccion necesita',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="es">
      <body className={`${textFont.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
