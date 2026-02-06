import { redirect } from 'next/navigation'

import { auth } from '@/auth.config'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/account')
  }

  return <>{children}</>
}
