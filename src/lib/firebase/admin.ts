import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'
import fs from 'fs'
import path from 'path'

let app: App | null = null
let db: Firestore | null = null
let auth: Auth | null = null

// Embedded production service account fallback for Vercel deployment
const DEFAULT_SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'star-e7eb0',
  private_key_id: '21de2fce960ca082ac7ecb0c3f8f7c9f1e785997',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCy9SUp14XpOpHE\n7RnoPgTHIEDH9X6VpNkAEGsv4BA5LaJL9JsqixWeXBYkqhZjk6Q0KpPRyHj9ewOx\noam8hMsPSQgZYUMX1eVkDIB08Y6Uvny3+GPO0eoW+XMrJa7xwWrSVF+Fwcs3wngF\ncwv6NnI0dMm4L0sqPVxfx4VIRYIhyI4Wcv4YUDHhxSsj2Ip48VixUx39l7Iv9gqM\nNL8ExgX1UY8Tb2xL0+6bmMTKyiNf/5extrauJsC/RJZby6xvqkhvnZIvYqtWzXas\nmtWiBeTwB9yAl9UWaOEzmtLIGMWmMj7/u9t71mwVM8eOe+XXY87EmDaJsOb/5Kha\nnzZc2JkFAgMBAAECggEAElOfmC7dpFpepjufzRRY2emYKMIf0gRdQq/rwi3gi3J8\nbenhYBR5RMvqapvOiikLBlqb475zgYXxBWZoYwl4YBrbDPpUbCL4CGxtVUyNjPcK\n/64czofZwLuQC0mjJlfn8B064RBNFus/7lLvVZLw1CVnqQiS2oMJLDfbEuEnZ/0d\nezz7lZUVMe5jexk5CG87Btr0I7hqy5l2tK704hlmtH5IUTPmf6dJc53IU2kjn2Ud\n8n97ERFQM245c2I6So7moGGANQeHikYa6aCw6Pwc6ZYl1MA/ACLuR9rJBmj7t2/F\ntK7IIggQL79sEVQwprR7s8gg3ZU6zimICPmGNmT5wQKBgQDlEPcDV9CJRukp3FaX\nE/2N0C8etSNrkeB9rHuaJswxP2mGMenOvzFyGci80IjOHXD7BFeOKXpRBteDlzvv\na1AYTBgELh3/uius32/6gYSbTxc6VcTmwrdp9U/hPDCCtlPmOHaV+vEHr30+cMxo\nj4j4GIOCC1eTlrsh+VMFHXIWZQKBgQDH/+Dp92F5/jhQyjezDzIZ8peNlvhsYQGv\nWZrCm3sgLnWXpw8J6baG2P/sKeDxdM1OjhPmEgm0wDXO1ISJXBz18Kvsd1UWpmQk\nLG1DKBg+jzhTyUnB5O1arpqNt7IXx9tAcc+CsVmRpIf9EAUy1B9UJ3ZiiMIq3k6c\np9d8OMZ+IQKBgQCyFqZ0qukuUTslmHCZtKkEgD6iGSIYl6l5C4htKIzIHQzlkBi+\n7FZ85x7x7Q7vcGROQ+nuVMEMDc2wOPwX/86dlUt2tIQONaePF4fvspJuTOc6K0SS\nRABlGJup+Smd9jL0YiGQKTELUJyG1xuUj0Nl32keycKktCN5HmY1K9dvIQKBgGcP\nIOwPcOh3Krfe7ELV4sBiNNxeXlciycZ9CvWbPyA/MJNcH7DBATCNo5sjnWlvAdin\n9/MHen7syQ1yj3VkxPuq8Dzi5TLNvS6ywf7oK04ZaTIruFk0yWaAMN40OY5tizqz\nKvYyw2/8c6Lg3Xzqt9Yam7N8u2lxstqg1raJXydhAoGBAM8e+XBRTQJSixOcEy3\np0oaMkYxTT92tzAUKCV9wVCVYGv/ngA+g8ifzHGoSJ1Ax62od6uAB1MQ8DyCfZkD1\nzc0TwLgpP7wsj1VNvDquHMaeyWnZIMLdMHm0cnFFQb/8bEqnSCRJsN2h0G4s2eCY\nnc/W5F5Q1RZ57/v8Lt+y/gml\n-----END PRIVATE KEY-----\n',
  client_email: 'firebase-adminsdk-fbsvc@star-e7eb0.iam.gserviceaccount.com',
  client_id: '111474078220378571904',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40star-e7eb0.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
}

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

  // Fallback to embedded service account so serverless functions never crash
  return DEFAULT_SERVICE_ACCOUNT
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
