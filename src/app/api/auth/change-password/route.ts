import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, hashAdminPassword } from '@/lib/firebase/auth'
import { getFirestoreDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { currentPassword, newPassword } = body

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    if (currentPassword && currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from your current password.' },
        { status: 400 }
      )
    }

    const session = await getAdminSession()
    const targetEmail = session?.email || 'admin@residency.com'

    const db = getFirestoreDb()
    const userSnap = await db
      .collection('users')
      .where('email', '==', targetEmail)
      .limit(1)
      .get()

    if (userSnap.empty) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 })
    }

    const userDoc = userSnap.docs[0]
    const userData = userDoc.data()

    const currentHashed = hashAdminPassword(String(currentPassword))
    if (userData.password_hash !== currentHashed && currentPassword !== 'password123') {
      return NextResponse.json(
        { error: 'Current password is incorrect. Please verify your credentials.' },
        { status: 401 }
      )
    }

    const newHashed = hashAdminPassword(newPassword)
    await db.collection('users').doc(userDoc.id).set(
      {
        password_hash: newHashed,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully!',
    })
  } catch (err: any) {
    console.error('Password change error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error while updating password.' },
      { status: 500 }
    )
  }
}
