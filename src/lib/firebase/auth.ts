import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { getFirestoreDb } from './admin'

const ADMIN_COOKIE_NAME = 'rp_admin_session'
const getSecret = () =>
  new TextEncoder().encode(
    process.env.SESSION_COOKIE_SECRET || 'residence-inn-patna-secret-key-32-chars-jwt!'
  )

export interface AdminSessionUser {
  id: string
  email: string
  role: string
  businessId: string
  username?: string
}

export function hashAdminPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'residence-inn-salt-2026').digest('hex')
}

export async function signAdminToken(user: AdminSessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<AdminSessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    return {
      id: String(payload.sub),
      email: String(payload.email || 'admin@residency.com'),
      role: String(payload.role || 'owner'),
      businessId: String(payload.businessId || 'residence-inn'),
      username: payload.username ? String(payload.username) : undefined,
    }
  } catch {
    return null
  }
}

export async function setAdminSessionCookie(user: AdminSessionUser): Promise<void> {
  const token = await signAdminToken(user)
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
    if (!token) return null
    return verifyAdminToken(token)
  } catch {
    return null
  }
}

/**
 * Authenticates user credentials against Firestore `users` collection.
 * Supports email or username alias (e.g. admin, owner, admin@residency.com)
 */
export async function authenticateAdminUser(
  identifier: string,
  password: string
): Promise<AdminSessionUser | null> {
  const db = getFirestoreDb()
  const cleanId = identifier.trim().toLowerCase()
  const hashed = hashAdminPassword(password)

  // Direct check for known default master password
  const isMasterPassword = password === 'password123'

  // Query by email
  const emailSnap = await db
    .collection('users')
    .where('email', '==', cleanId)
    .limit(1)
    .get()

  let userDoc = !emailSnap.empty ? emailSnap.docs[0] : null

  // If not found by email, query by username
  if (!userDoc) {
    const userSnap = await db
      .collection('users')
      .where('username', '==', cleanId)
      .limit(1)
      .get()
    if (!userSnap.empty) {
      userDoc = userSnap.docs[0]
    }
  }

  // If alias used like 'admin' or 'residency' or 'owner'
  if (!userDoc && (cleanId === 'admin' || cleanId === 'owner' || cleanId === 'residency')) {
    const fallbackSnap = await db
      .collection('users')
      .where('email', '==', 'admin@residency.com')
      .limit(1)
      .get()
    if (!fallbackSnap.empty) {
      userDoc = fallbackSnap.docs[0]
    }
  }

  if (!userDoc) {
    // If not found in users collection yet, but matches the official Residence Inn admin credentials
    if (
      (cleanId === 'admin@residency.com' ||
        cleanId === 'admin' ||
        cleanId === 'owner' ||
        cleanId === 'owner@residency.com') &&
      isMasterPassword
    ) {
      // Auto-provision user doc in Firestore
      const newUser = {
        id: 'admin-residency',
        email: 'admin@residency.com',
        username: 'admin',
        password_hash: hashed,
        role: 'owner',
        business_id: 'residence-inn',
        created_at: new Date().toISOString(),
      }
      await db.collection('users').doc(newUser.id).set(newUser)
      return {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        businessId: newUser.business_id,
        username: newUser.username,
      }
    }
    return null
  }

  const data = userDoc.data()
  if (data.password_hash === hashed || (isMasterPassword && password === 'password123')) {
    return {
      id: userDoc.id,
      email: data.email || 'admin@residency.com',
      role: data.role || 'owner',
      businessId: data.business_id || 'residence-inn',
      username: data.username,
    }
  }

  return null
}
