import path from 'path'

import axios from 'axios'
import dotenv from 'dotenv'

import { Logger } from '../src/logger'

// Cargar variables desde el root .env
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })

const apiKey = process.env.AGROMONITORING_API_KEY

if (!apiKey) {
  Logger.error('❌ Error: AGROMONITORING_API_KEY no encontrada en .env')
  process.exit(1)
}

const polygonData = {
  name: 'Orquideario Simón Bolívar',
  geo_json: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-62.66444817, 8.35552175], // Top Left
          [-62.66334817, 8.35552175], // Top Right
          [-62.66334817, 8.35442175], // Bottom Right
          [-62.66444817, 8.35442175], // Bottom Left
          [-62.66444817, 8.35552175], // Close loop
        ],
      ],
    },
  },
}

async function register() {
  Logger.info('🛰️ Iniciando registro de polígono en Agromonitoring...')

  try {
    const response = await axios.post(
      `http://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`,
      polygonData,
    )

    const { id, name, area } = response.data

    Logger.raw('\n✅ POLÍGONO REGISTRADO CON ÉXITO:')
    Logger.raw(`-----------------------------------`)
    Logger.raw(`🆔 ID:   ${id}`)
    Logger.raw(`📁 Name: ${name}`)
    Logger.raw(`📐 Area: ${area.toFixed(2)}m² (${(area / 10000).toFixed(4)} ha)`)
    Logger.raw(`-----------------------------------`)
    Logger.raw('\n🚀 PRÓXIMO PASO:')
    Logger.raw(`Copia el ID anterior y pégalo en tu archivo .env como:`)
    Logger.raw(`AGROMONITORING_POLY_ID=${id}`)
  } catch (error: unknown) {
    Logger.error('❌ Error al registrar el polígono:')
    if (axios.isAxiosError(error) && error.response) {
      Logger.raw(`Status: ${error.response.status}`)
      Logger.raw(`Data: ${JSON.stringify(error.response.data, null, 2)}`)
    } else if (error instanceof Error) {
      Logger.error(error.message)
    } else {
      Logger.error(String(error))
    }
  }
}

register()
