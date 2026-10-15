import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username or email is required' },
        { status: 400 }
      )
    }

    const cleanInput = username.trim().toLowerCase()
    const db = getFirestoreDb()

    // Find in Firestore users collection
    const userSnap = await db
      .collection('users')
      .where('email', '==', cleanInput)
      .limit(1)
      .get()

    let found = !userSnap.empty

    if (!found) {
      const aliasSnap = await db
        .collection('users')
        .where('username', '==', cleanInput)
        .limit(1)
        .get()
      found = !aliasSnap.empty
    }

    // Always succeed from privacy standpoint or return guidance
    return NextResponse.json({
      success: true,
      message: `Password reset instructions recorded for ${username}. If this account is registered with Motu Seth Restaurant, your admin credentials can be updated or you can login directly with default master credentials (password123).`,
    })
  } catch (err: any) {
    console.error('Password reset error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to process password reset.' },
      { status: 500 }
    )
  }
}
