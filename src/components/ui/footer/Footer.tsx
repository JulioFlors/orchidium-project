import Link from 'next/link'

import { titleFont } from '@/config/fonts'

export function Footer() {
  return (
    <footer className="w-full py-5 text-xs font-medium">
      <div className="flex flex-wrap justify-center gap-4">
        <Link className="focus-visible py-2" href="/">
          <span className={`${titleFont.className} font-semibold`}>PristinoPlant </span>
          <span>© {new Date().getFullYear()}</span>
        </Link>

        <Link className="focus-visible py-2" href="/">
          Privacidad & Legal
        </Link>

        <Link className="focus-visible py-2" href="/">
          Contacto
        </Link>
      </div>
    </footer>
  )
}
