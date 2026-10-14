import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/firebase/auth'
import { getFirestoreDb } from '@/lib/firebase/admin'
import { getBusiness } from '@/lib/firebase/db'
import { businessCreateSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = businessCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid business data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const db = getFirestoreDb()
    const data = parsed.data
    const businessId = user.businessId || 'residence-inn'
    const now = new Date().toISOString()

    const updateDoc = {
      name: data.name,
      location: data.location || null,
      phone: data.phone || null,
      secondary_phone: data.secondary_phone || null,
      timezone: data.timezone,
      logo_url: data.logo_url || null,
      primary_color: data.primary_color || null,
      welcome_message: data.welcome_message || null,
      google_review_url: data.google_review_url || null,
      updated_at: now,
    }

    await db.collection('businesses').doc(businessId).set(updateDoc, { merge: true })

    return NextResponse.json({ success: true, business_id: businessId }, { status: 200 })
  } catch (error) {
    console.error('Business API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
