'use client'

import { useEffect } from 'react'

import { PageNotFound } from '@/components'

export default function CategoryErrorPage() {
  useEffect(() => {
    document.title = 'PristinoPlant | Error'
  }, [])

  return <PageNotFound title="Error" />
}
