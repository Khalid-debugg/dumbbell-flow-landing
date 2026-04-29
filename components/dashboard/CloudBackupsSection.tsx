'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Cloud,
  Download,
  Trash2,
  HardDrive,
  Clock,
  RefreshCw,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown
} from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { formatDate, formatFileSize } from '@/lib/utils/format'

interface CloudBackup {
  id: string
  deviceId: string
  deviceName: string
  fileName: string
  fileSize: number
  checksum: string
  createdAt: string
  isCurrentDevice: boolean
}

interface Device {
  deviceId: string
  deviceName: string
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface CloudBackupsSectionProps {
  licenseKey: string
}

export function CloudBackupsSection({ licenseKey }: CloudBackupsSectionProps) {
  const t = useTranslations('dashboard')
  const [backups, setBackups] = useState<CloudBackup[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Filter and sort states
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const loadBackups = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/backups/web-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, page, limit: 5, deviceId: selectedDeviceId, sortOrder }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setBackups(result.data.backups)
        setPagination(result.data.pagination)
        setDevices(result.data.devices || [])
      } else {
        setError(result.message || 'Failed to load backups')
      }
    } catch (err) {
      console.error('Failed to load backups:', err)
      setError('Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBackups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseKey, page, selectedDeviceId, sortOrder])

  const handleDelete = async (backupId: string) => {
    setDeleting(backupId)
    try {
      const response = await fetch('/api/backups/web-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, backupId }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Backup deleted successfully')
        await loadBackups()
      } else {
        toast.error(result.message || 'Failed to delete backup')
      }
    } catch (err) {
      console.error('Failed to delete backup:', err)
      toast.error('Failed to delete backup')
    } finally {
      setDeleting(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleDeviceFilterChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    setPage(1) // Reset to first page when filter changes
  }

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
    setPage(1) // Reset to first page when sort changes
  }

  const handleDownload = async (backup: CloudBackup) => {
    setDownloading(backup.id)
    try {
      const response = await fetch('/api/backups/web-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, backupId: backup.id }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = backup.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const result = await response.json()
        toast.error(result.message || 'Failed to download backup')
      }
    } catch (err) {
      console.error('Failed to download backup:', err)
      toast.error('Failed to download backup')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:800ms]">
      <div className="rounded-2xl bg-card border border-border p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">
                {t('cloudBackups.title')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t('cloudBackups.description')}
              </p>
            </div>
          </div>
          <button
            onClick={loadBackups}
            disabled={loading}
            className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-all disabled:opacity-50"
            aria-label="Refresh backups"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters and Sort */}
        {!loading && !error && (
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{t('cloudBackups.filter.device')}</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => handleDeviceFilterChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t('cloudBackups.filter.allDevices')}</option>
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.deviceName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{t('cloudBackups.sort.label')}</span>
              <button
                onClick={handleSortToggle}
                className="px-3 py-1.5 rounded-lg bg-background border border-border text-sm hover:bg-muted transition-colors"
              >
                {sortOrder === 'desc' ? t('cloudBackups.sort.newestFirst') : t('cloudBackups.sort.oldestFirst')}
              </button>
            </div>

            <div className="ml-auto text-sm text-muted-foreground">
              {t('cloudBackups.totalCount', { count: pagination.totalCount })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex p-6 rounded-full bg-muted/50 mb-4">
              <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />
            </div>
            <p className="text-muted-foreground text-lg">
              {t('cloudBackups.loading')}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-flex p-6 rounded-full bg-destructive/10 mb-4">
              <Cloud className="h-12 w-12 text-destructive" />
            </div>
            <p className="text-destructive text-lg mb-2">
              {t('cloudBackups.error')}
            </p>
            <button
              onClick={loadBackups}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
            >
              {t('cloudBackups.tryAgain')}
            </button>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex p-6 rounded-full bg-muted/50 mb-4">
              <HardDrive className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">
              {t('cloudBackups.noBackups')}
            </p>
            <p className="text-muted-foreground text-sm">
              {t('cloudBackups.noBackupsDesc')}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="group relative overflow-hidden rounded-xl bg-muted/30 border border-border p-5 transition-all hover:bg-muted/50 hover:border-blue-500/30 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-background border border-border text-foreground group-hover:text-blue-600 group-hover:border-blue-500/30 transition-colors">
                      <PlatformIcon platform={backup.deviceName} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {backup.fileName}
                        </h3>
                        {backup.isCurrentDevice && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20 flex-shrink-0">
                            {t('cloudBackups.thisDevice')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          <span className="truncate">{backup.deviceName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          <span>{formatFileSize(backup.fileSize)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(backup.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownload(backup)}
                        disabled={downloading === backup.id}
                        className="p-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('cloudBackups.download')}
                      >
                        {downloading === backup.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(backup.id)}
                        disabled={deleting === backup.id}
                        className="p-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('cloudBackups.delete')}
                      >
                        {deleting === backup.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Decorative gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {t('cloudBackups.pagination.pageOf', { current: pagination.page, total: pagination.totalPages })}
                </div>
                <div className="flex items-center gap-2" dir='ltr'>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('cloudBackups.pagination.previous')}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-1" >
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          pageNum === pagination.page
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('cloudBackups.pagination.next')}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
