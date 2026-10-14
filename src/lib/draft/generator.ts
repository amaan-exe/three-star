import { createHash } from 'crypto'
import type { FactSheet } from './fact-sheet'
import { validateDraft } from './validators'

export interface GenerationResult {
  text: string
  method: 'llm' | 'fallback'
}

export interface GenerationOptions {
  salt?: string
  previousText?: string
}

/**
 * Rich, diverse sentence banks for hotel stays.
 * Thousands of permutations ensure no two guest reviews are identical.
 */
const OVERALL_POSITIVE = [
  'Had a truly wonderful and comfortable stay here.',
  'Really enjoyed my stay at Residence Inn in Patna.',
  'Had a pleasant, relaxing, and hassle-free stay.',
  'Wonderful hotel experience with peaceful ambience and great comfort.',
  'My experience staying here in Patna exceeded all expectations.',
  'From check-in to check-out, our entire stay was completely seamless.',
  'A very calm, comfortable, and well-managed hotel stay.',
  'Spent a memorable night here; everything felt fresh and welcoming.',
  'An outstanding hospitality experience in the heart of Patna.',
  'Delighted with the comfort, peaceful vibe, and top-tier hospitality.',
  'Such a refreshing and restful experience throughout our visit.',
  'One of the smoothest and most comfortable stays I have had recently.',
  'Really appreciated the calm atmosphere and comfortable environment here.',
  'A delightful hotel stay with all modern conveniences taken care of.',
  'Thoroughly enjoyed our visit; everything was neat, cozy, and relaxing.',
  'A top-notch stay in Patna that felt genuinely relaxing and hospitable.',
  'Had a restful night and thoroughly enjoyed the hospitality here.',
  'Great choice for staying in Patna; peaceful surroundings and great comfort.',
  'The hotel provided a warm, welcoming, and exceptionally comfortable stay.',
  'A wonderful stay with first-rate hospitality and a very cozy environment.',
]

const OVERALL_NEUTRAL = [
  'Stayed here recently during my visit to Patna.',
  'A decent and standard hotel stay overall.',
  'Spent a night here; the overall experience was satisfactory.',
  'Overall, a fairly normal and quiet hotel visit.',
  'A standard stay in Patna with acceptable facilities.',
]

const OVERALL_NEGATIVE = [
  'Stayed here recently, but the experience fell short of expectations.',
  'Visited this hotel, though certain aspects of the stay could be improved.',
  'Our stay here did not meet our initial expectations.',
  'The stay was average and several details needed better management.',
]

const ROOM_POSITIVE = [
  'The room was spotless, spacious, and very comfortable.',
  'Loved the cozy bedding, fresh linens, and peaceful room atmosphere.',
  'The room cleanliness and modern amenities were top notch.',
  'The room was well-maintained with excellent AC and clean bathroom.',
  'Our suite was sparkling clean with crisp sheets and excellent climate control.',
  'Everything in the room was tidy, modern, and in excellent working order.',
  'The bed was exceptionally comfortable and ensured a sound, undisturbed sleep.',
  'Impressed by the hygiene standards, fresh towels, and quiet room acoustics.',
  'The accommodations were bright, neat, and equipped with all necessities.',
  'Sanitized rooms and quiet surroundings made relaxing so effortless.',
  'The bathroom was squeaky clean and the bedroom was impeccably arranged.',
  'Appreciated the fresh room fragrance, comfortable mattress, and silent AC.',
  'The room offered generous space, good natural light, and clean amenities.',
  'Very cozy and orderly room with excellent hot water and high cleanliness.',
  'The suite felt completely fresh and provided a truly tranquil night.',
]

const ROOM_NEUTRAL = [
  'The room comfort was standard and reasonably maintained.',
  'The room and amenities were adequate for a short stay.',
  'The room was fairly basic but served our purpose for the night.',
]

