import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionAnswers, getMenuItems, recordEvent, getBusiness } from '@/lib/firebase/db'
import { getFirestoreDb } from '@/lib/firebase/admin'
import { buildFactSheet } from '@/lib/draft/fact-sheet'
import { generateReviewDraft } from '@/lib/draft/generator'
import { logEvent } from '@/lib/observability/logger'
import { z } from 'zod'

interface RouteProps {
  params: Promise<{ id: string }>
}

const patchDraftSchema = z.object({
  final_text: z.string().min(1).max(2000),
})

export async function POST(request: NextRequest, { params }: RouteProps) {
  const startTime = Date.now()
  try {
    const { id } = await params
    const db = getFirestoreDb()

    // 1. Fetch session from Firestore
    const session = await getSession(id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // 2. Idempotency: Return existing draft if already generated in Firestore
    const existingDraftDoc = await db.collection('review_drafts').doc(id).get()
    if (existingDraftDoc.exists) {
      const data = existingDraftDoc.data()
      if (data?.original_text) {
        return NextResponse.json(data, { status: 200 })
      }
    }

    // 3. Retrieve answers and menu items to build Fact Sheet
    const answersObj = await getSessionAnswers(id)
    const answersList = Object.entries(answersObj).map(([k, v]) => ({ question_key: k, value: v }))

    const menuItems = await getMenuItems(session.business_id)
    const menuItemNames: Record<string, string> = {}
    for (const item of menuItems) {
      const name = typeof item.name === 'string' ? item.name : (item.name as any)?.en || 'Specialty dish'
      menuItemNames[item.id] = name
    }

    const factSheet = buildFactSheet(answersList, menuItemNames)
    const biz = await getBusiness(session.business_id)
    const restaurantName = biz?.name || 'Residence Inn'

    // 4. Generate review draft
    const generated = await generateReviewDraft(factSheet, id, restaurantName)

    const now = new Date().toISOString()
    const draftRecord = {
      id,
      session_id: id,
      original_text: generated.text,
      final_text: generated.text,
      method: generated.method,
      created_at: now,
      updated_at: now,
    }

    // 5. Save to Firestore review_drafts
    await db.collection('review_drafts').doc(id).set(draftRecord, { merge: true })

    // 6. Fire DRAFT_GENERATED event in Firestore
    await recordEvent({
      session_id: id,
      business_id: session.business_id,
      campaign_id: session.campaign_id,
      event_type: 'DRAFT_GENERATED',
      metadata: { method: generated.method },
    })

    logEvent({
      sessionId: id,
      businessId: session.business_id,
      action: 'DRAFT_GENERATED',
      latencyMs: Date.now() - startTime,
      metadata: { method: generated.method, length: generated.text.length },
    })

    return NextResponse.json(
      {
        original_text: generated.text,
        final_text: generated.text,
        method: generated.method,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Draft API error:', error)
    logEvent({
      level: 'error',
      action: 'DRAFT_GENERATION_FAILED',
      latencyMs: Date.now() - startTime,
      metadata: { error: String(error) },
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const parsed = patchDraftSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid draft update payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { final_text } = parsed.data
    const db = getFirestoreDb()

    // Update final_text in Firestore
    await db.collection('review_drafts').doc(id).set(
      {
        final_text,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    )

    return NextResponse.json({ success: true, final_text }, { status: 200 })
  } catch (error) {
    console.error('Draft update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
