import 'dotenv/config'
import OpenAI from 'openai'
import { IDEAS } from './seed-ideas'

const llm = new OpenAI({
  baseURL: process.env.LLM_BASE_URL!,
  apiKey: process.env.LLM_API_KEY!,
})

const ENHANCE_SYSTEM_PROMPT = `Tu es un rédacteur expert en vulgarisation scientifique et philosophique francophone.
Ta mission : enrichir le contenu de chaque idée pour la rendre plus verbueuse, détaillée et instructive.

Règles strictes :
1. content : doit être 3-5 phrases détaillées, avec contexte, explication, exemples concrets. Plus profond que l'original.
2. takeaway : doit être 2-3 phrases d'action concrète, avec un exemple ou une analogie. Plus pratique que l'original.
3. Garder le ton accessible mais rigoureux. Style clair, précis, engageant.
4. Ajouter des détails factuels, des chiffres, des références quand pertinent.
5. Garder le format JSON exact. Ne rien ajouter d'autre.
6. Ne PAS inventer de faits. Utiliser uniquement des connaissances vérifiables.
7. Le contenu doit être plus LONG et PLUS DÉTAILLÉ que l'original.`

async function enhanceIdea(idea: { title: string; content: string; takeaway: string }) {
  const response = await llm.chat.completions.create({
    model: process.env.LLM_MODEL!,
    messages: [
      { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(idea) },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  })

  const rawContent = response.choices[0]?.message?.content || ''
  const reasoningContent = (response.choices[0]?.message as any)?.reasoning_content || ''
  const content = rawContent || reasoningContent || ''

  // Try to extract JSON from the response
  const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.title && parsed.content && parsed.takeaway) {
        return parsed
      }
      if (parsed.content) return parsed // array of ideas
    } catch {
      // try next method
    }
  }

  // Try parsing as array
  try {
    const arrMatch = content.match(/\[[\s\S]*\]/)
    if (arrMatch) {
      const parsed = JSON.parse(arrMatch[0])
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0]
      }
    }
  } catch {
    // continue
  }

  return null
}

async function enhanceBatch(ideas: typeof IDEAS) {
  const prompt = ideas.map((idea, i) =>
    `${i + 1}. "${idea.title}"\n   content: "${idea.content}"\n   takeaway: "${idea.takeaway}"`
  ).join('\n\n')

  const response = await llm.chat.completions.create({
    model: process.env.LLM_MODEL!,
    messages: [
      { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
      { role: 'user', content: `Enrichis ces ${ideas.length} idées. Retourne un JSON array avec les versions améliorées.\n\n${prompt}` },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  })

  const rawContent = response.choices[0]?.message?.content || ''
  const reasoningContent = (response.choices[0]?.message as any)?.reasoning_content || ''
  const content = rawContent || reasoningContent || ''

  // Extract JSON array
  const arrMatch = content.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      const parsed = JSON.parse(arrMatch[0])
      if (Array.isArray(parsed)) {
        return parsed.filter((item: any) => item.title && item.content && item.takeaway)
      }
    } catch {
      console.log('Parse error, trying cleanup...')
    }
  }

  // Try cleaning and re-parsing
  const cleaned = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      return parsed.filter((item: any) => item.title && item.content && item.takeaway)
    }
  } catch {
    // continue
  }

  return null
}

async function main() {
  console.log(`🚀 Enhancement de ${IDEAS.length} idées\n`)

  const BATCH_SIZE = 8
  const allEnhanced: typeof IDEAS = []

  for (let i = 0; i < IDEAS.length; i += BATCH_SIZE) {
    const batch = IDEAS.slice(i, i + BATCH_SIZE)
    console.log(`\n📝 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(IDEAS.length / BATCH_SIZE)} (${batch.length} idées)`)

    const enhanced = await enhanceBatch(batch)

    if (enhanced && Array.isArray(enhanced)) {
      for (let j = 0; j < enhanced.length; j++) {
        const idx = i + j
        if (enhanced[j].title && enhanced[j].content && enhanced[j].takeaway) {
          allEnhanced[idx] = {
            title: IDEAS[idx].title,
            content: enhanced[j].content,
            takeaway: enhanced[j].takeaway,
            sourceTitle: IDEAS[idx].sourceTitle,
            topicNames: IDEAS[idx].topicNames,
          }
          console.log(`  ✓ ${enhanced[j].title}`)
          console.log(`    content: ${enhanced[j].content.substring(0, 80)}...`)
          console.log(`    takeaway: ${enhanced[j].takeaway.substring(0, 80)}...`)
        }
      }
    } else {
      console.log(`  ⚠️ Batch non parsé`)
      for (const idea of batch) {
        allEnhanced.push(idea)
      }
    }

    // Wait between batches
    if (i + BATCH_SIZE < IDEAS.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Write output
  const output = `export const IDEAS = [\n${allEnhanced
    .filter(Boolean)
    .map(idea => `  {\n    title: "${idea.title}",\n    content: "${idea.content.replace(/"/g, '\\"')}",\n    takeaway: "${idea.takeaway.replace(/"/g, '\\"')}",\n    sourceTitle: "${idea.sourceTitle}",\n    topicNames: ${JSON.stringify(idea.topicNames)}\n  },`)
    .join('\n')}\n]`

  require('fs').writeFileSync('seed-ideas-enhanced.ts', output)
  console.log(`\n✅ ${allEnhanced.filter(Boolean).length} idées améliorées → seed-ideas-enhanced.ts`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
