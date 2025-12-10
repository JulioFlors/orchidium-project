import { redirect } from 'next/navigation'

import { auth } from '@/auth.config'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <html lang="es">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          {children}
        </main>
      </body>
    </html>
  )
}
