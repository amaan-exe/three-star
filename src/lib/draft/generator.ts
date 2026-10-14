import { createHash } from 'crypto'
import type { FactSheet } from './fact-sheet'
import { validateDraft } from './validators'

export interface GenerationResult {
  text: string
  method: 'llm' | 'fallback'
}

/**
 * Deterministic sentence banks seeded by session_id to satisfy CG-7 (anti-repetition) for hotel stays.
 */
const OVERALL_POSITIVE = [
  'Had a truly wonderful and comfortable stay here.',
  'Really enjoyed my stay at Residence Inn in Patna.',
  'Had a pleasant, relaxing, and hassle-free stay.',
  'Wonderful hotel experience with peaceful ambience and great comfort.',
]

const OVERALL_NEUTRAL = [
  'Stayed here recently during my visit to Patna.',
  'A decent and standard hotel stay overall.',
  'Spent a night here; the overall experience was satisfactory.',
]

const OVERALL_NEGATIVE = [
  'Stayed here recently, but the experience fell short of expectations.',
  'Visited this hotel, though certain aspects of the stay could be improved.',
  'Our stay here did not meet our initial expectations.',
]

const FOOD_POSITIVE = [
  'The room was spotless, spacious, and very comfortable.',
  'Loved the cozy bedding, fresh linens, and peaceful room atmosphere.',
  'The room cleanliness and modern amenities were top notch.',
  'The room was well-maintained with excellent AC and clean bathroom.',
]

const FOOD_NEUTRAL = [
  'The room comfort was standard and reasonably maintained.',
  'The room and amenities were adequate for a short stay.',
]

const FOOD_NEGATIVE = [
  'The room cleanliness and maintenance could have been better.',
  'The room amenities and bedding needed more attention.',
]

const SERVICE_POSITIVE = [
  'The front desk and housekeeping staff were warm, polite, and very helpful.',
  'Hospitality was exceptional with prompt assistance and swift check-in.',
  'The hotel team was courteous and attentive to all our requests.',
  'Remarkable service from the staff throughout our entire stay.',
]

const SERVICE_NEUTRAL = [
  'The front desk and staff service were standard and adequate.',
  'Check-in and room assistance were handled without major delay.',
]

const SERVICE_NEGATIVE = [
  'Staff responsiveness and room service were quite slow.',
  'Front desk service could be more welcoming and attentive.',
]

function getSeededIndex(seed: string, length: number): number {
  const hash = createHash('md5').update(seed).digest('hex')
  const num = parseInt(hash.substring(0, 8), 16)
  return num % length
}

/**
 * Generates a deterministic review draft using tone-matched phrasing banks.
 */
export function generateDeterministicDraft(factSheet: FactSheet, sessionId: string): string {
  const sentences: string[] = []

  // 1. Overall Sentence
  const overallTone = factSheet.overall?.tone || 'positive'
  if (overallTone === 'positive') {
    sentences.push(OVERALL_POSITIVE[getSeededIndex(sessionId + '-ov', OVERALL_POSITIVE.length)])
  } else if (overallTone === 'neutral') {
    sentences.push(OVERALL_NEUTRAL[getSeededIndex(sessionId + '-ov', OVERALL_NEUTRAL.length)])
  } else {
    sentences.push(OVERALL_NEGATIVE[getSeededIndex(sessionId + '-ov', OVERALL_NEGATIVE.length)])
  }

  // 2. Room & Cleanliness Sentence (mapped to food question key)
  const foodTone = factSheet.food?.tone || 'positive'
  if (foodTone === 'positive') {
    sentences.push(FOOD_POSITIVE[getSeededIndex(sessionId + '-fd', FOOD_POSITIVE.length)])
  } else if (foodTone === 'neutral') {
    sentences.push(FOOD_NEUTRAL[getSeededIndex(sessionId + '-fd', FOOD_NEUTRAL.length)])
  } else {
    sentences.push(FOOD_NEGATIVE[getSeededIndex(sessionId + '-fd', FOOD_NEGATIVE.length)])
  }

  // 3. Room type / amenities enjoyed or compliments liked
  if (factSheet.ordered.length > 0 && foodTone === 'positive') {
    const amenities = factSheet.ordered.slice(0, 2).join(' and ')
    sentences.push(`We especially enjoyed the ${amenities}.`)
  } else if (factSheet.liked.length > 0 && overallTone === 'positive') {
    const aspects = factSheet.liked.slice(0, 2).join(' and ')
    sentences.push(`The ${aspects} made our stay even better.`)
  }

  // 4. Hospitality & Staff Service Sentence
  const serviceTone = factSheet.service?.tone || 'positive'
  if (serviceTone === 'positive') {
    sentences.push(SERVICE_POSITIVE[getSeededIndex(sessionId + '-sv', SERVICE_POSITIVE.length)])
  } else if (serviceTone === 'neutral') {
    sentences.push(SERVICE_NEUTRAL[getSeededIndex(sessionId + '-sv', SERVICE_NEUTRAL.length)])
  } else {
    sentences.push(SERVICE_NEGATIVE[getSeededIndex(sessionId + '-sv', SERVICE_NEGATIVE.length)])
  }

  return sentences.join(' ')
}

/**
 * Main review draft pipeline.
 * Tries LLM if API key is provided, verifies against validators, and falls back gracefully.
 */
export async function generateReviewDraft(
  factSheet: FactSheet,
  sessionId: string,
  restaurantName: string
): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (apiKey) {
    try {
      // 8s timeout controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const prompt = `You are helping a hotel guest write a brief, authentic Google review draft for their stay at ${restaurantName}.
STRICT RULES:
1. Write in the first person ("I" / "We") as a guest who stayed at this hotel.
2. Length MUST be between 30 and 70 words.
3. Mention hotel highlights like comfortable & clean rooms, courteous staff, peaceful stay, and amenities.
4. Use ONLY facts from this Fact Sheet:
${JSON.stringify(factSheet, null, 2)}
5. Preserve sentiment: negative ratings MUST sound polite but dissatisfied; positive ratings must sound pleased.
6. Do NOT include staff names, prices, promotional offers, discounts, star ratings (e.g. "5 stars"), URLs, or hashtags.
7. Return plain text only without markdown formatting or quotation marks.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const candidateText = data?.content?.[0]?.text?.trim()
        if (candidateText) {
          const validation = validateDraft(candidateText, factSheet)
          if (validation.valid) {
            return { text: candidateText, method: 'llm' }
          }
        }
      }
    } catch (err) {
      console.warn('LLM draft generation failed or timed out, using deterministic fallback:', err)
    }
  }

  // Graceful deterministic template fallback
  const fallbackText = generateDeterministicDraft(factSheet, sessionId)
  return { text: fallbackText, method: 'fallback' }
}
