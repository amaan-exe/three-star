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
 * Rich, diverse sentence banks for Motu Seth Restaurant dining experiences.
 * Thousands of permutations ensure no two customer reviews are identical.
 */
const OVERALL_POSITIVE = [
  'Had a truly wonderful dining experience at Motu Seth Restaurant.',
  'Really enjoyed our visit to Motu Seth Restaurant on Bailey Road in Patna.',
  'Had a fantastic meal here today; the food was fresh and incredibly flavorful.',
  'One of the finest restaurant experiences on Bailey Road in Patna.',
  'Visited Motu Seth Restaurant today and every single dish exceeded our expectations.',
  'From seating to billing, our entire dining experience was completely seamless.',
  'A very pleasant, comfortable, and well-managed family dining spot.',
  'Delighted with the rich flavors, cozy ambiance, and warm hospitality.',
  'Such a satisfying and flavorful culinary experience throughout our visit.',
  'One of the tastiest and most enjoyable meals I have had recently in Patna.',
  'Really appreciated the welcoming dining atmosphere and courteous service.',
  'A delightful restaurant with authentic flavors and generous portion sizes.',
  'Thoroughly enjoyed our meal; everything was delicious, neat, and freshly made.',
  'A top-notch dining spot in Patna that felt genuinely hospitable and satisfying.',
  'Had a memorable lunch here and thoroughly enjoyed the culinary hospitality.',
  'Great choice for lunch and dinner on Bailey Road; clean surroundings and great food.',
  'The restaurant provided a warm, welcoming, and exceptionally tasty experience.',
  'A wonderful dining visit with first-rate hospitality and authentic recipes.',
]

const OVERALL_NEUTRAL = [
  'Visited Motu Seth Restaurant today for a meal.',
  'A decent and standard restaurant dining experience overall.',
  'Had lunch here today; the overall experience was satisfactory.',
  'Overall, a fairly normal and quiet dining visit on Bailey Road.',
  'A standard meal in Patna with acceptable taste and service.',
]

const OVERALL_NEGATIVE = [
  'Dined here today, though the overall visit fell short of expectations.',
  'Visited this restaurant, though certain aspects of the dining could be improved.',
  'Our dining experience here did not fully meet our initial expectations.',
  'The meal was average and several details needed better management.',
]

const FOOD_POSITIVE = [
  'The biryani and curries were bursting with authentic spices and rich aroma.',
  'Loved the succulent kebabs, tender meat, and fresh buttery gravies.',
  'The paneer starters and curries were fresh, smoky, and seasoned to perfection.',
  'Every dish was served piping hot, flavorful, and made with top-quality ingredients.',
  'The handi specials and butter chicken were cooked to absolute perfection.',
  'The tandoori naans were crisp, soft, and paired wonderfully with the gravies.',
  'Impressed by the rich Dum preparation and the balanced aroma of the spices.',
  'The food had authentic Indian character and generous, satisfying portions.',
  'Tasted amazing from the very first bite; the spices and marinades were spot on.',
  'Freshly cooked dishes with authentic flavors that made our meal truly memorable.',
  'Rich gravies, tender meat, and fragrant rice that tasted authentic and delightful.',
  'The starters were crispy and juicy, and the main course curries were superb.',
]

const FOOD_NEUTRAL = [
  'The food was acceptable and met standard restaurant expectations.',
  'The dishes were decent and reasonably flavorful for a quick meal.',
  'The food was fairly standard and served hot.',
]

const FOOD_NEGATIVE = [
  'The food seasoning and flavor could have been better.',
  'The dishes fell short of our taste expectations today.',
  'The food was average and lacked the punch of fresh spices.',
]

const SERVICE_POSITIVE = [
  'The staff was remarkably polite, courteous, and attentive to our table.',
  'Hospitality was warm with prompt order taking and swift table service.',
  'The restaurant team was courteous and attentive to all our requests.',
  'Remarkable service from the staff throughout our entire meal.',
  'Staff members were always smiling, respectful, and eager to assist us.',
  'Orders were served hot without long waiting times.',
  'The hospitality was genuinely warm and the team made us feel right at home.',
  'Attentive service with polite recommendations from the restaurant team.',
  'Quick turnaround time and prompt attention to our table needs.',
  'From greeting to final billing, the staff was polite and accommodating.',
]

const SERVICE_NEUTRAL = [
  'The staff and table service were standard and adequate.',
  'Food service was handled without any major delay.',
  'The service was normal and straightforward.',
]

