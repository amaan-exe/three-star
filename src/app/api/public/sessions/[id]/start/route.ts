import { NextRequest, NextResponse } from 'next/server'
import { getSession, recordEvent } from '@/lib/firebase/db'
import { getFirestoreDb } from '@/lib/firebase/admin'
import { getSessionFromCookie } from '@/lib/session/cookie'

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

    // 2. Fetch session from Firestore
    const session = await getSession(id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // 3. If already in_progress or completed, return current status (idempotent)
    if (session.status !== 'landed') {
      return NextResponse.json({ success: true, status: session.status }, { status: 200 })
    }

    const now = new Date().toISOString()
    const db = getFirestoreDb()

    // 4. Update session status
    await db.collection('sessions').doc(id).set(
      {
        status: 'in_progress',
        started_at: now,
        last_activity_at: now,
      },
      { merge: true }
    )

    // 5. Fire QUIZ_STARTED event in Firestore
    await recordEvent({
      session_id: id,
      business_id: session.business_id,
      campaign_id: session.campaign_id,
      event_type: 'QUIZ_STARTED',
      metadata: {},
    })

    return NextResponse.json({ success: true, status: 'in_progress' }, { status: 200 })
  } catch (error) {
    console.error('Quiz start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
