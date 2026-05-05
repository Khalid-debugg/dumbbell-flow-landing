import { prisma } from '@/lib/db/prisma'

export async function createBackup(data: {
  userId: string
  deviceId: string
  deviceName: string
  fileName: string
  fileSize: number
  fileUrl: string
  checksum: string
}) {
  return prisma.backup.create({ data: { ...data, fileSize: BigInt(data.fileSize) } })
}

export async function listAllBackups(userId: string) {
  return prisma.backup.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      deviceId: true,
      deviceName: true,
      fileName: true,
      fileSize: true,
      checksum: true,
      createdAt: true,
    },
  })
}

export async function listBackupsByDevice(userId: string, deviceId: string) {
  return prisma.backup.findMany({
    where: { userId, deviceId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listBackupsPaginated(
  userId: string,
  deviceId: string | undefined,
  page: number,
  limit: number,
  sortOrder: 'asc' | 'desc'
) {
  const where = deviceId ? { userId, deviceId } : { userId }
  const [totalCount, backups] = await Promise.all([
    prisma.backup.count({ where }),
    prisma.backup.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return { totalCount, backups }
}

export async function findBackupByIdAndUser(id: string, userId: string) {
  return prisma.backup.findFirst({ where: { id, userId } })
}

export async function deleteBackup(id: string) {
  return prisma.backup.delete({ where: { id } })
}

export async function listDevicesWithBackups(userId: string) {
  return prisma.backup.findMany({
    where: { userId },
    select: { deviceId: true, deviceName: true },
    distinct: ['deviceId'],
  })
}

export async function deleteOldBackups(userId: string, deviceId: string, keepCount: number) {
  const all = await prisma.backup.findMany({
    where: { userId, deviceId },
    orderBy: { createdAt: 'desc' },
  })
  return all.slice(keepCount)
}

export async function getLatestBackupByDevice(userId: string, deviceId: string) {
  return prisma.backup.findFirst({
    where: { userId, deviceId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
}
