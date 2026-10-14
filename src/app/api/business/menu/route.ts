import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/firebase/auth'
import { getFirestoreDb } from '@/lib/firebase/admin'
import { randomUUID } from 'crypto'
import { z } from 'zod'

const addDishSchema = z.object({
  name: z.string().min(1).max(100),
})

const patchDishSchema = z.object({
  id: z.string(),
  active: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const businessId = user.businessId || 'residence-inn'
    const body = await request.json().catch(() => ({}))
    const parsed = addDishSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid dish name' }, { status: 400 })

    const { name } = parsed.data
    const db = getFirestoreDb()
    const id = randomUUID()
    const now = new Date().toISOString()

    const newDish = {
      id,
      business_id: businessId,
      name: { en: name },
      active: true,
      position: Date.now(),
      created_at: now,
    }

    await db.collection('menu_items').doc(id).set(newDish)

    return NextResponse.json(newDish, { status: 201 })
  } catch (error) {
    console.error('Add menu item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAdminSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const parsed = patchDishSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const { id, active } = parsed.data
    const db = getFirestoreDb()

    await db.collection('menu_items').doc(id).set({ active }, { merge: true })

    const doc = await db.collection('menu_items').doc(id).get()
    return NextResponse.json({ id, ...doc.data() }, { status: 200 })
  } catch (error) {
    console.error('Update menu item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAdminSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing dish id' }, { status: 400 })

    const db = getFirestoreDb()
    await db.collection('menu_items').doc(id).delete()

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete menu item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
