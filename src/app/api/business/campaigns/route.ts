import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/firebase/auth'
import { getFirestoreDb } from '@/lib/firebase/admin'
import { campaignCreateSchema } from '@/lib/validation/schemas'
import { generateRandomSlug } from '@/lib/utils/slug'
import { randomUUID } from 'crypto'
import { z } from 'zod'

const patchCampaignSchema = z.object({
  id: z.string(),
  active: z.boolean().optional(),
  name: z.string().min(1).max(200).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = user.businessId || 'motu-seth'
    const body = await request.json().catch(() => ({}))
    const parsed = campaignCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid campaign data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, slug } = parsed.data
    const campaignSlug = slug || generateRandomSlug(8)
    const db = getFirestoreDb()

    // Check slug collision
    const existingSnap = await db.collection('campaigns').where('slug', '==', campaignSlug).get()
    if (!existingSnap.empty) {
      return NextResponse.json({ error: 'A campaign with this slug already exists' }, { status: 409 })
    }

    const id = campaignSlug
    const now = new Date().toISOString()
    const newCampaign = {
      id,
      business_id: businessId,
      name,
      slug: campaignSlug,
      active: true,
      created_at: now,
    }

    await db.collection('campaigns').doc(id).set(newCampaign)

    return NextResponse.json(newCampaign, { status: 201 })
  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAdminSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = patchCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { id, active, name } = parsed.data
    const db = getFirestoreDb()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (active !== undefined) updateData.active = active
    if (name !== undefined) updateData.name = name

    await db.collection('campaigns').doc(id).set(updateData, { merge: true })

    const updatedDoc = await db.collection('campaigns').doc(id).get()
    return NextResponse.json({ id, ...updatedDoc.data() }, { status: 200 })
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAdminSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 })
    }

    const db = getFirestoreDb()
    await db.collection('campaigns').doc(id).delete()

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Campaign deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