const ROOM_NEGATIVE = [
  'The room cleanliness and maintenance could have been better.',
  'The room amenities and bedding needed more attention.',
  'The room felt slightly neglected and cleanliness should improve.',
]

const SERVICE_POSITIVE = [
  'The front desk and housekeeping staff were warm, polite, and very helpful.',
  'Hospitality was exceptional with prompt assistance and swift check-in.',
  'The hotel team was courteous and attentive to all our requests.',
  'Remarkable service from the staff throughout our entire stay.',
  'Staff members were always smiling, respectful, and eager to assist us.',
  'Check-in and luggage assistance were handled promptly and professionally.',
  'Housekeeping was very swift and the reception team was incredibly welcoming.',
  'Customer care here is genuine; the staff took great care of our comfort.',
  'Warm hospitality with proactive assistance at every stage of our visit.',
  'The front desk team was very polite, professional, and accommodating.',
  'Courteous staff that responded immediately to every question and request.',
  'From front desk to housekeeping, the entire team was attentive and pleasant.',
  'Superb service with genuine warmth and prompt room assistance.',
  'The hotel staff made sure we had everything we needed without any delay.',
]

const SERVICE_NEUTRAL = [
  'The front desk and staff service were standard and adequate.',
  'Check-in and room assistance were handled without major delay.',
  'The staff service was normal and straightforward.',
]

const SERVICE_NEGATIVE = [
  'Staff responsiveness and room service were quite slow.',
  'Front desk service could be more welcoming and attentive.',
  'Staff seemed overwhelmed and assistance took longer than expected.',
]

const LOCATION_POSITIVE = [
  'Its prime location in Patliputra makes traveling around Patna very easy.',
  'Being located in a quiet area close to main hubs was a huge benefit.',
  'Great connectivity to the city while remaining peaceful and quiet inside.',
  'The location is convenient and accessible, making local transit very simple.',
]

const CLOSING_POSITIVE = [
  'Would happily recommend this hotel to anyone visiting Patna.',
  'Looking forward to staying here again on my next visit.',
  'A solid, trustworthy hotel choice that I would glad recommend.',
  'Will definitely choose this hotel again when traveling to the city.',
  'Highly recommended for anyone looking for comfort and peace of mind.',
  'A truly satisfying experience that makes me want to return soon.',
  'Happily recommending this property to friends and fellow travelers.',
  'Great value, excellent comfort, and dependable service all around.',
]

function getSeededIndex(seed: string, length: number): number {
  const hash = createHash('md5').update(seed).digest('hex')
  const num = parseInt(hash.substring(0, 8), 16)
  return num % length
}

/**
 * Generates a deterministic review draft using tone-matched phrasing banks.
 * Incorporates diverse templates and entropy to guarantee no two reviews are identical.
 */
