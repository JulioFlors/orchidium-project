import Link from 'next/link'
import Image from 'next/image'

import { titleFont } from '@/config/fonts'

interface Props {
  title: string
}

export function PageNotFound({ title }: Props) {
  return (
    <div className="flex w-full flex-col-reverse items-center justify-center gap-10 py-16 md:flex-row">
      {/* Sección de Texto */}
      <div className="text-primary-404 mx-5 px-5 text-center">
        <h2 className={`${titleFont.className} text-8xl font-medium md:text-9xl`}>{title}</h2>
        <p className="my-5 text-base leading-5 font-medium md:text-2xl md:leading-7 md:font-semibold">
          ¡Vaya! Lo sentimos...
        </p>
        <p className="text-secondary-404 my-5 text-sm font-light md:text-base">
          <span>Lo llevaremos al </span>
          <Link className="centro-pokemon" href="/">
            Centro Pokémon
          </Link>
          <span> mas cercano.</span>
        </p>
      </div>

      {/* Sección de Imagen */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative h-64 w-64 select-none md:h-80 md:w-80 lg:h-96 lg:w-96"
      >
        <Image
          fill
          priority
          alt="Ilustración decorativa de Ponyta"
          className="object-contain"
          src="/imgs/ponyta.webp"
        />
      </div>
    </div>
  )
}
