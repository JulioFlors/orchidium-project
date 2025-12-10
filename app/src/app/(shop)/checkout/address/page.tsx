import type { Metadata } from 'next'

import Link from 'next/link'

import { AddressForm } from './ui/AddressForm'

export const metadata: Metadata = {
  title: 'PristinoPlant | Facturación y envío',
}

export default function AddressPage() {
  return (
    <div className="tds-sm:-mx-9 tds-xl:-mx-12 -mx-6">
      <div className="tds-lg:max-w-[1200px] tds-lg:mt-8 tds-sm:px-9 tds-xl:px-12 mx-auto flex w-full max-w-[600px] min-w-[260px] flex-col px-6">
        <div className="tds-sm:items-start tds-sm:justify-start tds-sm:px-0 tds-lg:max-w-[850px] flex w-full max-w-[800px] flex-col justify-center">
          {/* ---- Formulario de Envio ----*/}
          <AddressForm />

          <Link
            className="btn-primary mx-0.75 mt-6 mb-12 w-auto min-w-[206px] align-middle"
            href="/checkout"
          >
            Siguiente
          </Link>
        </div>
      </div>
    </div>
  )
}