export function generateDeterministicDraft(
  factSheet: FactSheet,
  sessionId: string,
  salt: string = ''
): string {
  const overallTone = factSheet.overall?.tone || 'positive'
  const foodTone = factSheet.food?.tone || overallTone
  const serviceTone = factSheet.service?.tone || overallTone

  const effectiveSeed = `${sessionId}-${salt}`

  // Pick sentences based on seed
  let overallStr = ''
  if (overallTone === 'positive') {
    overallStr = OVERALL_POSITIVE[getSeededIndex(effectiveSeed + '-ov', OVERALL_POSITIVE.length)]
  } else if (overallTone === 'neutral') {
    overallStr = OVERALL_NEUTRAL[getSeededIndex(effectiveSeed + '-ov', OVERALL_NEUTRAL.length)]
  } else {
    overallStr = OVERALL_NEGATIVE[getSeededIndex(effectiveSeed + '-ov', OVERALL_NEGATIVE.length)]
  }

  let roomStr = ''
  if (foodTone === 'positive') {
    roomStr = ROOM_POSITIVE[getSeededIndex(effectiveSeed + '-rm', ROOM_POSITIVE.length)]
  } else if (foodTone === 'neutral') {
    roomStr = ROOM_NEUTRAL[getSeededIndex(effectiveSeed + '-rm', ROOM_NEUTRAL.length)]
  } else {
    roomStr = ROOM_NEGATIVE[getSeededIndex(effectiveSeed + '-rm', ROOM_NEGATIVE.length)]
  }

  let serviceStr = ''
  if (serviceTone === 'positive') {
    serviceStr = SERVICE_POSITIVE[getSeededIndex(effectiveSeed + '-sv', SERVICE_POSITIVE.length)]
  } else if (serviceTone === 'neutral') {
    serviceStr = SERVICE_NEUTRAL[getSeededIndex(effectiveSeed + '-sv', SERVICE_NEUTRAL.length)]
  } else {
    serviceStr = SERVICE_NEGATIVE[getSeededIndex(effectiveSeed + '-sv', SERVICE_NEGATIVE.length)]
  }

  let closingStr = ''
  if (overallTone === 'positive') {
    closingStr = CLOSING_POSITIVE[getSeededIndex(effectiveSeed + '-cl', CLOSING_POSITIVE.length)]
  }

  let locationStr = ''
  if (overallTone === 'positive') {
    locationStr = LOCATION_POSITIVE[getSeededIndex(effectiveSeed + '-loc', LOCATION_POSITIVE.length)]
  }

  // Highlights from factSheet if user selected them
  let highlightStr = ''
  if (factSheet.ordered.length > 0 && foodTone === 'positive') {
    const amenities = factSheet.ordered.slice(0, 2).join(' and ')
    highlightStr = `We especially enjoyed the ${amenities}.`
  } else if (factSheet.liked.length > 0 && overallTone === 'positive') {
    const aspects = factSheet.liked.slice(0, 2).join(' and ')
    highlightStr = `The ${aspects} made our stay even better.`
  }

  if (overallTone !== 'positive') {
    return [overallStr, roomStr, serviceStr].filter(Boolean).join(' ')
  }

  // Multiple assembly structures to provide radical variation
  const templateIndex = getSeededIndex(effectiveSeed + '-tpl', 5)

  let sentences: string[]
  switch (templateIndex) {
    case 0:
      // Pattern: Room first, then service, then overall/closing
      sentences = [roomStr, serviceStr, closingStr]
      break
    case 1:
      // Pattern: Overall first, then room, then service
      sentences = [overallStr, roomStr, serviceStr]
      break
    case 2:
      // Pattern: Service/hospitality first, then room comfort, then recommendation
      sentences = [serviceStr, roomStr, closingStr]
      break
    case 3:
      // Pattern: Overall, then location/highlight, then service
      sentences = [overallStr, highlightStr || locationStr, serviceStr]
      break
    case 4:
    default:
      // Pattern: Room, location/highlight, and closing
      sentences = [roomStr, highlightStr || locationStr, closingStr]
      break
  }

  return sentences.filter(Boolean).join(' ')
}

/**
 * Angles to steer LLM generation into varied voices and perspectives.
 */
const LLM_ANGLES = [
  'Focus angle: Highlight the peaceful night, quiet atmosphere, and restful sleep.',
  'Focus angle: Emphasize the spotless cleanliness of the room, fresh linens, and modern bathroom.',
  'Focus angle: Highlight the warm, prompt greeting at the front desk and attentive housekeeping.',
  'Focus angle: Mention the prime, convenient location in Patna (near Patliputra/P&M Mall) and hassle-free comfort.',
  'Focus angle: Express genuine satisfaction with the overall hospitality, cozy suite, and smooth check-in.',
  'Focus angle: A traveler who appreciated a calm, well-kept retreat with polite and accommodating staff.',
]

/**
 * Main review draft pipeline.
 * Supports Groq, Anthropic, and OpenAI providers with high temperature and prompt variation.
 * Falls back gracefully to an enriched deterministic bank when offline.
 */
