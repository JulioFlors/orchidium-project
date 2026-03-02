'use server'

export interface CalendarTask {
  id: string
  title: string
  start: Date
  end: Date
  type: 'manual' | 'automated'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  zone: string
}

export async function getCalendarTasks(_start: Date, _end: Date): Promise<CalendarTask[]> {
  // TODO: Fetch real data from Prisma (TaskLog)
  // For now, return mock data

  return [
    {
      id: '1',
      title: 'Riego Diario ZONA_A',
      start: new Date(new Date().setHours(10, 0, 0, 0)),
      end: new Date(new Date().setHours(10, 15, 0, 0)),
      type: 'automated',
      status: 'pending',
      zone: 'ZONA_A',
    },
    {
      id: '2',
      title: 'Fertilización Manual',
      start: new Date(new Date().setHours(14, 0, 0, 0)),
      end: new Date(new Date().setHours(14, 30, 0, 0)),
      type: 'manual',
      status: 'pending',
      zone: 'ZONA_B',
    },
  ]
}
