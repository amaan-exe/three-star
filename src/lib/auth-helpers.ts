/**
 * PM Zaika Restaurant Authentication & Alias Helpers
 */

export const PM_ZAIKA_PRIMARY_EMAIL = 'invincibleperson9@gmail.com'

const ZAIKA_ALIASES = new Set([
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
  'zaika',
  'pmzaika',
  'pm-zaika',
  'admin@pmzaika.com',
  'owner@pmzaika.com',
  'admin@pm-zaika.com',
  'owner@pm-zaika.com',
  'pmzaika@gmail.com',
  'pmzaikapatna@gmail.com',
  'biryani',
  'charminar',
])

/**
 * Resolves any restaurant administrator alias or custom email
 * to the registered Supabase Auth email.
 */
export function resolveZaikaEmail(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (ZAIKA_ALIASES.has(lower)) {
    return PM_ZAIKA_PRIMARY_EMAIL
  }

  return trimmed
}
