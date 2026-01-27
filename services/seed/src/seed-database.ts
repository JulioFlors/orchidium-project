/* eslint-disable no-console */

import { initialData, SeedFertilizationCycle, SeedPhytosanitaryCycle } from './seed-data'

import { prisma, ZoneType, TableType, PotSize, PlantStatus, PlantType } from '@package/database'

// ---- Interfaz auxiliar ----
interface ProductCycleConnect {
  sequence: number
  agrochemical: { connect: { name: string } }
}

/** 
 * **Crea productsCycle con Agrochemicals existentes**
 * * programa NO válido `return null`
*/
const createValidatedProductsCycle = async (
  productsCycleData: SeedFertilizationCycle[] | SeedPhytosanitaryCycle[],
  programName: string,
  programType: string,
): Promise<ProductCycleConnect[] | null> => {
  const validProductsCycle = []
  // Variable para rastrear si el programa es válido
  let programValid = true

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

  return programValid ? validProductsCycle : null
}

/** 
 * **Script de Seeding**
*/
async function main() {
  let rawUrl = process.env.DATABASE_URL
  if (!rawUrl) throw new Error('DATABASE_URL no definida')

  // Limpieza de la URL (Igual que en client.ts para consistencia)
  const connectionString = rawUrl.replace(/^["']|["']$/g, '').trim()

  // 3. Extracción basada en delimitadores específicos
  // Host: Se encuentra entre el '@' y los ':' del puerto
  // DB Name: Se encuentra entre el '/' y el '?' de los parámetros
  const hostMatch = connectionString.match(/@([^:]+):/)
  const dbMatch = connectionString.match(/\/([^/?]+)\?/)

  let host = hostMatch ? hostMatch[1] : 'desconocido'
  let dbName = dbMatch ? dbMatch[1] : 'desconocida'

  // Caso especial para Neon
  if (connectionString.includes('neon.tech') || connectionString.includes('neondb')) {
    host = 'NeonDB (Cloud)'
    dbName = 'neondb'
  }

  console.log('\n')
  console.log('\x1b[33m┌──────────────────────────────────────────────────┐')
  console.log('\x1b[33m│               🌱  Script de Seeding              │')
  console.log('\x1b[33m├──────────────────────────────────────────────────┤')
  console.log(`\x1b[33m│ \x1b[0mBase de Datos: \x1b[36m${dbName.padEnd(32)}  \x1b[33m│`)
  console.log(`\x1b[33m│ \x1b[0mServidor:      \x1b[36m${host.padEnd(32)}  \x1b[33m│`)
  console.log('\x1b[33m└──────────────────────────────────────────────────┘\x1b[0m\n')

  // ---- Borrar registros previos ----
  console.log('🗑️  Borrando datos antiguos')

  // Tablas de Automatización
  await prisma.taskLog.deleteMany({})
  await prisma.automationSchedule.deleteMany({})

  // Tablas de Historial de influxdb
  await prisma.dailyEnvironmentStat.deleteMany({})

  // Tablas de Gestión
  await prisma.user.deleteMany({})
  await prisma.plant.deleteMany({})
  await prisma.productVariant.deleteMany({})
  await prisma.speciesImage.deleteMany({})
  await prisma.species.deleteMany({})
  await prisma.genus.deleteMany({})
  await prisma.location.deleteMany({})

  // Tablas de Planes
  await prisma.phytosanitaryCycle.deleteMany({})
  await prisma.phytosanitaryProgram.deleteMany({})
  await prisma.fertilizationCycle.deleteMany({})
  await prisma.fertilizationProgram.deleteMany({})
  await prisma.agrochemical.deleteMany({})

  console.log('✅  Datos antiguos borrados')

  // ---- obtener el arreglo de objetos del seed-data.ts ----
  const {
    users,
    genus,
    species,
    plants,
    agrochemicals,
    fertilizationPrograms,
    phytosanitaryPrograms,
    automationSchedules
  } = initialData

  console.log('🌱  Insertando nuevos datos')

  // ---- Insertar Users ----
  await prisma.user.createMany({ data: users })

  // ---- Insertar Genus ----
  await prisma.genus.createMany({ data: genus })

  // ---- Generar Mapas de Nombres a IDs (Genus) - necesarios para relacionar FKs ----
  // obtener los genus de la base de datos
  const genusDB = await prisma.genus.findMany()
  // crear un mapa de nombres a IDs y Tipos para generar variantes
  const genusMap = genusDB.reduce(
    (map: Record<string, {id: string, type: PlantType}>, genus) => {
      map[genus.name] = { id: genus.id, type: genus.type }
      return map
    },
    {} as Record<string, {id: string, type: PlantType}>,
  )

  // ---- Insertar Species y Variants ----
  for (const sp of species) {
    const { genus, variants, ...rest } = sp
    const genusData = genusMap[genus.name]

    if (!genusData) {
      console.warn(`
        ❌  Error: El Genero NO es válido

          • Genero: ${genus.name}
          • Epecie: ${rest.name}
          
        ⚠️  Warning: La Especie se Omitirá
        `)
      continue
    }

    const createdSpecies = await prisma.species.create({
      data: {
        ...rest,
        genus: { connect: { id: genusData.id } }, // Conexión con genus
        images: {
          createMany: {
            data: sp.images.map((url) => ({ url })),
          },
        },
      },
    })

    // Crear Variantes Hardcodeadas (si existen)
    if (variants && variants.length > 0) {
      await prisma.productVariant.createMany({
        data: variants.map(v => ({
          speciesId: createdSpecies.id,
          size: v.size,
          price: v.price,
          quantity: v.quantity,
          available: v.available
        }))
      })
    }
  }

  // ---- Generar Mapas de Nombres a IDs (Species) - necesarios para relacionar FKs ----
  // obtener las species de la base de datos
  const speciesDB = await prisma.species.findMany()
  // crear un mapa de nombres a IDs
  const speciesMap = speciesDB.reduce(
    (map: Record<string, string>, species: { id: string; name: string }) => {
      map[species.name] = species.id

      return map
    },
    {} as Record<string, string>,
  )

  // ---- Generar e Insertar Localizaciones basado en las Zonas y Mesas definidas ----
  const locationData: { zone: ZoneType; table: TableType }[] = []

  for (const zone of Object.values(ZoneType)) {
    for (const table of Object.values(TableType)) {
      locationData.push({ zone, table })
    }
  }

  // Insertar Localizaciones
  await prisma.location.createMany({ data: locationData })

  // ---- Generar Mapas de Nombres a IDs (Locations) - necesarios para relacionar FKs ----
  // obtener las localizaciones de la base de datos
  const locationDB = await prisma.location.findMany()
  // crear un mapa de claves de zona-mesa a IDs
  const locationMap = locationDB.reduce(
    (map: Record<string, string>, location: { zone: ZoneType; table: TableType; id: string }) => {
      const key = `${location.zone}-${location.table}`

      map[key] = location.id

      return map
    },
    {} as Record<string, string>,
  )

  // ---- Insertar Plants ----
  for (const plant of plants) {
    const { species, location, currentSize, ...rest } = plant

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
      currentSize: PotSize
      status: PlantStatus
      location?: { connect: { id: string } }
    } = {
      ...rest,
      species: { connect: { id: speciesId } },
      currentSize: currentSize,
      status: 'AVAILABLE'
    }

    if (locationId) {
      data.location = { connect: { id: locationId } }
    }

    await prisma.plant.create({
      data,
    })
  }

  // ---------------- Planes de Cultivo ----------------

  // ---- Insertar Agrochemicals ----
  await prisma.agrochemical.createMany({ data: agrochemicals })

  // ---- Fertilization Programs ----
  // Guardamos el ID en un mapa para usarlo después en los Schedules
  const fertProgramMap: Record<string, string> = {};
  // Insertar Fertilization Programs
  for (const program of fertilizationPrograms) {
    const cycles = await createValidatedProductsCycle(program.productsCycle, program.name, 'Fertilización')

    if (cycles) {
      const created = await prisma.fertilizationProgram.create({
        data: {
          name: program.name,
          weeklyFrequency: program.weeklyFrequency,
          productsCycle: { create: cycles }
        }
      })
      fertProgramMap[created.name] = created.id; // Guardamos ID
    }
  }

  // ---- Phytosanitary Programs ----
  // Guardamos el ID en un mapa para usarlo después en los Schedules
  const phytoProgramMap: Record<string, string> = {};
  // Insertar Phytosanitary Programs
  for (const program of phytosanitaryPrograms) {
    const cycles = await createValidatedProductsCycle(program.productsCycle, program.name, 'Fitosanitario')
    if (cycles) {
      const created = await prisma.phytosanitaryProgram.create({
        data: {
          name: program.name,
          monthlyFrequency: program.monthlyFrequency,
          productsCycle: { create: cycles }
        }
      })
      phytoProgramMap[created.name] = created.id; // Guardamos ID
    }
  }

  // ---- Rutinas de Automatización ----
  // Rutina: Riego Interdiario
  for (const schedule of automationSchedules) {
    // Preparamos la conexión opcional a programas
    let fertConnection = undefined;
    if (schedule.fertilizationProgramName) {
      const progId = fertProgramMap[schedule.fertilizationProgramName];
      if (progId) fertConnection = { connect: { id: progId } };
      else console.warn(`⚠️  Programa Fertilización '${schedule.fertilizationProgramName}' no encontrado para rutina '${schedule.name}'`);
    }

    let phytoConnection = undefined;
    if (schedule.phytosanitaryProgramName) {
      const progId = phytoProgramMap[schedule.phytosanitaryProgramName];
      if (progId) phytoConnection = { connect: { id: progId } };
      else console.warn(`⚠️  Programa Fitosanitario '${schedule.phytosanitaryProgramName}' no encontrado para rutina '${schedule.name}'`);
    }

    await prisma.automationSchedule.create({
      data: {
        name: schedule.name,
        description: schedule.description,
        purpose: schedule.purpose,
        cronTrigger: schedule.cronTrigger,
        durationMinutes: schedule.durationMinutes,
        zones: schedule.zones,
        isEnabled: schedule.isEnabled,
        // Conexiones dinámicas
        fertilizationProgram: fertConnection,
        phytosanitaryProgram: phytoConnection
      }
    })
  }

  console.log('\n✨  Seed cargado exitosamente!\n\n')
}

main()
  .catch((e) => {
    console.error('❌ Ha ocurrio un Error al ejecutar el Seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })