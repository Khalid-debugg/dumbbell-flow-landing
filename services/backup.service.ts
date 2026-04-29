import { createHash } from 'crypto'
import { supabase, extractStoragePath } from '@/lib/storage/supabase'
import { findUserWithDevicesByLicenseKey } from '@/repositories/user.repository'
import {
  createBackup,
  listAllBackups,
  listBackupsByDevice,
  listBackupsPaginated,
  findBackupByIdAndUser,
  deleteBackup,
  listDevicesWithBackups,
  deleteOldBackups,
} from '@/repositories/backup.repository'

export class BackupServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'BackupServiceError'
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_BACKUPS_PER_DEVICE = 10

async function resolveAuthorizedUser(licenseKey: string, deviceId: string) {
  const user = await findUserWithDevicesByLicenseKey(licenseKey, deviceId)
  if (!user)
    throw new BackupServiceError('Invalid license key', 'INVALID_KEY', 401)
  if (!user.ActivatedDevice[0])
    throw new BackupServiceError('Device not activated with this license', 'DEVICE_NOT_FOUND', 403)
  return user
}

export async function uploadBackup(params: {
  licenseKey: string
  deviceId: string
  deviceName?: string | null
  fileName: string
  file: File
}) {
  const { licenseKey, deviceId, deviceName, fileName, file } = params

  if (file.size > MAX_FILE_SIZE)
    throw new BackupServiceError('File size exceeds 50MB limit', 'FILE_TOO_LARGE', 413)

  const user = await resolveAuthorizedUser(licenseKey, deviceId)
  const device = user.ActivatedDevice[0]

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const checksum = createHash('sha256').update(buffer).digest('hex')

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const uniqueFileName = `${Date.now()}-${sanitizedFileName}`
  const storagePath = `${user.id}/${deviceId}/${uniqueFileName}`

  const { error: uploadError } = await supabase.storage
    .from('backups')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError)
    throw new BackupServiceError('Failed to upload backup to storage', 'STORAGE_ERROR', 500)

  const { data: urlData } = supabase.storage.from('backups').getPublicUrl(storagePath)

  const backup = await createBackup({
    userId: user.id,
    deviceId,
    deviceName: deviceName || device.deviceName || 'Unknown Device',
    fileName: sanitizedFileName,
    fileSize: file.size,
    fileUrl: urlData.publicUrl,
    checksum,
  })

  const oldBackups = await deleteOldBackups(user.id, deviceId, MAX_BACKUPS_PER_DEVICE)
  for (const old of oldBackups) {
    const path = extractStoragePath(old.fileUrl)
    if (path) await supabase.storage.from('backups').remove([path])
    await deleteBackup(old.id)
  }

  return backup
}

export async function listBackups(licenseKey: string, deviceId: string) {
  const user = await resolveAuthorizedUser(licenseKey, deviceId)
  const backups = await listAllBackups(user.id)
  return backups.map((b) => ({ ...b, createdAt: b.createdAt.toISOString(), isCurrentDevice: b.deviceId === deviceId }))
}

export async function downloadBackup(licenseKey: string, deviceId: string, backupId: string) {
  const user = await resolveAuthorizedUser(licenseKey, deviceId)

  const backup = await findBackupByIdAndUser(backupId, user.id)
  if (!backup) throw new BackupServiceError('Backup not found', 'NOT_FOUND', 404)

  const storagePath = extractStoragePath(backup.fileUrl)
  if (!storagePath) throw new BackupServiceError('Invalid backup file URL', 'STORAGE_ERROR', 500)

  const { data: fileData, error } = await supabase.storage.from('backups').download(storagePath)
  if (error || !fileData)
    throw new BackupServiceError('Failed to download backup from storage', 'STORAGE_ERROR', 500)

  const buffer = Buffer.from(await fileData.arrayBuffer())
  return { buffer, fileName: backup.fileName }
}

export async function deleteBackupById(licenseKey: string, deviceId: string, backupId: string) {
  const user = await resolveAuthorizedUser(licenseKey, deviceId)

  const backup = await findBackupByIdAndUser(backupId, user.id)
  if (!backup) throw new BackupServiceError('Backup not found', 'NOT_FOUND', 404)

  const storagePath = extractStoragePath(backup.fileUrl)
  if (storagePath) await supabase.storage.from('backups').remove([storagePath])

  await deleteBackup(backup.id)
}

export async function listWebBackups(
  licenseKey: string,
  page: number,
  limit: number,
  deviceId?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const user = await findUserWithDevicesByLicenseKey(licenseKey)
  if (!user) throw new BackupServiceError('Invalid license key', 'INVALID_KEY', 403)

  const filter = deviceId && deviceId !== 'all' ? deviceId : undefined
  const { totalCount, backups } = await listBackupsPaginated(user.id, filter, page, limit, sortOrder)
  const deviceList = await listDevicesWithBackups(user.id)
  const totalPages = Math.ceil(totalCount / limit)

  return {
    backups: backups.map((b) => ({
      id: b.id,
      deviceId: b.deviceId,
      deviceName: b.deviceName || 'Unknown Device',
      fileName: b.fileName,
      fileSize: b.fileSize,
      checksum: b.checksum,
      createdAt: b.createdAt.toISOString(),
      isCurrentDevice: false,
    })),
    pagination: { page, limit, totalCount, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    devices: deviceList.map((d) => ({ deviceId: d.deviceId, deviceName: d.deviceName || 'Unknown Device' })),
  }
}

export async function downloadWebBackup(licenseKey: string, backupId: string) {
  const user = await findUserWithDevicesByLicenseKey(licenseKey)
  if (!user) throw new BackupServiceError('Invalid license key', 'INVALID_KEY', 403)

  const backup = await findBackupByIdAndUser(backupId, user.id)
  if (!backup) throw new BackupServiceError('Backup not found', 'NOT_FOUND', 404)

  const storagePath = extractStoragePath(backup.fileUrl)
  if (!storagePath) throw new BackupServiceError('Invalid backup file URL', 'STORAGE_ERROR', 500)

  const { data: fileData, error } = await supabase.storage.from('backups').download(storagePath)
  if (error || !fileData)
    throw new BackupServiceError('Failed to download backup from storage', 'STORAGE_ERROR', 500)

  const buffer = Buffer.from(await fileData.arrayBuffer())
  return { buffer, fileName: backup.fileName }
}

export async function deleteWebBackup(licenseKey: string, backupId: string) {
  const user = await findUserWithDevicesByLicenseKey(licenseKey)
  if (!user) throw new BackupServiceError('Invalid license key', 'INVALID_KEY', 403)

  const backup = await findBackupByIdAndUser(backupId, user.id)
  if (!backup) throw new BackupServiceError('Backup not found', 'NOT_FOUND', 404)

  const storagePath = extractStoragePath(backup.fileUrl)
  if (storagePath) await supabase.storage.from('backups').remove([storagePath])

  await deleteBackup(backup.id)
}
