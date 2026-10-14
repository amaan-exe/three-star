import { NextRequest, NextResponse } from 'next/server'
import { recordEvent, getSession } from '@/lib/firebase/db'
import { getSessionFromCookie } from '@/lib/session/cookie'
import { clientEventSchema } from '@/lib/validation/schemas'

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params

    // 1. Verify session cookie
    const cookie = await getSessionFromCookie()
    if (!cookie || cookie.session_id !== id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = clientEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { event_type, client_event_id, metadata } = parsed.data

    // 2. Insert event in Firestore
    await recordEvent({
      session_id: id,
      business_id: cookie.business_id,
      campaign_id: cookie.campaign_id,
      event_type,
      client_event_id,
      metadata: metadata as any,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
