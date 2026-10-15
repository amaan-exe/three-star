import { getFirestoreDb } from './admin'
import { randomUUID } from 'crypto'

export interface BusinessDoc {
  id: string
  name: string
  unit?: string | null
  category?: string
  location?: string | null
  phone?: string | null
  secondary_phone?: string | null
  gst_number?: string | null
  fssai_number?: string | null
  timezone?: string
  primary_color?: string | null
  logo_url?: string | null
  welcome_message?: Record<string, string> | null
  google_review_url?: string | null
  place_id?: string | null
  owner_id?: string
  owner_email?: string
  default_language?: string
  created_at?: string
  updated_at?: string
}

export interface CampaignDoc {
  id: string
  business_id: string
  name: string
  slug: string
  active: boolean
  google_review_url_override?: string | null
  created_at: string
  updated_at?: string
}

export interface MenuItemDoc {
  id: string
  business_id: string
  name: string | { en: string; [key: string]: string }
  active: boolean
  position: number
  created_at?: string
}

export interface QuestionDoc {
  id: string
  business_id: string
  key: string
  type: string
  text: { en: string; [key: string]: string }
  position: number
  created_at?: string
}

export interface SessionDoc {
  id: string
  campaign_id: string
  business_id: string
  status: 'landed' | 'in_progress' | 'completed' | 'abandoned'
  ip_hash?: string
  ua_hash?: string
  created_at: string
  started_at?: string | null
  completed_at?: string | null
  last_activity_at: string
}

export interface AnswerDoc {
  id: string
  session_id: string
  question_id?: string
  question_key: string
  value: any
  created_at: string
  updated_at?: string
}

export interface ReviewDraftDoc {
  id: string
  session_id: string
  original_text: string
  final_text: string
  method: string
  created_at: string
  updated_at?: string
}

export interface EventDoc {
  id: string
  session_id: string
  business_id: string
  campaign_id?: string
  event_type: string
  client_event_id?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface PrivateFeedbackDoc {
  id: string
  session_id: string
  business_id: string
  category: string
  message: string
  contact_name?: string | null
  contact_value?: string | null
  contact_consent: boolean
  created_at: string
}

/**
 * Get the active business or create the Motu Seth Restaurant profile if not present.
 */
export async function getBusiness(businessId = 'motu-seth'): Promise<BusinessDoc> {
  const db = getFirestoreDb()
  const targetId = businessId === 'residence-inn' ? 'motu-seth' : businessId
  let doc = await db.collection('businesses').doc(targetId).get()

  if (!doc.exists && businessId === 'residence-inn') {
    doc = await db.collection('businesses').doc('residence-inn').get()
  }

  if (doc.exists) {
    return { id: doc.id, ...(doc.data() as any) }
  }

  // Fallback to first business in collection
  const allBiz = await db.collection('businesses').limit(1).get()
  if (!allBiz.empty) {
    const first = allBiz.docs[0]
    return { id: first.id, ...(first.data() as any) }
  }

  // Create default Motu Seth Restaurant profile
  const now = new Date().toISOString()
  const defaultBiz: BusinessDoc = {
    id: 'motu-seth',
    name: 'Motu Seth Restaurant',
    unit: 'A Unit Of Muskan Brothers Hospitality',
    category: 'restaurant',
    location:
      '4th Floor, Ishwar Arcade, Service Rd, Bailey Rd, near Raj Palace, S. K. Puram, Danapur, Patna, Bihar 801503, India',
    place_id: 'ChIJA-ShB09W7TkRdmS5DCofbiw',
    phone: '7631996611',
    secondary_phone: '7631996611',
    gst_number: '10ABCFM1572E1ZW',
    fssai_number: '10421000000533',
    timezone: 'Asia/Kolkata',
    primary_color: '#d97706',
    welcome_message: {
      en: 'Welcome to Motu Seth Restaurant! Share your honest dining experience with us in 30 seconds. For helpline & orders call 7631996611.',
    },
    google_review_url:
      'https://search.google.com/local/writereview?placeid=ChIJA-ShB09W7TkRdmS5DCofbiw',
    owner_id: 'owner-motu-seth',
    owner_email: 'admin@motuseth.com',
    default_language: 'en',
    created_at: now,
    updated_at: now,
  }
  await db.collection('businesses').doc(defaultBiz.id).set(defaultBiz)
  return defaultBiz
}

/**
 * Get campaign by slug with graceful fallbacks
 */
export async function getCampaignBySlug(slug: string): Promise<{
  campaign: CampaignDoc | null
  business: BusinessDoc | null
}> {
  const db = getFirestoreDb()

  // 1. Direct query by slug
  let snap = await db.collection('campaigns').where('slug', '==', slug).limit(1).get()

  // 2. Fallback to doc ID matching slug
  if (snap.empty) {
    const directDoc = await db.collection('campaigns').doc(slug).get()
    if (directDoc.exists) {
      const c = { id: directDoc.id, ...(directDoc.data() as any) } as CampaignDoc
      const b = await getBusiness(c.business_id)
      return { campaign: c, business: b }
    }
  }

  // 3. Fallback to any active campaign
  if (snap.empty) {
    snap = await db.collection('campaigns').where('active', '==', true).limit(1).get()
  }

  if (snap.empty) {
    // If no campaign exists at all, auto-create the motu-seth campaign
    const biz = await getBusiness()
    const now = new Date().toISOString()
    const defaultCampaign: CampaignDoc = {
      id: 'motu-seth',
      business_id: biz.id,
      name: 'Main Dining Table QR',
      slug: 'motu-seth',
      active: true,
      created_at: now,
    }
    await db.collection('campaigns').doc(defaultCampaign.id).set(defaultCampaign)
    return { campaign: defaultCampaign, business: biz }
  }

  const campaign = { id: snap.docs[0].id, ...(snap.docs[0].data() as any) } as CampaignDoc
  const business = await getBusiness(campaign.business_id)

  return { campaign, business }
}

/**
 * Get active menu items for a business
 */
export async function getMenuItems(businessId: string): Promise<MenuItemDoc[]> {
  const db = getFirestoreDb()
  const snap = await db
    .collection('menu_items')
    .where('business_id', '==', businessId)
    .where('active', '==', true)
    .get()

  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as MenuItemDoc))
  items.sort((a, b) => (a.position || 0) - (b.position || 0))
  return items
}

