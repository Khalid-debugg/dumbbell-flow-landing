import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL) throw new Error('Missing env.SUPABASE_URL')
if (!process.env.SUPABASE_ANON_KEY) throw new Error('Missing env.SUPABASE_ANON_KEY')

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export function extractStoragePath(fileUrl: string): string | null {
  const parts = fileUrl.split('/backups/')
  return parts.length >= 2 ? parts[1] : null
}
