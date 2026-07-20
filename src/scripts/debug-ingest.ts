import 'dotenv/config'
import type { ChatCompletionMessage } from 'openai/resources'

const WIKIPEDIA_API = 'https://fr.wikipedia.org/api/rest_v1'

async function test() {
  // Test Wikipedia fetch
  const titles = ['Biais cognitifs', 'Stoïcisme', 'Intelligence émotionnelle', 'Mémoire de travail', 'Prise de décision']
  
  for (const title of titles) {
    const res = await fetch(`${WIKIPEDIA_API}/page/summary/${encodeURIComponent(title)}`)
    const data = await res.json()
    console.log(`${title}: ${res.status} - type=${data.type} - extract=${(data.extract || '').substring(0, 50)}...`)
  }
  
  // Test LLM response for Stoïcisme
  const stoicismSummary = await fetch(`${WIKIPEDIA_API}/page/summary/Stoïcisme`)
  const stoicismData = await stoicismSummary.json()
  console.log('\nStoïcisme extract length:', stoicismData.extract?.length)
  
  // Test LLM directly
  const OpenAI = (await import('openai')).default
  const llm = new OpenAI({
    baseURL: process.env.LLM_BASE_URL!,
    apiKey: process.env.LLM_API_KEY!,
  })
  
  const response = await llm.chat.completions.create({
    model: process.env.LLM_MODEL!,
    messages: [
      { role: 'system', content: 'Extrait 3 idées. Retourne UNIQUEMENT un tableau JSON: [{"title":"Titre","content":"Contenu","takeaway":"À retenir"},...] Titre: Stoïcisme' },
      { role: 'user', content: (stoicismData.extract || '').substring(0, 1000) },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  })
  
  const choice = response.choices[0]
  console.log('\nContent:', choice?.message?.content?.substring(0, 500))
  console.log('\nReasoning:', (choice?.message as any)?.reasoning_content?.substring?.(0, 500))
  console.log('\nFinish reason:', choice?.finish_reason)
}

test().catch(console.error)
