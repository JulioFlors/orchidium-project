// src/actions/species/get-paginated-species.ts

'use server'

import type { PlantType } from '@/interfaces'

import prisma from '@package/database'

import { Logger } from '@/lib'

// 1. Interfaz de Opciones Adaptada
// Cambiamos 'gender' por 'plantType' para que coincida con tu lógica de negocio.
export interface PaginationOptions {
  page?: number
  take?: number
  plantType?: PlantType
}

export const getPaginatedSpeciesWithImages = async ({
  page = 1,
  take = 12,
  plantType,
}: PaginationOptions) => {
  // Validación de la página para evitar valores inválidos
  if (isNaN(Number(page))) page = 1
  if (page < 1) page = 1

  try {
    // 2. Construcción de la Condición de Filtro
    const whereCondition = {
      ...(plantType ? { genus: { type: plantType } } : {}),
    }

    // 3. Consulta Principal a la Base de Datos
    const species = await prisma.species.findMany({
      take: take,
      skip: (page - 1) * take,
      include: {
        // Incluimos las primeras 2 imágenes de cada especie
        images: {
          take: 2,
          select: {
            url: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        // Incluimos el género para poder mostrar su nombre
        genus: {
          select: {
            name: true,
            type: true,
          },
        },
        variants: true,
        // Cargar plantas físicas disponibles para la venta con sus eventos de floración activos
        plants: {
          where: {
            status: 'AVAILABLE',
          },
          select: {
            id: true,
            currentSize: true,
            FloweringEvent: {
              where: {
                endDate: null,
              },
              select: {
                id: true,
              },
              take: 1,
            },
          },
        },
      },
      // Aplicamos la condición de filtro
      where: whereCondition,
    })

    // 4. Obtener el Conteo Total para la Paginación
    // Es crucial usar el MISMO 'whereCondition' para que el conteo sea preciso.
    const totalCount = await prisma.species.count({
      where: whereCondition,
    })
    const totalPages = Math.ceil(totalCount / take)

    // 5. Devolver los Datos Formateados
    return {
      currentPage: page,
      totalPages: totalPages,
      // Mapeamos los resultados para aplanar la estructura de las imágenes y sincronizar stock real
      species: species.map((specie) => {
        const isFlowering = specie.plants.some(
          (p) => p.FloweringEvent && p.FloweringEvent.length > 0,
        )

        const updatedVariants = specie.variants.map((v) => {
          const realQty = specie.plants.filter((p) => p.currentSize === v.size).length

          return {
            ...v,
            quantity: realQty,
            available: realQty > 0,
          }
        })

        return {
          ...specie,
          images: specie.images.map((image) => image.url),
          variants: updatedVariants,
          isFlowering,
        }
      }),
    }
  } catch (error) {
    Logger.error('Error fetching paginated species:', error)
    throw new Error('No se pudieron cargar las especies.')
  }
}
