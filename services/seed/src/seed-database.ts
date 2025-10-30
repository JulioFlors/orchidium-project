/* eslint-disable no-console */

import { initialData, SeedFertilizationCycle, SeedPhytosanitaryCycle } from './seed-data'

import { prisma, ZoneType, TableType, ActuatorType, TaskStatus } from '@package/database'

interface ProductCycleConnect {
  sequence: number
  agrochemical: { connect: { name: string } }
}

// validar y crear productsCycle con Agrochemicals existentes
const createValidatedProductsCycle = async (
  productsCycleData: SeedFertilizationCycle[] | SeedPhytosanitaryCycle[],
  programName: string,
  programType: string,
): Promise<ProductCycleConnect[] | null> => {
  // la función puede retornar null si el programa NO es válido
  const validProductsCycle = []
  let programValid = true // Variable para rastrear si el programa es válido

  for (const pc of productsCycleData) {
    const agrochemicalExists = await prisma.agrochemical.findUnique({
      where: { name: pc.agrochemical.name },
    })

    if (!agrochemicalExists) {
      console.warn(`
        ❌  Error: Agroquímico NO Encontrado

          • Agroquímico: ${pc.agrochemical.name}
          • Programa: ${programType} ${programName}
          • Secuencia: ${pc.sequence}
          
        ⚠️  Warning: El Programa NO ES Valido
        `)

      programValid = false // Marcar el programa como NO válido
      break // Salir del bucle for...of inmediatamente al encontrar el primer Agroquímico no válido
    }

    validProductsCycle.push({
      sequence: pc.sequence,
      agrochemical: { connect: { name: pc.agrochemical.name } },
    })
  }

  if (!programValid) {
    return null // Retornar null para indicar que el programa NO es válido
  }

  return validProductsCycle // Retornar el array de productsCycle válidos si el programa ES válido
}