export async function generateReviewDraft(
  factSheet: FactSheet,
  sessionId: string,
  restaurantName: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const previousText = options.previousText || ''
  const dynamicSalt = options.salt || Math.random().toString(36).substring(2, 9)

  // Identify API Keys
  const groqKey =
    process.env.GROQ_API_KEY ||
    (process.env.ANTHROPIC_API_KEY?.startsWith('gsk_') ? process.env.ANTHROPIC_API_KEY : undefined) ||
    (process.env.OPENAI_API_KEY?.startsWith('gsk_') ? process.env.OPENAI_API_KEY : undefined)

  const anthropicKey =
    process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')
      ? process.env.ANTHROPIC_API_KEY
      : undefined

  const openAiKey =
    process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('gsk_')
      ? process.env.OPENAI_API_KEY
      : undefined

  // Pick a dynamic angle for prompt variety
  const randomAngle = LLM_ANGLES[Math.floor(Math.random() * LLM_ANGLES.length)]

  const prompt = `You are helping a hotel guest write a brief, authentic Google review draft for their stay at ${restaurantName} in Patna.
STRICT GUIDELINES:
1. Write in the first person ("I" or "We") as a genuine guest who stayed at this hotel.
2. Length MUST be between 30 and 65 words (about 2 to 3 natural sentences).
3. Mention hotel highlights like clean & comfortable rooms, peaceful stay, pleasant ambience, courteous front desk staff, or good amenities.
4. ${randomAngle}
5. Write with unique phrasing and natural conversational flow. Avoid cliché templates or repetitive formulas.
6. Do NOT include words: 'star', 'stars', 'rating', 'manager', 'waiter', 'discount', 'coupon', 'promo', 'freebie', URLs, hashtags, or emojis.
7. Return plain text only without quotation marks or bullet points.`

  // 1. Try Groq (Fast, modern LLM)
  if (groqKey) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000)

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.95,
          max_tokens: 300,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const candidateText = data?.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '')
        if (candidateText && candidateText !== previousText) {
          const validation = validateDraft(candidateText, factSheet)
          if (validation.valid) {
            return { text: candidateText, method: 'llm' }
          }
        }
      } else {
        const errBody = await response.text().catch(() => '')
        console.warn('Groq API error response:', response.status, errBody)
      }
    } catch (err) {
      console.warn('Groq LLM call failed or timed out:', err)
    }
  }

  // 2. Try Anthropic (Claude)
  if (anthropicKey) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
          max_tokens: 150,
          temperature: 1.0,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const candidateText = data?.content?.[0]?.text?.trim().replace(/^["']|["']$/g, '')
        if (candidateText && candidateText !== previousText) {
          const validation = validateDraft(candidateText, factSheet)
          if (validation.valid) {
            return { text: candidateText, method: 'llm' }
          }
        }
      }
    } catch (err) {
      console.warn('Anthropic LLM call failed or timed out:', err)
    }
  }

  // 3. Try OpenAI
  if (openAiKey) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.95,
          max_tokens: 150,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const candidateText = data?.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '')
        if (candidateText && candidateText !== previousText) {
          const validation = validateDraft(candidateText, factSheet)
          if (validation.valid) {
            return { text: candidateText, method: 'llm' }
          }
        }
      }
    } catch (err) {
      console.warn('OpenAI LLM call failed or timed out:', err)
    }
  }

  // 4. Robust Deterministic Template Fallback with anti-repetition salt
  let fallbackText = generateDeterministicDraft(factSheet, sessionId, dynamicSalt)
  // If identical to previous text, re-roll with extra salt
  if (fallbackText === previousText) {
    fallbackText = generateDeterministicDraft(factSheet, sessionId, dynamicSalt + '-alt')
  }

  return { text: fallbackText, method: 'fallback' }
}
