'use client'

import { PageNotFound } from '@/components'

export default function ErrorPage() {
  return (
    <>
      {
        // eslint-disable-next-line no-console
        console.log('ErrorPage')
      }
      <PageNotFound />
    </>
  )
}
