import crypto from 'crypto'
import { prisma } from '@/lib/db/prisma'

/**
 * Generate a unique license key in format: FF4A-9B2C-D8E1-7F3A-C5B9
 * - First segment starts with "FF" (Dumbbellflow prefix)
 * - Uses crypto-random generation for security
 * - Includes checksum in last segment for validation
 * - Total: 5 segments of 4 characters each (20 chars + 4 dashes)
 */
export async function generateLicenseKey(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const key = createLicenseKey()

    // Check if key already exists in database
    const existing = await prisma.user.findUnique({
      where: { licenseKey: key }
    })

    if (!existing) {
      return key
    }

    attempts++
  }

  throw new Error('Failed to generate unique license key after 10 attempts')
}

/**
 * Create a license key with crypto-random generation
 */
function createLicenseKey(): string {
  // Segment 1: FF prefix + 2 random chars
  const segment1 = 'FF' + generateRandomChars(2)

  // Segments 2-4: Random characters
  const segment2 = generateRandomChars(4)
  const segment3 = generateRandomChars(4)
  const segment4 = generateRandomChars(4)

  // Segment 5: Checksum
  const dataToHash = segment1 + segment2 + segment3 + segment4
  const segment5 = generateChecksum(dataToHash)

  return `${segment1}-${segment2}-${segment3}-${segment4}-${segment5}`
}

/**
 * Generate random alphanumeric characters (A-Z, 0-9)
 * Uses crypto.randomBytes for secure randomness
 */
function generateRandomChars(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar looking: I, O, 0, 1
  let result = ''

  // Generate extra bytes to account for filtering
  const bytes = crypto.randomBytes(length * 2)

  for (let i = 0; i < bytes.length && result.length < length; i++) {
    const index = bytes[i] % chars.length
    result += chars[index]
  }

  return result.substring(0, length)
}

/**
 * Generate 4-character checksum from input data
 * Uses SHA-256 hash
 */
function generateChecksum(data: string): string {
  const hash = crypto.createHash('sha256').update(data).digest('hex')
  // Take first 4 chars of hash and convert to uppercase alphanumeric
  return hash.substring(0, 4).toUpperCase()
}

/**
 * Verify checksum of a license key
 */
export function verifyChecksum(key: string): boolean {
  const parts = key.split('-')
  if (parts.length !== 5) return false

  const [seg1, seg2, seg3, seg4, seg5] = parts
  const dataToHash = seg1 + seg2 + seg3 + seg4
  const expectedChecksum = generateChecksum(dataToHash)

  return seg5 === expectedChecksum
}

