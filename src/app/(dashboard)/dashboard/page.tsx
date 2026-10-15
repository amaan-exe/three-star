import { getAdminSession } from '@/lib/firebase/auth'
import { getFirestoreDb } from '@/lib/firebase/admin'
import { getBusiness as getBizDoc, getAllMenuItems, getCampaigns } from '@/lib/firebase/db'
import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import DashboardWorkspace from '@/components/dashboard/DashboardWorkspace'
import type { AnalyticsData } from '@/components/dashboard/OverviewTab'
import type { ResponseItem } from '@/components/dashboard/ResponsesTab'
import type { CustomerDetail } from '@/components/dashboard/CustomersPortalTab'
import type { PrivateFeedbackItem } from '@/components/dashboard/FeedbackTab'

interface DashboardPageProps {
  searchParams: Promise<{ tab?: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { tab } = await searchParams
  const user = await getAdminSession()
  const db = getFirestoreDb()

  // 1. Fetch restaurant owned by user, or fall back to Motu Seth Restaurant
  const business = await getBizDoc(user?.businessId || 'motu-seth')

  if (!business) {
    return <OnboardingWizard />
  }

  // 2. Fetch campaigns
  const campaigns = await getCampaigns(business.id)

  // 3. Fetch all events for this business
  const eventsSnap = await db
    .collection('events')
    .where('business_id', '==', business.id)
    .get()
  const events = eventsSnap.docs.map((d) => d.data())

  // 4. Fetch all sessions for this business
  const sessionsSnap = await db
    .collection('sessions')
    .where('business_id', '==', business.id)
    .get()
  const sessions = sessionsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => ((b.created_at || '') > (a.created_at || '') ? 1 : -1))

  // 5. Fetch all answers for this business's sessions
  const sessionIds = sessions.map((s) => s.id)
  let answers: Array<{ session_id: string; question_key: string; value: any }> = []
  let drafts: Array<{ session_id: string; original_text: string | null; final_text: string | null }> = []

  if (sessionIds.length > 0) {
    // Firestore in-query supports up to 30 items per batch. We can batch if needed.
    const batches: string[][] = []
    for (let i = 0; i < sessionIds.length; i += 30) {
      batches.push(sessionIds.slice(i, i + 30))
    }

    for (const batch of batches) {
      const answersSnap = await db
        .collection('answers')
        .where('session_id', 'in', batch)
        .get()
      answers.push(...answersSnap.docs.map((d) => d.data() as any))

      const draftsSnap = await db
        .collection('review_drafts')
        .where('session_id', 'in', batch)
        .get()
      drafts.push(...draftsSnap.docs.map((d) => d.data() as any))
    }
  }

