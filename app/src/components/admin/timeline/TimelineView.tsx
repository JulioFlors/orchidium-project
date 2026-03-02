'use client'

import React, { useState, useEffect } from 'react'

import { CalendarTask, getCalendarTasks } from '@/actions/admin/get-calendar-tasks'

export function TimelineView() {
  const [tasks, setTasks] = useState<CalendarTask[]>([])

  useEffect(() => {
    const fetchTasks = async () => {
      const now = new Date()
      // Mock fetch for today
      const data = await getCalendarTasks(now, now)

      setTasks(data)
    }

    fetchTasks()
  }, [])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">Cronograma de Riego</h2>
        <div className="flex gap-2">
          <button
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
            type="button"
          >
            Hoy
          </button>
          <button
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
            type="button"
          >
            Semana
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Simple List View for now */}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4 transition-colors hover:bg-zinc-800"
          >
            <div>
              <h3 className="font-medium text-zinc-200">{task.title}</h3>
              <p className="text-sm text-zinc-500">
                {task.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                {task.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                {task.zone}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  task.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : task.status === 'completed'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-zinc-500/20 text-zinc-500'
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <p className="py-8 text-center text-zinc-500">No hay tareas programadas.</p>
        )}
      </div>
    </div>
  )
}
