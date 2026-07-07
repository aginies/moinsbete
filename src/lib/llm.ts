import 'dotenv/config'
import OpenAI from 'openai'

const llm = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.LLM_API_KEY || 'mock-key-for-build',
})

export async function extractJson(text: string): Promise<any> {
  if (!text || text.trim().length === 0) throw new Error('Empty text')

  // Try direct parse
  try {
    return JSON.parse(text.trim())
  } catch { }

  // Try extracting JSON array
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0])
    } catch {
      const cleaned = arrMatch[0]
        .replace(/"reasoning_content":\s*"([^"]*)"/g, '"reasoning_content":""')
      try {
        return JSON.parse(cleaned)
      } catch {
        const lastBracket = text.lastIndexOf(']')
        const firstBracket = text.indexOf('[')
        if (firstBracket !== -1 && lastBracket > firstBracket) {
          for (let i = lastBracket; i >= firstBracket; i--) {
            const sub = text.substring(firstBracket, i + 1)
            try {
              return JSON.parse(sub)
            } catch {
              // continue
            }
          }
        }
      }
    }
  }

  // Try extracting JSON object
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0])
    } catch {
      const cleaned = objMatch[0]
        .replace(/"reasoning_content":\s*"([^"]*)"/g, '"reasoning_content":""')
      try {
        return JSON.parse(cleaned)
      } catch {
        // try
      }
    }
  }

  throw new Error('No valid JSON found')
}

