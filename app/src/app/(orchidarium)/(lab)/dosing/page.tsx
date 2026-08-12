import type { Metadata } from 'next'

import { DosingView } from './ui/DosingView'

import { getDosingTasks, getAgrochemicals } from '@/actions/lab'

export const metadata: Metadata = {
  title: 'Dosificación de Agroquímicos',
  description: 'Agenda, planificación y seguimiento histórico de la dosificación de agroquímicos.',
}

export default async function DosingPage() {
  const [dosingRes, agroRes] = await Promise.all([getDosingTasks(100, 0), getAgrochemicals()])

  const initialTasks = dosingRes.success ? dosingRes.data || [] : []
  const agrochemicals = agroRes.ok ? agroRes.agrochemicals || [] : []

  return <DosingView agrochemicals={agrochemicals} initialTasks={initialTasks} />
}
