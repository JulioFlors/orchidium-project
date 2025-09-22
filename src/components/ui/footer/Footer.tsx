'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'

import { titleFont } from '@/config/fonts'

export function Footer() {
  const pathname = usePathname()
  const isCartPage = pathname === '/cart'

  return (
    <footer
      className={clsx('w-full py-[27px] text-xs leading-5 font-semibold', {
        'tds-lg:mb-0 mb-[70px]': isCartPage,
      })}
    >
      <div className="flex flex-wrap justify-center gap-x-4">
        <div className="tds-sm:w-auto tds-sm:flex-none w-full flex-shrink-0 text-center">
          <Link className="focus-link inline-block py-2" href="/">
            <span className={`${titleFont.className} font-medium`}>PristinoPlant </span>
            <span>© {new Date().getFullYear()}</span>
          </Link>
        </div>

        <Link className="focus-link py-2" href="/">
          Privacidad & Legal
        </Link>

        <Link className="focus-link py-2" href="/">
          Contacto
        </Link>
      </div>
    </footer>
  )
}