async function seedDatabase() {
  try {
    // ----------------------------------------------------------------------------------
    // Borrar registros previos
    // ----------------------------------------------------------------------------------
    await prisma.plant.deleteMany({})
    await prisma.speciesImage.deleteMany({})
    await prisma.species.deleteMany({})
    await prisma.genus.deleteMany({})
    await prisma.stock.deleteMany({})
    await prisma.location.deleteMany({})
    await prisma.phytosanitaryTask.deleteMany({})
    await prisma.phytosanitaryCycle.deleteMany({})
    await prisma.phytosanitaryProgram.deleteMany({})
    await prisma.fertilizationTask.deleteMany({})
    await prisma.fertilizationCycle.deleteMany({})
    await prisma.fertilizationProgram.deleteMany({})
    await prisma.irrigationTask.deleteMany({})
    await prisma.irrigationProgram.deleteMany({})
    await prisma.agrochemical.deleteMany({})

    // obtener el arreglo de objetos del seed.ts
    const {
      genus,
      species,
      plants,
      agrochemicals,
      fertilizationPrograms,
      fertilizationTasks,
      phytosanitaryPrograms,
      phytosanitaryTasks,
      irrigationPrograms,
      irrigationTasks,
    } = initialData

    // ----------------------------------------------------------------------------------
    // Insertar Genus
    // ----------------------------------------------------------------------------------
    await prisma.genus.createMany({
      data: genus,
    })

    // ----------------------------------------------------------------------------------
    // Generar Mapas de Nombres a IDs (Genus) - necesarios para relacionar
    // ----------------------------------------------------------------------------------

    // obtener los genus de la base de datos
    const genusDB = await prisma.genus.findMany()

    const genusMap = genusDB.reduce(
      (map: Record<string, string>, genus: { id: string; name: string }) => {
        map[genus.name] = genus.id

        return map
      },
      {} as Record<string, string>,
    )

    // ----------------------------------------------------------------------------------
    // Insertar Species
    // ----------------------------------------------------------------------------------
    for (const speciesData of species) {
      const { genus, ...rest } = speciesData

      const genusId = genusMap[genus.name]

      if (!genusId) {
        console.warn(`
        ❌  Error: El Genero NO es válido

          • Genero: ${genus.name}
          • Epecie: ${rest.name}
          
        ⚠️  Warning: La Especie se Omitirá
        `)
        continue
      }

      await prisma.species.create({
        data: {
          ...rest,
          genus: { connect: { id: genusId } }, // Conexión con genus
          stock: {
            create: {
              quantity: speciesData.stock.quantity,
              available: speciesData.stock.available,
            },
          },
          images: {
            createMany: {
              data: speciesData.images.map((url) => ({ url })),
            },
          },
        },
      })
    }

    // ----------------------------------------------------------------------------------
    // Generar Mapas de Nombres a IDs (Species) - necesarios para relacionar
    // ----------------------------------------------------------------------------------

    // obtener las species de la base de datos
    const speciesDB = await prisma.species.findMany()

    const speciesMap = speciesDB.reduce(
      (map: Record<string, string>, species: { id: string; name: string }) => {
        map[species.name] = species.id

        return map
      },
      {} as Record<string, string>,
    )

    // ----------------------------------------------------------------------------------
    // Generar e Insertar Localizaciones basado en las Zonas y Mesas definidas
    // ----------------------------------------------------------------------------------
    const locationData: { zone: ZoneType; table: TableType }[] = []

    for (const zone of Object.values(ZoneType)) {
      for (const table of Object.values(TableType)) {
        locationData.push({ zone, table })
      }
    }

    // Insertar Localizaciones
    await prisma.location.createMany({
      data: locationData,
    })

    // ----------------------------------------------------------------------------------
    // Generar Mapas de Nombres a IDs (Locations) - necesarios para relacionar
    // ----------------------------------------------------------------------------------

    // obtener las localizaciones de la base de datos
    const locationDB = await prisma.location.findMany()

    const locationMap = locationDB.reduce(
      (map: Record<string, string>, location: { zone: ZoneType; table: TableType; id: string }) => {
        const key = `${location.zone}-${location.table}`

        map[key] = location.id

        return map
      },
      {} as Record<string, string>,
    )

    // ----------------------------------------------------------------------------------
    // Insertar Plants
    // ----------------------------------------------------------------------------------
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
        species: { connect: { id: speciesId } }, // Conexión correcta con la species
      }

      if (locationId) {
        data.location = { connect: { id: locationId } } // Conexión correcta con la location
      }

      await prisma.plant.create({
        data,
      })
    }

    // ----------------------------------------------------------------------------------
    // Insertar Agrochemicals
    // ----------------------------------------------------------------------------------
    await prisma.agrochemical.createMany({
      data: agrochemicals,
    })

    // ----------------------------------------------------------------------------------
    // Insertar Fertilization Programs
    // ----------------------------------------------------------------------------------
    for (const fertilizationData of fertilizationPrograms) {
      const { ...rest } = fertilizationData

      const createdProductsCycle = await createValidatedProductsCycle(
        fertilizationData.productsCycle,
        fertilizationData.name,
        'Fertilización',
      )

      if (createdProductsCycle) {
        await prisma.fertilizationProgram.create({
          data: {
            ...rest,
            productsCycle: {
              create: createdProductsCycle,
            },
          },
        })
      }
    }

    // ----------------------------------------------------------------------------------
    // Insertar Phytosanitary Programs
    // ----------------------------------------------------------------------------------
    for (const phytosanitaryData of phytosanitaryPrograms) {
      const { ...rest } = phytosanitaryData

      const createdProductsCycle = await createValidatedProductsCycle(
        phytosanitaryData.productsCycle,
        phytosanitaryData.name,
        'Fitosanitario',
      )

      if (createdProductsCycle) {
        await prisma.phytosanitaryProgram.create({
          data: {
            ...rest,
            productsCycle: {
              create: createdProductsCycle,
            },
          },
        })
      }
    }

    // ----------------------------------------------------------------------------------
    // Insertar Irrigation Programs
    // ----------------------------------------------------------------------------------
    for (const irrigationData of irrigationPrograms) {
      const { ...rest } = irrigationData

      await prisma.irrigationProgram.create({
        data: {
          ...rest,
        },
      })
    }

    // ----------------------------------------------------------------------------------
    // Generar Mapas de Nombres a IDs (Agrochemicals, Programs, Cycles) - necesarios para relacionar
    // ----------------------------------------------------------------------------------

    // obtener los agrochemicals de la base de datos
    const agrochemicalsDB = await prisma.agrochemical.findMany()

    const agrochemicalMap = agrochemicalsDB.reduce(
      (map: Record<string, string>, agrochemical: { id: string; name: string }) => {
        map[agrochemical.name] = agrochemical.id

        return map
      },
      {} as Record<string, string>,
    )

    // obtener los fertilizationPrograms de la base de datos
    const fertilizationProgramsDB = await prisma.fertilizationProgram.findMany()

    const fertilizationProgramMap = fertilizationProgramsDB.reduce(
      (map: Record<string, string>, program: { id: string; name: string }) => {
        map[program.name] = program.id

        return map
      },
      {} as Record<string, string>,
    )

    // obtener los phytosanitaryPrograms de la base de datos
    const phytosanitaryProgramsDB = await prisma.phytosanitaryProgram.findMany()

    const phytosanitaryProgramMap = phytosanitaryProgramsDB.reduce(
      (map: Record<string, string>, program: { id: string; name: string }) => {
        map[program.name] = program.id

        return map
      },
      {} as Record<string, string>,
    )

    // obtener los irrigationPrograms de la base de datos
    const irrigationProgramsDB = await prisma.irrigationProgram.findMany()

    const irrigationProgramMap = irrigationProgramsDB.reduce(
      (map: Record<string, string>, program: { id: string; name: string }) => {
        map[program.name] = program.id

        return map
      },
      {} as Record<string, string>,
    )

    // obtener los productsCycle de la base de datos
    const fertilizationCyclesDB = await prisma.fertilizationCycle.findMany()

    const fertilizationCycleMap = fertilizationCyclesDB.reduce(
      (map: Record<string, string>, cycle: { id: string; programId: string; sequence: number }) => {
        const key = `${cycle.programId}-${cycle.sequence}`

        map[key] = cycle.id

        return map
      },
      {} as Record<string, string>,
    )

    // obtener los productsCycle de la base de datos
    const phytosanitaryCyclesDB = await prisma.phytosanitaryCycle.findMany()

    const phytosanitaryCycleMap = phytosanitaryCyclesDB.reduce(
      (map: Record<string, string>, cycle: { id: string; programId: string; sequence: number }) => {
        const key = `${cycle.programId}-${cycle.sequence}`

        map[key] = cycle.id

        return map
      },
      {} as Record<string, string>,
    )

    // ----------------------------------------------------------------------------------
    // Insertar Fertilization Tasks
    // ----------------------------------------------------------------------------------
    for (const fertilizationTaskData of fertilizationTasks) {
      const { zones, agrochemical, productsCycle, ...rest } = fertilizationTaskData

      // Validar Zones
      if (!Array.isArray(zones) || !zones.every((zone) => Object.values(ZoneType).includes(zone))) {
        console.warn(`
          Error: --- '${zones}' NO es una ZONA válida ---
            Program: ${productsCycle?.programName}
            Agrochemical: ${agrochemical.name}
            Task:    ${fertilizationTaskData.scheduledDate}
          Warning: --- La Tarea se Omitirá ---
        `)
        continue // Omitir la tarea si 'zones' no es válido
      }

      // Validar Agrochemical
      const agrochemicalId = agrochemicalMap[agrochemical.name]

      if (!agrochemicalId) {
        console.warn(`
          Error: --- Agroquímico NO Encontrado ---
            Program: ${productsCycle?.programName}
            Agrochemical: '${agrochemical.name}'
            Date:    ${fertilizationTaskData.scheduledDate}
          Warning: --- La Tarea se Omitirá --- 
          `)
        continue // Omitir la tarea si el Agroquímico no existe
      }

      // Validar productsCycleId
      const cycleKey = productsCycle
        ? `${fertilizationProgramMap[productsCycle.programName]}-${productsCycle.sequence}`
        : undefined
      const productsCycleId = cycleKey ? fertilizationCycleMap[cycleKey] : undefined

      const data: {
        scheduledDate: Date
        zones: ZoneType[]
        note?: string
        agrochemical: { connect: { id: string } }
        productsCycle?: { connect: { id: string } }
      } = {
        ...rest,
        scheduledDate: fertilizationTaskData.scheduledDate,
        zones: zones as ZoneType[],
        agrochemical: { connect: { id: agrochemicalId } },
      }

      if (productsCycleId) {
        data.productsCycle = { connect: { id: productsCycleId } }
      }

      if (!productsCycleId) {
        data.note = `Task: Ad Hoc (Abordamos las situaciones según vanyan detectándose)`
      }

      await prisma.fertilizationTask.create({
        data,
      })
    }

    // ----------------------------------------------------------------------------------
    // Insertar Phytosanitary Tasks
    // ----------------------------------------------------------------------------------
    for (const phytosanitaryTaskData of phytosanitaryTasks) {
      const { zones, agrochemical, productsCycle, ...rest } = phytosanitaryTaskData

      // Validar Zones
      if (!Array.isArray(zones) || !zones.every((zone) => Object.values(ZoneType).includes(zone))) {
        console.warn(`
          Error: --- '${zones}' NO es una ZONA válida ---
            Program: ${productsCycle?.programName}
            Agrochemical: ${agrochemical.name}
            Task:    ${rest.scheduledDate}
          Warning: --- La Tarea se Omitirá ---
        `)
        continue // Omitir la tarea si 'zones' no es válido
      }

      // Validar Agrochemical
      const agrochemicalId = agrochemicalMap[agrochemical.name]

      if (!agrochemicalId) {
        console.warn(`
          Error: --- Agroquímico NO Encontrado ---
            Program: ${productsCycle?.programName}
            Agrochemical: '${agrochemical.name}'
            Date:    ${rest.scheduledDate}
          Warning: --- La Tarea se Omitirá --- 
          `)
        continue // Omitir la tarea si el Agroquímico no existe
      }

      // Validar productsCycleId
      const cycleKey = productsCycle
        ? `${phytosanitaryProgramMap[productsCycle.programName]}-${productsCycle.sequence}`
        : undefined
      const productsCycleId = cycleKey ? phytosanitaryCycleMap[cycleKey] : undefined

      const data: {
        scheduledDate: Date
        zones: ZoneType[]
        note?: string
        agrochemical: { connect: { id: string } }
        productsCycle?: { connect: { id: string } }
      } = {
        ...rest,
        zones: zones as ZoneType[],
        agrochemical: { connect: { id: agrochemicalId } },
      }

      if (productsCycleId) {
        data.productsCycle = { connect: { id: productsCycleId } }
      }

      if (!productsCycleId) {
        data.note = `Task: Ad Hoc (Abordamos las situaciones según vanyan detectándose)`
      }

      await prisma.phytosanitaryTask.create({
        data,
      })
    }

    // ----------------------------------------------------------------------------------
    // Insertar Irrigation Tasks
    // ----------------------------------------------------------------------------------
    for (const irrigationTaskData of irrigationTasks) {
      const { zones, program, ...rest } = irrigationTaskData

      // Validar Zones
      if (!Array.isArray(zones) || !zones.every((zone) => Object.values(ZoneType).includes(zone))) {
        console.warn(`
          Error: --- '${zones}' NO es una ZONA válida ---
            Date: ${rest.scheduledDate}
            Actuator: ${rest.actuator}
            Duration: ${rest.duration}
            Program: ${program?.name}
          Warning: --- La Tarea de Riego se Omitirá ---
        `)
        continue // Omitir la tarea si 'zones' no es válido
      }

      // Validar programId
      const programId = program ? irrigationProgramMap[program.name] : undefined

      const data: {
        scheduledDate: Date
        executionDate?: Date
        actuator: ActuatorType
        duration: number
        zones: ZoneType[]
        status?: TaskStatus
        program?: { connect: { id: string } }
      } = {
        ...rest,
        zones: zones as ZoneType[],
      }

      if (programId) {
        data.program = { connect: { id: programId } }
      }

      await prisma.irrigationTask.create({
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
