/**
 * Residence Inn Restaurant Authentication & Alias Helpers
 */

export const RESIDENCE_INN_PRIMARY_EMAIL = 'admin@residency.com'

const RESIDENCE_ALIASES = new Set([
  'admin',
  'owner',
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
 * to the registered Residence Inn admin email.
 */
export function resolveZaikaEmail(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (RESIDENCE_ALIASES.has(lower)) {
    return RESIDENCE_INN_PRIMARY_EMAIL
  }

  return trimmed
}
