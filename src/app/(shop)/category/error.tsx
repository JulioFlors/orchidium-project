'use client'

import { PageNotFound } from '@/components'

export default function CategoryErrorPage() {
  return (
    <>
      {
        // eslint-disable-next-line no-console
        console.log('CategoryErrorPage')
      }
      <PageNotFound />
    </>
  )
}
