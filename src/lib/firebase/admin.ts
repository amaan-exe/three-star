import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'
import fs from 'fs'
import path from 'path'

let app: App | null = null
let db: Firestore | null = null
let auth: Auth | null = null

function getServiceAccount(): any {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    } catch {
      // ignore
    }
  }

  const localFile = path.resolve(process.cwd(), 'firebase-service-account.json')
  if (fs.existsSync(localFile)) {
    try {
      return JSON.parse(fs.readFileSync(localFile, 'utf8'))
    } catch {
      // ignore
    }
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }

  throw new Error('Firebase service account credentials missing')
}

export function getFirebaseApp(): App {
  if (!app) {
    const existing = getApps()
    if (existing.length > 0) {
      app = existing[0]
    } else {
      const sa = getServiceAccount()
      app = initializeApp({
        credential: cert(sa),
        projectId: sa.project_id || sa.projectId || 'star-e7eb0',
      })
    }
  }
  return app
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
    try {
      db.settings({ ignoreUndefinedProperties: true })
    } catch {
      // settings already applied
    }
  }
  return db
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}
