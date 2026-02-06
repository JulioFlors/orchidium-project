import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IoPersonOutline, IoSettingsOutline, IoReaderOutline } from 'react-icons/io5'

import { LogoutButton } from './ui/LogoutButton'

import { auth } from '@/auth.config'
import { Title } from '@/components'

export default async function AccountPage() {
  /*
   * Nota: La verificación de sesión se maneja en el layout.tsx de esta ruta.
   * Sin embargo, mantenemos 'auth()' aquí para obtener los datos del usuario para la UI.
   */
  const session = await auth()

  // Verificación de seguridad adicional (opcional, por si el layout falla o cambia)
  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Title title="Mi Cuenta" />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Perfil Card */}
        <div className="bg-canvas border-input-outline col-span-1 rounded-xl border p-6 shadow-sm md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/5 mb-4 flex h-24 w-24 items-center justify-center rounded-full text-5xl text-zinc-400 dark:text-zinc-600">
              {session.user.image ? (
                /* // eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={session.user.name || 'User'}
                  className="h-full w-full rounded-full object-cover"
                  src={session.user.image}
                />
              ) : (
                <IoPersonOutline />
              )}
            </div>
            <h2 className="text-primary text-xl font-bold">{session.user.name || 'Usuario'}</h2>
            <p className="text-secondary text-sm">{session.user.email}</p>
            <span className="bg-primary/10 text-primary mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              {session.user.role || 'cliente'}
            </span>
          </div>

          <div className="border-input-outline mt-6 border-t pt-6">
            <LogoutButton />
          </div>
        </div>

        {/* Opciones / Dashboard */}
        <div className="col-span-1 space-y-6 md:col-span-2">
          {/* Pedidos */}
          <div className="bg-canvas border-input-outline rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <IoReaderOutline size={24} />
              </div>
              <h3 className="text-primary text-lg font-semibold">Mis Pedidos</h3>
            </div>
            <p className="text-secondary mb-4 text-sm">
              Revisa el estado de tus compras y el historial de pedidos anteriores.
            </p>
            <Link className="text-action text-sm font-medium hover:underline" href="/orders">
              Ver historial de pedidos &rarr;
            </Link>
          </div>

          {/* Configuracion */}
          <div className="bg-canvas border-input-outline rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-zinc-500/10 p-2 text-zinc-600 dark:text-zinc-400">
                <IoSettingsOutline size={24} />
              </div>
              <h3 className="text-primary text-lg font-semibold">Configuración</h3>
            </div>
            <p className="text-secondary mb-4 text-sm">
              Gestiona tus direcciones de envío y preferencias de la cuenta.
            </p>
            <button
              disabled
              className="text-secondary cursor-not-allowed text-sm font-medium opacity-50"
              type="button"
            >
              Próximamente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
