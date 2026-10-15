import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdminUser, signAdminToken } from '@/lib/firebase/auth'

const ADMIN_COOKIE_NAME = 'rp_admin_session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateAdminUser(String(username), String(password))

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password. For Motu Seth admin, use admin@motuseth.com or admin with your access key.' },
        { status: 401 }
      )
    }

    const token = await signAdminToken(user)

    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
    })

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (err: any) {
    console.error('Server login error:', err)
    return NextResponse.json(
      { error: err?.message || 'Login failed. Please check your credentials.' },
      { status: 500 }
    )
  }
}
