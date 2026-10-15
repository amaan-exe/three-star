/**
 * Motu Seth Restaurant Authentication & Alias Helpers
 */

export const MOTU_SETH_PRIMARY_EMAIL = 'admin@motuseth.com'
export const RESIDENCE_INN_PRIMARY_EMAIL = 'admin@motuseth.com'

const MOTU_ALIASES = new Set([
  'admin',
  'owner',
  'motu',
  'motuseth',
  'motu-seth',
  'admin@motuseth.com',
  'owner@motuseth.com',
  'residency',
  'admin@residency.com',
  'owner@residency.com',
  'residence',
  'residenceinn',
  'residence-inn',
  'admin@residenceinn.com',
  'owner@residenceinn.com',
])

/**
 * Resolves any restaurant administrator alias or custom email
 * to the registered Motu Seth Restaurant admin email.
 */
export function resolveZaikaEmail(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (MOTU_ALIASES.has(lower)) {
    return MOTU_SETH_PRIMARY_EMAIL
  }

  return trimmed
}