  // 6. Fetch private feedback
  const feedbackSnap = await db
    .collection('private_feedback')
    .where('business_id', '==', business.id)
    .get()
  const privateFeedbackData = feedbackSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => ((b.created_at || '') > (a.created_at || '') ? 1 : -1))

  // 7. Fetch menu items
  const menuItems = await getAllMenuItems(business.id)

  // Map menu item ID -> name
  const menuItemMap = new Map<string, string>()
  for (const m of menuItems) {
    const rawName = m.name as any
    const dishName =
      typeof rawName === 'string'
        ? rawName
        : rawName?.en || (typeof rawName === 'object' && rawName !== null ? Object.values(rawName)[0] : 'Menu item')
    menuItemMap.set(m.id, String(dishName))
  }

  // ========================================================
  // COMPUTE METRICS
  // ========================================================
  const allEvents = events || []
  const allSessions = sessions || []
  const completedSessions = allSessions.filter((s) => s.status === 'completed')

  // 1. Scans
  const scans = allEvents.filter((e) => e.event_type === 'QR_SCANNED').length
  // 2. Starts
  const starts = allEvents.filter((e) => e.event_type === 'QUIZ_STARTED').length
  // 3. Completions
  const completions = completedSessions.length

  // Rates
  const startRate = scans > 0 ? starts / scans : 0
  const completionRate = starts > 0 ? completions / starts : 0
  const scanToCompletionRate = scans > 0 ? completions / scans : 0

  // Google Clicks
  const googleClickSessions = new Set(
    allEvents.filter((e) => e.event_type === 'GOOGLE_CLICKED').map((e) => e.session_id)
  )
  const googleClicks = googleClickSessions.size
  const googleClickRate = completions > 0 ? googleClicks / completions : 0

  // Private feedback
  const privateFeedbackCount = privateFeedbackData.length
  const privateFeedbackRate = completions > 0 ? privateFeedbackCount / completions : 0

  // Ratings calculation
  const answersBySession = new Map<string, Map<string, any>>()
  for (const a of answers) {
    if (!answersBySession.has(a.session_id)) {
      answersBySession.set(a.session_id, new Map())
    }
    answersBySession.get(a.session_id)!.set(a.question_key, a.value)
  }

  let overallSum = 0
  let foodSum = 0
  let serviceSum = 0
  let ratedCount = 0

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const likedCounts: Record<string, number> = {}

  let lowOverallCount = 0
  let lowFoodCount = 0
  let lowServiceCount = 0

  for (const session of completedSessions) {
    const sAnswers = answersBySession.get(session.id)
    if (sAnswers) {
      const overall = sAnswers.get('overall_rating')
      const food = sAnswers.get('food_rating')
      const service = sAnswers.get('service_rating')
      const liked = sAnswers.get('liked')

      if (typeof overall === 'number') {
        overallSum += overall
        ratedCount++
        ratingDistribution[overall] = (ratingDistribution[overall] || 0) + 1
        if (overall <= 2) lowOverallCount++
      }
      if (typeof food === 'number') {
        foodSum += food
        if (food <= 2) lowFoodCount++
      }
      if (typeof service === 'number') {
        serviceSum += service
        if (service <= 2) lowServiceCount++
      }
      if (Array.isArray(liked)) {
        for (const l of liked) {
          likedCounts[l] = (likedCounts[l] || 0) + 1
        }
      }
    }
  }

  const avgOverall = ratedCount > 0 ? overallSum / ratedCount : null
  const avgFood = ratedCount > 0 ? foodSum / ratedCount : null
  const avgService = ratedCount > 0 ? serviceSum / ratedCount : null

  const lowRatingShare = {
    overall: ratedCount > 0 ? lowOverallCount / ratedCount : 0,
    food: ratedCount > 0 ? lowFoodCount / ratedCount : 0,
    service: ratedCount > 0 ? lowServiceCount / ratedCount : 0,
  }

  // Campaign stats table
  const campaignMap = new Map((campaigns || []).map((c) => [c.id, c]))
  const campaignStats = (campaigns || []).map((c) => {
    const cScans = allEvents.filter((e) => e.campaign_id === c.id && e.event_type === 'QR_SCANNED').length
    const cCompletions = completedSessions.filter((s) => s.campaign_id === c.id).length
    const cGoogleClicks = new Set(
      allEvents
        .filter((e) => e.campaign_id === c.id && e.event_type === 'GOOGLE_CLICKED')
        .map((e) => e.session_id)
    ).size

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      active: c.active,
      scans: cScans,
      completions: cCompletions,
      googleClicks: cGoogleClicks,
    }
  })

  const analytics: AnalyticsData = {
    scans,
    starts,
    completions,
    googleClicks,
    privateFeedbackCount,
    startRate,
    completionRate,
    scanToCompletionRate,
    googleClickRate,
    privateFeedbackRate,
    avgOverall,
    avgFood,
    avgService,
    totalRatedSessions: ratedCount,
    ratingDistribution,
    likedCounts,
    lowRatingShare,
    campaignStats,
  }

  // Map drafts
  const draftsBySession = new Map(drafts.map((d) => [d.session_id, d]))

  // Map responses
  const responses: ResponseItem[] = completedSessions.map((s) => {
    const sAnswers = answersBySession.get(s.id)
    const draft = draftsBySession.get(s.id)
    const cName = campaignMap.get(s.campaign_id)?.name || 'Dining Hall'

    const contactObj = sAnswers?.get('customer_contact')
    const phoneVal =
      sAnswers?.get('customer_phone') ||
      (typeof contactObj === 'object' ? contactObj?.phone : null) ||
      null
    const nameVal =
      sAnswers?.get('customer_name') ||
      (typeof contactObj === 'object' ? contactObj?.name : null) ||
      null

    const rawOrdered = sAnswers?.get('ordered') || []
    const orderedDishNames = Array.isArray(rawOrdered)
      ? rawOrdered.map((idOrName: string) => menuItemMap.get(idOrName) || idOrName)
      : []

    return {
      id: s.id,
      campaignName: cName,
      status: s.status,
      completedAt: s.completed_at || s.created_at,
      overallRating: sAnswers?.get('overall_rating') ?? null,
      foodRating: sAnswers?.get('food_rating') ?? null,
      serviceRating: sAnswers?.get('service_rating') ?? null,
      liked: sAnswers?.get('liked') ?? [],
      ordered: orderedDishNames,
      draftText: draft?.final_text || draft?.original_text || null,
      draftEdited: Boolean(draft?.final_text && draft.final_text !== draft.original_text),
      customerName: nameVal,
      customerPhone: phoneVal,
    }
  })

  // Map customers detail portal
  const customerDetails: CustomerDetail[] = completedSessions.map((s) => {
    const sAnswers = answersBySession.get(s.id)
    const draft = draftsBySession.get(s.id)
    const cName = campaignMap.get(s.campaign_id)?.name || 'Dining Hall'

    const contactObj = sAnswers?.get('customer_contact')
    const pf = privateFeedbackData.find((f) => (f as any).session_id === s.id)

    const phoneVal =
      sAnswers?.get('customer_phone') ||
      (typeof contactObj === 'object' ? contactObj?.phone : null) ||
      pf?.contact_value ||
      ''

    const nameVal =
      sAnswers?.get('customer_name') ||
      (typeof contactObj === 'object' ? contactObj?.name : null) ||
      pf?.contact_name ||
      ''

    const optIn = typeof contactObj === 'object' ? Boolean(contactObj?.optIn ?? true) : false

    const rawOrdered = sAnswers?.get('ordered') || []
    const orderedDishNames = Array.isArray(rawOrdered)
      ? rawOrdered.map((idOrName: string) => menuItemMap.get(idOrName) || idOrName)
      : []

    const googleClicked = allEvents.some(
      (e) => e.session_id === s.id && e.event_type === 'GOOGLE_CLICKED'
    )

    return {
      sessionId: s.id,
      name: nameVal,
      phone: phoneVal,
      hasPhone: Boolean(phoneVal),
      optInMarketing: optIn,
      overallRating: sAnswers?.get('overall_rating') ?? null,
      foodRating: sAnswers?.get('food_rating') ?? null,
      serviceRating: sAnswers?.get('service_rating') ?? null,
      orderedDishes: orderedDishNames,
      likedAspects: sAnswers?.get('liked') || [],
      draftText: draft?.final_text || draft?.original_text || null,
      googleClicked,
      campaignName: cName,
      respondedAt: s.completed_at || s.created_at,
      privateFeedbackMessage: pf?.message || null,
      status: s.status,
    }
  })

  // Map private feedback
  const feedbackList: PrivateFeedbackItem[] = privateFeedbackData.map((f) => ({
    id: f.id,
    category: f.category,
    message: f.message,
    contactName: f.contact_name,
    contactValue: f.contact_value,
    contactConsent: Boolean(f.contact_consent),
    createdAt: f.created_at,
  }))

  return (
    <DashboardWorkspace
      initialTab={tab}
      business={{
        id: business.id,
        name: business.name,
        location: business.location || null,
        phone: business.phone || '6201699943',
        secondaryPhone: business.secondary_phone || '6201699943',
        googleReviewUrl: business.google_review_url || null,
        welcomeMessage: business.welcome_message || null,
        primaryColor: business.primary_color || '#d97706',
      }}
      campaigns={campaigns}
      analytics={analytics}
      responses={responses}
      customers={customerDetails}
      feedbackList={feedbackList}
      menuItems={menuItems}
      userEmail={user?.email || 'admin@residency.com'}
    />
  )
}
