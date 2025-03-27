import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orchidium | Iniciar Sesión',
  description:
    'Accede a Orchidium Project, un sistema de gestión inteligente para el cultivo de orquídeas. Monitoreo en tiempo real, control de invernaderos y optimización de recursos para productores profesionales.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh bg-yellow-500">{children}</main>
}
