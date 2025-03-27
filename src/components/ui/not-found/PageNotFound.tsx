import Link from 'next/link'

import { Ponyta } from '../icons/Ponyta'

import { titleFont } from '@/config/fonts'

export function PageNotFound() {
  return (
    <div className="flex w-full flex-col-reverse items-center justify-center gap-10 py-16 md:flex-row">
      <div className="text-primary-404 mx-5 px-5 text-center">
        <h2 className={`${titleFont.className} text-8xl md:text-9xl`}>404</h2>
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

      <div>
        <Ponyta className="max-h-[20rem] max-w-[20rem] lg:max-h-[24rem] lg:max-w-[24rem] xl:max-h-[28rem] xl:max-w-[28rem]" />
      </div>
    </div>
  )
}
