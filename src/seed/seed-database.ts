/* eslint-disable no-console */
import { ZoneType, TableType } from '@prisma/client'

import prisma from '../lib/prisma'

import { initialData } from './seed'

async function seedDatabase() {
  try {
    // Borrar registros previos
    await prisma.plant.deleteMany({}) // Plant (depende de Species)
    await prisma.speciesImage.deleteMany({}) // SpeciesImage (depende de Species)
    await prisma.species.deleteMany({}) // Species (depende de Stock)
    await prisma.stock.deleteMany({}) // Stock (no depende de nadie)
    await prisma.location.deleteMany({}) // Location (no depende de nadie)

    // obtener el arreglo de objetos de species
    const { species, plants } = initialData

    // Insertar species
    for (const especieData of species) {
      const { ...rest } = especieData

      await prisma.species.create({
        data: {
          ...rest,
          stock: {
            create: {
              quantity: especieData.stock.quantity,
              available: especieData.stock.available,
            },
          },
          speciesImage: {
            createMany: {
              data: especieData.speciesImage.map((url) => ({ url })),
            },
          },
        },
      })
    }

    // obtener las species de la base de datos
    const speciesDB = await prisma.species.findMany()

    // mapear las species a un objeto usando el nombre como clave
    const speciesMap = speciesDB.reduce(
      (map, especie) => {
        map[especie.name.toLowerCase().trim()] = especie.id

        return map
      },
      {} as Record<string, string>,
    )

    // generar las localizaciones basado en las Zonas y Mesas definidas
    const locationData: { zone: ZoneType; table: TableType }[] = []

    for (const zone of Object.values(ZoneType)) {
      for (const table of Object.values(TableType)) {
        locationData.push({ zone, table })
      }
    }

    // Insertar localizaciones
    await prisma.location.createMany({
      data: locationData,
    })

    // obtener las localizaciones de la base de datos
    const locationDB = await prisma.location.findMany()

    // mapear las localizaciones a un objeto usando zona y mesa como clave
    const locationMap = locationDB.reduce(
      (map, location) => {
        const key = `${location.zone}-${location.table}`

        map[key.toLowerCase()] = location.id

        return map
      },
      {} as Record<string, string>,
    )

    // Insertar plants
    for (const plant of plants) {
      const { species, location, ...rest } = plant

      const speciesId = speciesMap[species.name]

      if (!speciesId) {
        console.error(`No se encontró la especie: ${species.name}`)
        continue
      }

      const locationKey = location ? `${location.zone}-${location.table}` : null
      const locationId = locationKey ? locationMap[locationKey] : null

      const data: {
        species: { connect: { id: string } }
        pottingDate?: Date
        location?: { connect: { id: string } }
      } = {
        ...rest,
        species: { connect: { id: speciesId } }, // Conexión correcta con la especie
      }

      if (locationId) {
        data.location = { connect: { id: locationId } } // Conexión correcta con la location
      }

      await prisma.plant.create({
        data,
      })
    }

    console.log('Seed cargado exitosamente!')
  } catch (e) {
    console.error('Ha ocurrio un Error al ejecutar el Seed:', e)
  }
}

// eslint-disable-next-line prettier/prettier
(() => {
  if (process.env.NODE_ENV === 'production') return
  seedDatabase()
})()
