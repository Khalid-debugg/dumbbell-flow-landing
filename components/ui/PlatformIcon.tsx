import { Monitor, Laptop, Smartphone } from 'lucide-react'

interface PlatformIconProps {
  platform: string
  className?: string
}

export function PlatformIcon({ platform, className = 'h-5 w-5' }: PlatformIconProps) {
  const p = platform.toLowerCase()
  if (p === 'windows' || p === 'win32' || p === 'linux') return <Monitor className={className} />
  if (p === 'mac' || p === 'darwin') return <Laptop className={className} />
  return <Smartphone className={className} />
}
