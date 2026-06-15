'use client'

import { OracleDecisionCard } from './components'

import { Heading } from '@/components'
import { OracleForecast } from '@/actions'

interface WeatherOracleViewProps {
  forecast: OracleForecast | undefined
  error?: string
}

export function WeatherOracleView({ forecast, error }: WeatherOracleViewProps) {
  return (
    <div className="tds-sm:px-0 mx-auto mt-9 flex w-full max-w-7xl flex-col gap-8 px-4 pb-12">
      <Heading
        description="Datos obtenidos desde API's meteorológicas."
        title="Pronósticos Meteorológicos"
      />

      <div className="flex flex-col gap-10">
        {error && (
          <div className="bg-surface/30 rounded-xl border border-dashed border-red-500/20 p-6 text-center">
            <p className="font-medium text-red-400">{error}</p>
          </div>
        )}

        <div className="grid w-full grid-cols-1 gap-6">
          <section className="flex flex-col gap-4">
            <OracleDecisionCard forecast={forecast} />
          </section>
        </div>
      </div>
    </div>
  )
}
