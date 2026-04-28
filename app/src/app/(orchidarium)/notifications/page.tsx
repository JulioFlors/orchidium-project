'use client'

import React from 'react'
import useSWR from 'swr'
import {
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
  IoWarningOutline,
  IoFlaskOutline,
  IoConstructOutline,
} from 'react-icons/io5'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

import { Heading, Button, Badge, Card } from '@/components/ui'
import { useToast } from '@/hooks'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Notification {
  id: string
  type: string
  title: string
  description: string | null
  status: 'UNREAD' | 'READ' | 'DISMISSED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  taskId: string | null
  createdAt: string
  task?: {
    purpose: string
    status: string
  }
}

export default function NotificationsPage() {
  const { data, mutate, isLoading } = useSWR<{
    notifications: Notification[]
    unreadCount: number
  }>('/api/notifications', fetcher, {
    refreshInterval: 10000,
  })
  const { success, error } = useToast()
  const router = useRouter()

  const markAsRead = async (ids: string[]) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      if (res.ok) {
        success('Notificaciones actualizadas')
        mutate()
      }
    } catch {
      error('Error al actualizar notificaciones')
    }
  }

  const notifications = data?.notifications || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500'
      case 'HIGH':
        return 'bg-orange-500'
      case 'NORMAL':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AGROCHEMICAL_CONFIRM':
        return <IoFlaskOutline className="text-purple-500" />
      case 'MAINTENANCE_REMINDER':
        return <IoConstructOutline className="text-orange-500" />
      case 'SYSTEM_ALERT':
        return <IoWarningOutline className="text-red-500" />
      default:
        return <IoNotificationsOutline className="text-blue-500" />
    }
  }

  return (
    <div className="mx-auto mt-9 flex w-full max-w-5xl flex-col gap-8 px-4 pb-12">
      <Heading
        action={
          notifications.some((n) => n.status === 'UNREAD') && (
            <Button
              className="flex items-center gap-2"
              size="sm"
              variant="ghost"
              onClick={() =>
                markAsRead(notifications.filter((n) => n.status === 'UNREAD').map((n) => n.id))
              }
            >
              <IoCheckmarkDoneOutline className="text-lg" />
              Marcar todas como leídas
            </Button>
          )
        }
        description="Alertas del sistema, recordatorios de mantenimiento y solicitudes de confirmación."
        title="Notificaciones"
      />

      <div className="flex flex-col gap-4">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 opacity-50">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="mt-4 text-sm">Cargando alertas...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="border-input-outline bg-surface/50 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
            <IoNotificationsOutline className="mb-4 text-5xl opacity-20" />
            <h3 className="text-lg font-semibold">Bandeja limpia</h3>
            <p className="text-secondary text-sm">
              No tienes notificaciones pendientes en este momento.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={clsx(
                  'group relative overflow-hidden transition-all hover:shadow-md',
                  notification.status === 'UNREAD'
                    ? 'border-primary/20 bg-primary/5'
                    : 'opacity-80',
                )}
              >
                <div className="flex items-start gap-4 p-4">
                  <div
                    className={clsx(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl',
                      notification.status === 'UNREAD' ? 'bg-primary/10' : 'bg-surface-elevated',
                    )}
                  >
                    {getTypeIcon(notification.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold tracking-tight">{notification.title}</h4>
                        {notification.status === 'UNREAD' && (
                          <span className="bg-primary h-2 w-2 rounded-full" />
                        )}
                      </div>
                      <span className="text-secondary text-[10px] opacity-60">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>

                    <p className="text-secondary mt-1 text-sm leading-relaxed">
                      {notification.description}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <Badge className="bg-surface" size="sm" variant="outline">
                        <span
                          className={clsx(
                            'mr-1.5 h-1.5 w-1.5 rounded-full',
                            getPriorityColor(notification.priority),
                          )}
                        />
                        {notification.priority}
                      </Badge>

                      {notification.taskId && (
                        <Button
                          className="h-7 px-2 text-[11px]"
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push('/queue')}
                        >
                          Ver Tarea
                        </Button>
                      )}

                      {notification.status === 'UNREAD' && (
                        <Button
                          className="ml-auto h-7 px-2 text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead([notification.id])}
                        >
                          Leída
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
