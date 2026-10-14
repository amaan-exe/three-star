import { isbot } from 'isbot'
import { NextResponse, type NextRequest } from 'next/server'

export function botFilterMiddleware(_request: NextRequest): NextResponse | null {
  // Allow all guest survey requests and link unfurlers to load cleanly
  return null
}
