import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

export async function findActiveDevice(userId: string, deviceId: string) {
  return prisma.activatedDevice.findFirst({
    where: { userId, deviceId, isActive: true },
  })
}

export async function touchDevice(id: string) {
  return prisma.activatedDevice.update({
    where: { id },
    data: { lastValidatedAt: new Date() },
  })
}

export async function reactivateDevice(
  id: string,
  data: { deviceName?: string | null; platform: string; appVersion: string }
) {
  return prisma.activatedDevice.update({
    where: { id },
    data: { isActive: true, lastValidatedAt: new Date(), ...data },
  })
}

export async function createDevice(data: {
  userId: string
  deviceId: string
  deviceName?: string | null
  platform: string
  appVersion: string
}) {
  return prisma.activatedDevice.create({
    data: {
      id: crypto.randomUUID(),
      isActive: true,
      ...data,
    },
  })
}

export async function deactivateDevice(id: string) {
  return prisma.activatedDevice.update({
    where: { id },
    data: { isActive: false },
  })
}

export async function countActiveDevices(userId: string) {
  return prisma.activatedDevice.count({ where: { userId, isActive: true } })
}