export async function suggestTopic(
  category: string,
  existingTopics: Array<{ id: string; name: string; parentId?: string | null; parent?: { name: string } | null }>
) {
  const topicsList = existingTopics.map(t => ({
    id: t.id,
    name: t.name,
    parent: t.parent?.name || null,
  }))

  const systemPrompt = `Tu es un classificateur de sujets pour une application francophone d'apprentissage rapide.
Sujets existants: ${JSON.stringify(topicsList, null, 2)}

Règles:
1. Si la catégorie correspond à un sujet existant, retourne action: "match" avec matchTopicId
2. Si c'est un nouveau sujet pertinent, retourne action: "create" avec suggestion (name, parentId, icon)
3. Ignore les catégories meta (Portail:, Ébauche, Wikipédia:, etc.)
4. Pour parentId, choisis le sujet parent le plus logique
5. Pour icon, choisis un emoji pertinent

Retourne UNIQUEMENT du JSON valide.`

  try {
    const response = await llm.chat.completions.create({
      model: process.env.LLM_MODEL!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: category },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const choice = response.choices?.[0]
    if (!choice) {
      throw new Error('LLM returned no choices')
    }
    const rawContent = choice.message?.content || ''
    const reasoningContent = (choice.message as any)?.reasoning_content || ''
    const content = rawContent || reasoningContent || '{}'

    const parsed = await extractJson(content)
    return {
      action: parsed.action || 'create',
      matchTopicId: parsed.matchTopicId,
      suggestion: parsed.suggestion,
      confidence: parsed.confidence || 0.5,
    }
  } catch (error) {
    console.error('LLM error:', error)
    return {
      action: 'create',
      suggestion: { name: category, icon: '📚' },
      confidence: 0.3,
    }
  }
}

export async function distillIdeas(
  title: string,
  content: string,
  sourceUrl: string,
  existingTopics: Array<{ id: string; name: string }>
): Promise<Array<{ title: string; content: string; takeaway: string }>> {
  const systemPrompt = `Extrait 5 idées. Retourne UNIQUEMENT JSON: [{"title":"T","content":"C","takeaway":"A"},...]`

  try {
    const response = await llm.chat.completions.create({
      model: process.env.LLM_MODEL!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Titre: ${title}. URL: ${sourceUrl}. Texte: ${content.substring(0, 1500)}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const choice = response.choices?.[0]
    if (!choice) {
      throw new Error('LLM returned no choices')
    }
    const rawContent = choice.message?.content || ''
    const reasoningContent = (choice.message as any)?.reasoning_content || ''
    
    // Try rawContent first (model often puts JSON directly there)
    if (rawContent && rawContent.trim().length > 0) {
      const result = tryExtractArray(rawContent)
      if (result) return result
    }
    
    // Fall back to reasoningContent
    if (reasoningContent && reasoningContent.trim().length > 0) {
      const result = tryExtractArray(reasoningContent)
      if (result) return result
    }
    
    return []
  } catch (error) {
    console.error('LLM distillation error:', error)
    return []
  }
}

export function tryExtractArray(text: string): Array<{ title: string; content: string; takeaway: string }> | null {
  // Find the last valid JSON array by scanning from end with bracket matching
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === ']') {
      // Find matching [ by counting brackets
      let bracketCount = 0
      let start = -1
      for (let j = i; j >= 0; j--) {
        if (text[j] === ']') bracketCount++
        if (text[j] === '[') {
          bracketCount--
          if (bracketCount === 0) {
            start = j
            break
          }
        }
      }
      
      if (start !== -1) {
        let jsonStr = text.substring(start, i + 1)
        // Clean markdown backticks (but preserve JSON brackets)
        jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        // Remove leading/trailing backticks and whitespace, but NOT brackets
        jsonStr = jsonStr.replace(/^[`]+/, '').replace(/[`]+$/, '').trim()
        // Unescape quotes that were escaped in the model output
        jsonStr = jsonStr.replace(/\\\\"/g, '\\"')
        try {
          const parsed = JSON.parse(jsonStr)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate each item has required keys
            const valid = parsed.every((item: any) => 
              item && typeof item.title === 'string' && 
              typeof item.content === 'string' && 
              typeof item.takeaway === 'string'
            )
            if (valid) return parsed
          }
        } catch {
          // continue searching
        }
      }
    }
  }
  return null
}

export async function expandIdeas(
  title: string,
  content: string,
  takeaway: string
): Promise<string | null> {
  const systemPrompt = `Tu es un rédacteur pédagogique francophone. Tu enrichis le contenu d'une idée pour le rendre plus complet et instructif.

Règles:
- Le contenu final doit faire au moins 500 caractères
- Garde le sens et le ton original
- Ajoute du contexte, des exemples concrets, des explications supplémentaires
- Ne répète pas le takeaway
- Retourne UNIQUEMENT du JSON valide: {"content":"..."}
- Retourne le contenu ENTIÈREMENT en français`

  const userMessage = `Titre: ${title}

Contenu actuel (${content.length} caractères):
${content}

Takeaway: ${takeaway}`

  try {
    const response = await llm.chat.completions.create({
      model: process.env.LLM_MODEL!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const choice = response.choices?.[0]
    if (!choice) {
      console.error('LLM returned no choices')
      return null
    }
    
    const rawContent = choice.message?.content || ''
    const reasoningContent = (choice.message as any)?.reasoning_content || ''
    
    // Try rawContent first
    if (rawContent && rawContent.trim().length > 0) {
      const result = tryExpandJson(rawContent)
      if (result) return result
    }
    
    // Fall back to reasoningContent
    if (reasoningContent && reasoningContent.trim().length > 0) {
      const result = tryExpandJson(reasoningContent)
      if (result) return result
    }
    
    console.error('No valid JSON found in response')
    return null
  } catch (error) {
    console.error('LLM expand error:', error)
    return null
  }
}

function tryExpandJson(text: string): string | null {
  // Try direct parse
  try {
    const parsed = JSON.parse(text.trim())
    if (parsed && typeof parsed.content === 'string' && parsed.content.length >= 500) {
      return parsed.content
    }
  } catch { }

  // Try extracting JSON object
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      let jsonStr = objMatch[0]
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      jsonStr = jsonStr.replace(/^[`]+/, '').replace(/[`]+$/, '').trim()
      jsonStr = jsonStr.replace(/\\\\"/g, '\\"')
      const parsed = JSON.parse(jsonStr)
      if (parsed && typeof parsed.content === 'string') {
        return parsed.content
      }
    } catch { }
  }

  // Try extracting "content" value from text
  const contentMatch = text.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (contentMatch) {
    const expanded = contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n')
    if (expanded.length >= 500) return expanded
  }

  return null
}
