import { prisma, PlantType, PotSize, PlantStatus, ZoneType, TableType } from '@package/database'

async function main() {
  console.log('🌱 Iniciando siembra de catálogo y plantas de Astrophytum...')

  // 1. Obtener o crear Género Astrophytum
  const genus = await prisma.genus.upsert({
    where: { name: 'Astrophytum' },
    update: { type: PlantType.CACTUS },
    create: {
      name: 'Astrophytum',
      type: PlantType.CACTUS,
    },
  })
  console.log(`✅ Género verificado: ${genus.name} (${genus.id})`)

  // 2. Ubicación ZONA_D (Ventanas), MESA_1
  const location = await prisma.location.upsert({
    where: {
      zone_table: {
        zone: ZoneType.ZONA_D,
        table: TableType.MESA_1,
      },
    },
    update: {},
    create: {
      zone: ZoneType.ZONA_D,
      table: TableType.MESA_1,
    },
  })
  console.log(`✅ Ubicación verificada: ZONA_D (Ventanas) - MESA_1 (${location.id})`)

  // 3. Especies y Cultivares
  const speciesData = [
    {
      name: 'Astrophytum asterias',
      slug: 'astrophytum-asterias',
      description:
        'Un cactus fascinante por su forma esférica perfecta y su cuerpo suave libre de espinas, adornado por escamas diminutas y peludas de color blanco (tricomas). Produce hermosas flores amarillas de centro sedoso que abren con la luz del sol. Es una planta resistente, elegante y fácil de cuidar.',
      potSize: PotSize.NRO_10,
      plantCount: 2,
      pottingDate: null,
      floweringEvents: [
        { startDate: new Date('2026-01-15T10:00:00Z'), endDate: new Date('2026-01-18T18:00:00Z'), notes: 'Floración temprana de enero' },
        { startDate: new Date('2026-03-15T10:00:00Z'), endDate: new Date('2026-03-18T18:00:00Z'), notes: 'Floración de marzo' },
        { startDate: new Date('2026-04-14T10:00:00Z'), endDate: new Date('2026-04-17T18:00:00Z'), notes: 'Floración del 14 de Abril (Polinizada - Semillas recolectadas el 1 de Mayo)' },
        { startDate: new Date('2026-07-21T10:00:00Z'), endDate: new Date('2026-07-24T18:00:00Z'), notes: 'Floración de julio' },
      ],
    },
    {
      name: 'Astrophytum asterias Super Kabuto Akabana',
      slug: 'astrophytum-asterias-super-kabuto-akabana',
      description:
        'Un cultivar de colección sumamente especial originario de Japón. Destaca por su denso patrón de tricomas blancas aterciopeladas que cubren su superficie. Su gran atractivo es su floración: a diferencia del amarillo tradicional, este cultivar regala espectaculares flores en tonos rojizos y rosados. Un cultivar exclusivo y lleno de encanto.',
      potSize: PotSize.NRO_10,
      plantCount: 1,
      pottingDate: new Date('2026-07-01T00:00:00Z'),
      floweringEvents: [
        { startDate: new Date('2026-07-05T10:00:00Z'), endDate: new Date('2026-07-08T18:00:00Z'), notes: 'Inicio de botón floral el 30 de Junio. Flor de tonos rojizos/rosados.' },
      ],
    },
    {
      name: 'Astrophytum asterias Nudum Star Shape',
      slug: 'astrophytum-asterias-nudum-star-shape',
      description:
        'Este cultivar destaca por su diseño limpio y minimalista. Al no poseer tricomas blancas, deja ver una piel verde lisa que resalta su marcada forma de estrella. Sus flores amarillas brillantes crean un contraste espectacular sobre su cuerpo verde. Perfecto para quienes buscan una planta elegante.',
      potSize: PotSize.NRO_7,
      plantCount: 1,
      pottingDate: new Date('2026-07-01T00:00:00Z'),
      floweringEvents: [
        { startDate: new Date('2026-07-06T10:00:00Z'), endDate: new Date('2026-07-09T18:00:00Z'), notes: 'Apertura de flor el 6 de Julio.' },
      ],
    },
  ]

  for (const s of speciesData) {
    const species = await prisma.species.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        genusId: genus.id,
      },
      create: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        genusId: genus.id,
        isFeatured: true,
      },
    })
    console.log(`🌵 Especie/Cultivar listo: ${species.name}`)

    // Crear variante comercial inicial de maceta (precio 0, no disponible hasta que se le asigne precio)
    await prisma.productVariant.upsert({
      where: {
        speciesId_size: {
          speciesId: species.id,
          size: s.potSize,
        },
      },
      update: {},
      create: {
        speciesId: species.id,
        size: s.potSize,
        price: 0,
        quantity: 0,
        available: false,
      },
    })

    // Crear Plantas Físicas (Plantas Madres)
    for (let i = 0; i < s.plantCount; i++) {
      let plant = await prisma.plant.findFirst({
        where: {
          speciesId: species.id,
          currentSize: s.potSize,
          status: PlantStatus.MOTHER,
        },
      })

      if (!plant) {
        plant = await prisma.plant.create({
          data: {
            speciesId: species.id,
            currentSize: s.potSize,
            status: PlantStatus.MOTHER,
            locationId: location.id,
            pottingDate: s.pottingDate,
          },
        })
        console.log(`   📌 Planta Madre creada (ID: ${plant.id})`)
      }

      // Crear eventos de floración para la primera planta de la especie
      if (i === 0 && s.floweringEvents.length > 0) {
        for (const event of s.floweringEvents) {
          const existingEvent = await prisma.floweringEvent.findFirst({
            where: {
              plantId: plant.id,
              startDate: event.startDate,
            },
          })

          if (!existingEvent) {
            await prisma.floweringEvent.create({
              data: {
                plantId: plant.id,
                startDate: event.startDate,
                endDate: event.endDate,
                notes: event.notes,
              },
            })
            console.log(`   🌸 Floración registrada: ${event.startDate.toISOString().split('T')[0]}`)
          }
        }
      }
    }
  }

  console.log('✨ Siembra de Astrophytum completada con éxito!')
}

main()
  .catch((e) => {
    console.error('❌ Error en el script de siembra:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
