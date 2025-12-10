'use client'

import Link from 'next/link'

import { PristinoPlant } from '@/components'

export function AuthHeader() {
  return (
    <header
      aria-label="Cabecera de autenticación"
      className="tds-sm:fixed top-0 z-10 w-full bg-white"
    >
      <div className="relative flex min-h-14 w-full items-center justify-between text-sm font-semibold">
        <div className="left-menu-container">
          <div className="left-menu-wrapper">
            <Link className="focus-link" href="/">
              <PristinoPlant width="9rem" />
            </Link>

            <Link
              className="focus-link sr-only top-2 left-5 w-52! text-center focus:not-sr-only focus:absolute focus:z-20 focus:p-2"
              href="#main-content"
            >
              Saltar al contenido principal
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
