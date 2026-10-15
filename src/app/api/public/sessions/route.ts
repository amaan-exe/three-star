import { NextRequest, NextResponse } from 'next/server'
import { getCampaignBySlug, getSession, createSession, recordEvent } from '@/lib/firebase/db'
import { getSessionFromCookie, setSessionCookie } from '@/lib/session/cookie'
import { hashIp, hashUserAgent } from '@/lib/utils/hash'
import { slugSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

const createSessionSchema = z.object({
  slug: slugSchema.optional(),
  campaign_id: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = createSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid campaign identifier', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const targetSlug = parsed.data.slug || parsed.data.campaign_id || 'motu-seth'

    // 1. Look up campaign & business from Firestore
    const { campaign, business } = await getCampaignBySlug(targetSlug)

    if (!campaign || !business) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!campaign.active) {
      return NextResponse.json({ error: 'Campaign is inactive' }, { status: 410 })
    }

    // 2. Check for existing active session from cookie
    const existingCookie = await getSessionFromCookie()
    if (existingCookie && existingCookie.campaign_id === campaign.id) {
      const existingSession = await getSession(existingCookie.session_id)
      if (existingSession && existingSession.status !== 'completed') {
        return NextResponse.json(
          {
            session_id: existingSession.id,
            business_name: business.name,
            logo_url: business.logo_url || null,
            primary_color: business.primary_color || '#d97706',
            welcome_message: business.welcome_message,
            google_review_url_exists: Boolean(business.google_review_url),
          },
          { status: 200 }
        )
      }
    }

    // 3. Extract and hash client metadata
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const ua = request.headers.get('user-agent')

    // 4. Create new session in Firestore
    const newSession = await createSession({
      campaign_id: campaign.id,
      business_id: campaign.business_id,
      ip_hash: hashIp(ip) || undefined,
      ua_hash: hashUserAgent(ua) || undefined,
    })

    // 5. Set signed session cookie
    await setSessionCookie({
      session_id: newSession.id,
      campaign_id: campaign.id,
      business_id: campaign.business_id,
    })

    // 6. Log QR_SCANNED and LANDING_VIEWED events in Firestore
    await recordEvent({
      session_id: newSession.id,
      business_id: campaign.business_id,
      campaign_id: campaign.id,
      event_type: 'QR_SCANNED',
      metadata: { slug: targetSlug },
    })

    await recordEvent({
      session_id: newSession.id,
      business_id: campaign.business_id,
      campaign_id: campaign.id,
      event_type: 'LANDING_VIEWED',
      metadata: {},
    })

    return NextResponse.json(
      {
        session_id: newSession.id,
        business_name: business.name,
        logo_url: business.logo_url || null,
        primary_color: business.primary_color || '#d97706',
        welcome_message: business.welcome_message,
        google_review_url_exists: Boolean(business.google_review_url),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