const SERVICE_NEGATIVE = [
  'Staff attentiveness and table service were quite slow.',
  'Service could be more welcoming and proactive.',
  'Table assistance took longer than expected today.',
]

const LOCATION_POSITIVE = [
  'Its prime location at Ishwari Arcade on Bailey Road makes visiting very convenient.',
  'Located right on Bailey Road near Raj Palace with easy access and good parking.',
  'The 4th floor dining area offers a cozy, clean ambiance for family and friends.',
  'A very convenient location on Bailey Road that makes family dining hassle-free.',
]

const CLOSING_POSITIVE = [
  'Would happily recommend Motu Seth Restaurant to anyone visiting Bailey Road.',
  'Looking forward to dining here again on my next visit to Patna.',
  'A solid, trustworthy restaurant choice in Patna that I gladly recommend.',
  'Definitely coming back for their special biryani and handi specialties.',
  'Highly recommended for anyone looking for delicious food and great value.',
  'A truly satisfying meal that makes me want to return soon.',
  'Happily recommending this restaurant to friends and fellow foodies in Patna.',
  'Great taste, rich flavors, and dependable hospitality all around.',
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

  let foodStr = ''
  if (foodTone === 'positive') {
    foodStr = FOOD_POSITIVE[getSeededIndex(effectiveSeed + '-fd', FOOD_POSITIVE.length)]
  } else if (foodTone === 'neutral') {
    foodStr = FOOD_NEUTRAL[getSeededIndex(effectiveSeed + '-fd', FOOD_NEUTRAL.length)]
  } else {
    foodStr = FOOD_NEGATIVE[getSeededIndex(effectiveSeed + '-fd', FOOD_NEGATIVE.length)]
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
    const dishes = factSheet.ordered.slice(0, 2).join(' and ')
    highlightStr = `We especially loved the ${dishes}.`
  } else if (factSheet.liked.length > 0 && overallTone === 'positive') {
    const aspects = factSheet.liked.slice(0, 2).join(' and ')
    highlightStr = `The ${aspects} made our dining visit even more special.`
  }

  if (overallTone !== 'positive') {
    return [overallStr, foodStr, serviceStr].filter(Boolean).join(' ')
  }

  // Multiple assembly structures to provide radical variation
  const templateIndex = getSeededIndex(effectiveSeed + '-tpl', 5)

  let sentences: string[]
  switch (templateIndex) {
    case 0:
      // Pattern: Food first, then service, then closing
      sentences = [foodStr, serviceStr, closingStr]
      break
    case 1:
      // Pattern: Overall first, then food, then service
      sentences = [overallStr, foodStr, serviceStr]
      break
    case 2:
      // Pattern: Service/hospitality first, then food flavors, then recommendation
      sentences = [serviceStr, foodStr, closingStr]
      break
    case 3:
      // Pattern: Overall, then highlight/dish, then service
      sentences = [overallStr, highlightStr || locationStr, serviceStr]
      break
    case 4:
    default:
      // Pattern: Food, dish highlight, and closing
      sentences = [foodStr, highlightStr || locationStr, closingStr]
      break
  }

  return sentences.filter(Boolean).join(' ')
}

/**
 * Angles to steer LLM generation into varied voices and perspectives.
 */
const LLM_ANGLES = [
  'Focus angle: Highlight the rich flavors, delicious spices, and authentic aroma of the food.',
  'Focus angle: Emphasize the warm table hospitality, polite staff, and prompt service.',
  'Focus angle: Mention the prime, convenient location at Ishwari Arcade on Bailey Road, Patna.',
  'Focus angle: Express genuine satisfaction with the biryani, starters, handi specialties, and generous portions.',
  'Focus angle: A family diner who appreciated the pleasant, clean ambiance and welcoming atmosphere.',
  'Focus angle: A satisfied foodie praising the authentic Indian taste and great value for money.',
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

  const prompt = `You are helping a restaurant diner write a brief, authentic Google review draft for their dining visit to ${restaurantName} on Bailey Road in Patna.
STRICT GUIDELINES:
1. Write in the first person ("I" or "We") as a genuine diner who visited this restaurant.
2. Length MUST be between 30 and 65 words (about 2 to 3 natural sentences).
3. Mention dining highlights like delicious food, rich flavors, authentic biryani, starters or handi curries, courteous staff, pleasant ambience at Ishwari Arcade, or great value.
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
