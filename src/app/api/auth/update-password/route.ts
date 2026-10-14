import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, hashAdminPassword } from '@/lib/firebase/auth'
import { getFirestoreDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { newPassword } = body

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
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
      return NextResponse.json(
        { error: 'Your password recovery session has expired or is invalid.' },
        { status: 401 }
      )
    }

    const userDoc = userSnap.docs[0]
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
      message: 'Password updated successfully. You can now log in with your new password.',
    })
  } catch (err: any) {
    console.error('Update password error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error while resetting password.' },
      { status: 500 }
    )
  }
}
