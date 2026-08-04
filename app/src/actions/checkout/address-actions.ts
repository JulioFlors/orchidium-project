'use server'

import { prisma } from '@package/database'
import { revalidatePath } from 'next/cache'

export interface UserAddressInput {
  name: string
  idNumber: string
  address: string
  city: string
  state: string
  zipCode?: string
  phone: string
  isDefault?: boolean
}

export async function getUserAddresses(userId: string) {
  try {
    const addresses = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return { ok: true, addresses }
  } catch (error) {
    return { ok: false, message: 'Error al obtener direcciones.', error }
  }
}

export async function createUserAddress(userId: string, data: UserAddressInput) {
  try {
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      })
    }

    const count = await prisma.userAddress.count({ where: { userId } })

    const address = await prisma.userAddress.create({
      data: {
        userId,
        name: data.name,
        idNumber: data.idNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        isDefault: data.isDefault || count === 0,
      },
    })

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')

    return { ok: true, address }
  } catch (error) {
    return { ok: false, message: 'Error al crear la dirección.', error }
  }
}

export async function updateUserAddress(id: string, userId: string, data: UserAddressInput) {
  try {
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      })
    }

    const address = await prisma.userAddress.update({
      where: { id },
      data: {
        name: data.name,
        idNumber: data.idNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        isDefault: data.isDefault,
      },
    })

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')

    return { ok: true, address }
  } catch (error) {
    return { ok: false, message: 'Error al actualizar la dirección.', error }
  }
}

export async function deleteUserAddress(id: string, userId: string) {
  try {
    await prisma.userAddress.delete({
      where: { id, userId },
    })

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')

    return { ok: true }
  } catch (error) {
    return { ok: false, message: 'Error al eliminar la dirección.', error }
  }
}

export async function setDefaultUserAddress(id: string, userId: string) {
  try {
    await prisma.userAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    })

    const address = await prisma.userAddress.update({
      where: { id },
      data: { isDefault: true },
    })

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')

    return { ok: true, address }
  } catch (error) {
    return { ok: false, message: 'Error al establecer dirección predeterminada.', error }
  }
}