/**
 * Get all menu items for management
 */
export async function getAllMenuItems(businessId: string): Promise<MenuItemDoc[]> {
  const db = getFirestoreDb()
  const snap = await db.collection('menu_items').where('business_id', '==', businessId).get()
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as MenuItemDoc))
  items.sort((a, b) => (a.position || 0) - (b.position || 0))
  return items
}

/**
 * Get all campaigns for a business
 */
export async function getCampaigns(businessId: string): Promise<CampaignDoc[]> {
  const db = getFirestoreDb()
  const snap = await db.collection('campaigns').where('business_id', '==', businessId).get()
  const campaigns = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      created_at: data.created_at || new Date().toISOString(),
    } as CampaignDoc
  })
  campaigns.sort((a, b) => ((b.created_at || '') > (a.created_at || '') ? 1 : -1))
  return campaigns
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<SessionDoc | null> {
  const db = getFirestoreDb()
  const doc = await db.collection('sessions').doc(sessionId).get()
  if (!doc.exists) return null
  return { id: doc.id, ...(doc.data() as any) } as SessionDoc
}

/**
 * Create a new guest session
 */
export async function createSession(data: {
  campaign_id: string
  business_id: string
  ip_hash?: string
  ua_hash?: string
}): Promise<SessionDoc> {
  const db = getFirestoreDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  const session: SessionDoc = {
    id,
    campaign_id: data.campaign_id,
    business_id: data.business_id,
    status: 'landed',
    ip_hash: data.ip_hash || '',
    ua_hash: data.ua_hash || '',
    created_at: now,
    last_activity_at: now,
  }
  await db.collection('sessions').doc(id).set(session)
  return session
}

/**
 * Log an event in Firestore
 */
export async function recordEvent(data: {
  session_id: string
  business_id: string
  campaign_id?: string
  event_type: string
  client_event_id?: string
  metadata?: Record<string, any>
}): Promise<void> {
  const db = getFirestoreDb()
  const id = data.client_event_id ? `${data.session_id}_${data.client_event_id}` : randomUUID()
  const now = new Date().toISOString()
  await db
    .collection('events')
    .doc(id)
    .set({
      id,
      session_id: data.session_id,
      business_id: data.business_id,
      campaign_id: data.campaign_id || null,
      event_type: data.event_type,
      client_event_id: data.client_event_id || null,
      metadata: data.metadata || {},
      created_at: now,
    })
}

/**
 * Get all answers for a session
 */
export async function getSessionAnswers(sessionId: string): Promise<Record<string, any>> {
  const db = getFirestoreDb()
  const snap = await db.collection('answers').where('session_id', '==', sessionId).get()
  const answers: Record<string, any> = {}
  snap.docs.forEach((doc) => {
    const data = doc.data()
    answers[data.question_key] = data.value
  })
  return answers
}

/**
 * Save an answer for a session
 */
export async function saveAnswer(
  sessionId: string,
  questionKey: string,
  value: any,
  businessId?: string
): Promise<void> {
  const db = getFirestoreDb()
  const docId = `${sessionId}_${questionKey}`
  const now = new Date().toISOString()

  await db.collection('answers').doc(docId).set(
    {
      id: docId,
      session_id: sessionId,
      question_key: questionKey,
      value,
      updated_at: now,
      created_at: now,
    },
    { merge: true }
  )

  await db.collection('sessions').doc(sessionId).set(
    {
      last_activity_at: now,
    },
    { merge: true }
  )
}
