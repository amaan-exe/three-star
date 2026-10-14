import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreDb } from '@/lib/firebase/admin'
import { recordEvent } from '@/lib/firebase/db'
import { getSessionFromCookie } from '@/lib/session/cookie'
import { privateFeedbackSchema } from '@/lib/validation/schemas'
import { randomUUID } from 'crypto'

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
    const parsed = privateFeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid private feedback payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { category, message, contact_name, contact_value, contact_consent } = parsed.data
    const db = getFirestoreDb()
    const feedbackId = randomUUID()
    const now = new Date().toISOString()

    // 2. Insert into private_feedback collection in Firestore
    await db.collection('private_feedback').doc(feedbackId).set({
      id: feedbackId,
      session_id: id,
      business_id: cookie.business_id,
      category,
      message,
      contact_name: contact_name || null,
      contact_value: contact_value || null,
      contact_consent,
      created_at: now,
    })

    // 3. Record PRIVATE_FEEDBACK_SUBMITTED event in Firestore
    await recordEvent({
      session_id: id,
      business_id: cookie.business_id,
      campaign_id: cookie.campaign_id,
      event_type: 'PRIVATE_FEEDBACK_SUBMITTED',
      metadata: { category, has_contact: Boolean(contact_value) },
    })

    return NextResponse.json(
      { success: true, message: 'Private feedback received' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Private feedback error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
