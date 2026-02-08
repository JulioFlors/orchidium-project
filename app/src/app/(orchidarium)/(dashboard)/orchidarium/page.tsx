import { auth } from '@/auth'

export default async function DashboardPage() {
  const session = await auth()

  // El layout verifica la sesión y el rol de 'admin'.
  if (!session?.user) {
    // Esto teóricamente no debería ocurrir si el layout funciona correctamente.
    return <p>Error: No se pudo cargar la sesión del usuario.</p>
  }

  return (
    <div>
      <h1>Dashboard de Administrador</h1>
      <p>Bienvenido, {session.user.name}.</p>
      <p>Este contenido solo es visible para administradores.</p>
    </div>
  )
}
