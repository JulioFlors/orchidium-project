'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IoLogoWhatsapp,
  IoCheckmarkDoneCircleOutline,
  IoCopyOutline,
  IoSearchOutline,
  IoLeafOutline,
} from 'react-icons/io5'

import {
  getGroupedStockRequestsByUser,
  deleteStockRequests,
  type GroupedUserStockRequests,
} from '@/actions'
import { Heading, Badge, Button, Card, CardHeader, CardTitle, Backdrop } from '@/components'
import { Logger } from '@/lib'

const POT_SIZE_LABELS: Record<string, string> = {
  NRO_3: 'Maceta Nro. 3',
  NRO_5: 'Maceta Nro. 5',
  NRO_7: 'Maceta Nro. 7',
  NRO_8: 'Maceta Nro. 8',
  NRO_10: 'Maceta Nro. 10',
  NRO_12: 'Maceta Nro. 12',
  NRO_14: 'Maceta Nro. 14',
  NRO_15: 'Maceta Nro. 15',
  CT1: 'Cesta Nro. 1',
  CT2: 'Cesta Nro. 2',
  CT3: 'Cesta Nro. 3',
  CT4: 'Cesta Nro. 4',
}

interface StockRequestsViewProps {
  adminName?: string
}

export function StockRequestsView({ adminName = 'Julio' }: StockRequestsViewProps) {
  const [data, setData] = useState<GroupedUserStockRequests[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'PENDING'>('ALL')
  const [selectedUser, setSelectedUser] = useState<GroupedUserStockRequests | null>(null)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await getGroupedStockRequestsByUser()

    if (res.ok && res.data) {
      setData(res.data)
    } else {
      Logger.error('[SNAT] Error al cargar solicitudes de stock')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    getGroupedStockRequestsByUser()
      .then((res) => {
        if (res.ok && res.data) {
          setData(res.data)
        } else {
          Logger.error('[SNAT] Error al cargar solicitudes de stock')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Marcar como notificadas -> Elimina de la BD solo las solicitudes con stock que se notificaron
  const handleMarkNotified = async (availableIds: string[]) => {
    if (availableIds.length === 0) return

    setUpdating(true)
    const res = await deleteStockRequests(availableIds)

    if (res.ok) {
      setSelectedUser(null)
      await loadData()
    }
    setUpdating(false)
  }

  const formatSize = (size?: string | null) => {
    if (!size) return ''
    const label = POT_SIZE_LABELS[size] || size.replace(/^NRO_/i, 'Maceta Nro. ')

    return ` (${label})`
  }

  // Generador de texto de WhatsApp: redacción humana, cercana y adaptada (singular/plural)
  const generateWhatsappText = (user: GroupedUserStockRequests) => {
    const availableRequests = user.requests.filter((req) => req.isAvailable)
    const firstName = user.userName.trim().split(' ')[0] || user.userName
    const senderFirstName = adminName.trim().split(' ')[0] || 'Julio'

    if (availableRequests.length === 0) {
      return `Hola ${firstName}.\nMi nombre es ${senderFirstName} y soy cultivador en PristinoPlant.\n\nEstamos trabajando en la reposición de las plantas de tu interés.\nTe avisaremos cuando estén disponibles.`
    }

    const isPlural = availableRequests.length > 1
    const intro = isPlural
      ? `Hola ${firstName}.\nMi nombre es ${senderFirstName} y soy cultivador en PristinoPlant.\n\nTe escribo por aquí para avisarte que las plantas por las que nos preguntaste ya estan disponibles en nuestra tienda:\n\n`
      : `Hola ${firstName}.\nMi nombre es ${senderFirstName} y soy cultivador en PristinoPlant.\n\nTe escribo por aquí para avisarte que la planta por la que nos preguntaste ya esta disponible en nuestra tienda:\n\n`

    const itemsText = availableRequests
      .map((req) => {
        const sizeText = formatSize(req.size)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pristinoplant.com'
        const productUrl = `${baseUrl}/plant/${req.species.slug}`

        return `• ${req.species.name}${sizeText}\n  ${productUrl}`
      })
      .join('\n\n')

    const closing = isPlural
      ? `\n\nAvísame con toda confianza si deseas adquirirlas o tienes alguna duda.`
      : `\n\nAvísame con toda confianza si deseas adquirirla o tienes alguna duda.`

    return `${intro}${itemsText}${closing}`
  }

  const getWhatsappUrl = (user: GroupedUserStockRequests) => {
    const cleanPhone = user.phoneNumber.replace(/[^0-9]/g, '')
    const text = generateWhatsappText(user)

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
  }

  const handleCopyMessage = (user: GroupedUserStockRequests) => {
    const text = generateWhatsappText(user)

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Filtrado de usuarios
  const filteredUsers = data.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm) ||
      user.requests.some((r) => r.species.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    if (filterStatus === 'AVAILABLE') {
      return user.requests.some((r) => r.isAvailable)
    }
    if (filterStatus === 'PENDING') {
      return user.requests.some((r) => !r.isAvailable)
    }

    return true
  })

  const totalRequestsCount = data.reduce((acc, u) => acc + u.requests.length, 0)
  const availableCount = data.reduce(
    (acc, u) => acc + u.requests.filter((r) => r.isAvailable).length,
    0,
  )

  return (
    <div className="space-y-6">
      <Backdrop visible={loading || updating}>
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="text-primary h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <span className="animate-pulse text-lg font-medium tracking-wide text-white">
            Procesando solicitudes...
          </span>
        </div>
      </Backdrop>

      {/* Header Estandarizado con Heading */}
      <Heading
        description="Registro de clientes interesados en plantas agotadas."
        title="Solicitudes de Stock"
      />

      {/* Resumen Rápidos Badges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <span className="text-secondary text-xs font-semibold uppercase">Total Solicitudes</span>
          <p className="text-primary text-2xl font-bold">{totalRequestsCount}</p>
        </Card>

        <Card className="p-4">
          <span className="text-secondary text-xs font-semibold uppercase">
            Clientes Registrados
          </span>
          <p className="text-primary text-2xl font-bold">{data.length}</p>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
          <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
            Listas para Notificar
          </span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {availableCount}
          </p>
        </Card>
      </div>

      {/* Filtros y Buscador */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <IoSearchOutline
              className="text-secondary absolute top-1/2 left-3 -translate-y-1/2"
              size={18}
            />
            <input
              className="focus-input bg-canvas border-input-outline w-full rounded-lg border-none py-2 pr-4 pl-10 text-sm outline-none"
              placeholder="Buscar por cliente, WhatsApp o planta..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
              type="button"
              onClick={() => setFilterStatus('ALL')}
            >
              Todos ({data.length})
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filterStatus === 'AVAILABLE'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
              type="button"
              onClick={() => setFilterStatus('AVAILABLE')}
            >
              Stock Repuesto ({availableCount})
            </button>
          </div>
        </div>
      </Card>

      {/* Lista de Usuarios */}
      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const userAvailableRequests = user.requests.filter((r) => r.isAvailable)
          const userAvailableIds = userAvailableRequests.map((r) => r.id)

          return (
            <Card key={user.phoneNumber} className="overflow-hidden p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-primary text-lg font-bold">{user.userName}</h3>
                    <Badge variant="purple">{user.phoneNumber}</Badge>
                    {userAvailableRequests.length > 0 && (
                      <Badge variant="success">
                        ¡{userAvailableRequests.length} planta(s) listas!
                      </Badge>
                    )}
                  </div>
                  <p className="text-secondary mt-1 text-xs">
                    {user.requests.length} planta(s) registrada(s) formalmente de interés
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    className="flex items-center gap-2"
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedUser(user)}
                  >
                    <IoLogoWhatsapp className="text-emerald-500" size={18} />
                    Ver Mensaje Consolidado
                  </Button>

                  {userAvailableRequests.length > 0 && (
                    <a
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95"
                      href={getWhatsappUrl(user)}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <IoLogoWhatsapp size={18} />
                      Enviar WhatsApp
                    </a>
                  )}

                  {userAvailableIds.length > 0 && (
                    <Button
                      className="flex items-center gap-1.5"
                      type="button"
                      variant="ghost"
                      onClick={() => handleMarkNotified(userAvailableIds)}
                    >
                      <IoCheckmarkDoneCircleOutline size={18} />
                      Marcar Notificadas ({userAvailableIds.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* Lista de Plantas de este usuario */}
              <div className="mt-5 border-t border-zinc-200/50 pt-4 dark:border-zinc-800/50">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {user.requests.map((req) => (
                    <div
                      key={req.id}
                      className={`border-input-outline flex items-center justify-between rounded-lg border p-3 ${
                        req.isAvailable ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-surface/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {req.species.image ? (
                          <img
                            alt={req.species.name}
                            className="h-10 w-10 rounded-md object-cover"
                            src={req.species.image}
                          />
                        ) : (
                          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-md text-zinc-400">
                            <IoLeafOutline size={20} />
                          </div>
                        )}

                        <div>
                          <p className="text-primary text-sm font-semibold">{req.species.name}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            {req.size && (
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                {req.size}
                              </span>
                            )}
                            <span>•</span>
                            <span>
                              {new Date(req.createdAt).toLocaleDateString('es-VE', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {req.isAvailable ? (
                          <Badge variant="success">Stock: {req.variant?.quantity || 1}</Badge>
                        ) : (
                          <Badge variant="default">Agotado</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}

        {filteredUsers.length === 0 && !loading && (
          <Card className="p-12 text-center text-zinc-500">
            <p className="text-lg font-medium">No hay solicitudes de stock pendientes.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Las solicitudes registradas por los clientes desde la tienda aparecerán aquí.
            </p>
          </Card>
        )}
      </div>

      {/* Modal / Previsualizador de Mensaje Consolidado */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-6 shadow-2xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">
                Mensaje Consolidado para {selectedUser.userName}
              </CardTitle>
              <p className="text-secondary text-xs">{selectedUser.phoneNumber}</p>
            </CardHeader>

            <div className="my-4">
              <label
                className="text-secondary mb-2 block text-xs font-bold uppercase"
                htmlFor="whatsapp-text"
              >
                Texto de WhatsApp Generado (Solo Plantas Disponibles)
              </label>
              <textarea
                readOnly
                className="bg-canvas border-input-outline text-primary h-56 w-full rounded-lg border p-3 font-mono text-xs leading-relaxed outline-none"
                id="whatsapp-text"
                value={generateWhatsappText(selectedUser)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/50 pt-4 dark:border-zinc-800/50">
              <div className="flex items-center gap-2">
                <Button
                  className="flex items-center gap-2"
                  type="button"
                  variant="ghost"
                  onClick={() => handleCopyMessage(selectedUser)}
                >
                  <IoCopyOutline size={18} />
                  {copied ? '¡Copiado!' : 'Copiar Texto'}
                </Button>

                {selectedUser.requests.some((r) => r.isAvailable) && (
                  <Button
                    className="flex items-center gap-1.5"
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      handleMarkNotified(
                        selectedUser.requests.filter((r) => r.isAvailable).map((r) => r.id),
                      )
                    }
                  >
                    <IoCheckmarkDoneCircleOutline size={18} />
                    Notificado (Limpiar)
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => setSelectedUser(null)}>
                  Cerrar
                </Button>
                {selectedUser.requests.some((r) => r.isAvailable) && (
                  <a
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95"
                    href={getWhatsappUrl(selectedUser)}
                    rel="noopener noreferrer"
                    target="_blank"
                    onClick={() =>
                      handleMarkNotified(
                        selectedUser.requests.filter((r) => r.isAvailable).map((r) => r.id),
                      )
                    }
                  >
                    <IoLogoWhatsapp size={18} />
                    Enviar WhatsApp
                  </a>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
