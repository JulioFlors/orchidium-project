import type { Metadata } from 'next'

import './globals.css'
import { Providers, ToastContainer } from '@/components'
import { textFont } from '@/config/fonts'

export const metadata: Metadata = {
  // Esto define la base para todas las imágenes OG y Twitter cards en la app.
  // Resuelve el warning y asegura que al compartir enlaces en redes sociales las imágenes se vean.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://pristinoplant.com'),

  title: {
    // %s se sustituye por el título que definas en cada página
    template: 'PristinoPlant | %s',
    default: 'PristinoPlant', // Título por defecto si una página no define uno propio
  },
  description:
    'Da vida a tus espacios con PristinoPlant. Explora nuestra colección de orquídeas, rosas del desierto, kokedama, cactus y suculentas. Ofrecemos abonos especializados, macetas, agroquímicos y la asesoría experta que tu colección necesita.',
  openGraph: {
    title: {
      template: 'PristinoPlant | %s',
      default: 'PristinoPlant',
    },
    description:
      'Da vida a tus espacios con PristinoPlant. Explora nuestra colección de orquídeas, rosas del desierto, kokedama, cactus y suculentas. Ofrecemos abonos especializados, macetas, agroquímicos y la asesoría experta que tu colección necesita.',
    siteName: 'PristinoPlant',
    locale: 'es_VE',
    type: 'website',
    images: [
      {
        url: '/imgs/orchidium.png',
        width: 1200,
        height: 630,
        alt: 'PristinoPlant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      template: 'PristinoPlant | %s',
      default: 'PristinoPlant',
    },
    description:
      'Da vida a tus espacios con PristinoPlant. Explora nuestra colección de orquídeas, rosas del desierto, kokedama, cactus y suculentas.',
    images: ['/imgs/orchidium.png'],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="es">
      <body className={`${textFont.className} antialiased`}>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
