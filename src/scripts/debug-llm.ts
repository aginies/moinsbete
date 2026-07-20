import 'dotenv/config'
import OpenAI from 'openai'
import type { ChatCompletionMessage } from 'openai/resources'

const llm = new OpenAI({
  baseURL: process.env.LLM_BASE_URL!,
  apiKey: process.env.LLM_API_KEY!,
})

async function test() {
  const content = `Le stoïcisme est une école de philosophie hellénistique fondée par Zénon de Kition au début du IIIe siècle av. J.-C. à Athènes. Les principaux représentants du stoïcisme sont Épicète, Sénèque et Marc Aurèle.`
  
  const response = await llm.chat.completions.create({
    model: process.env.LLM_MODEL!,
    messages: [
      { role: 'system', content: 'Extrait 3 idées. Retourne UNIQUEMENT un tableau JSON: [{"title":"Titre","content":"Contenu","takeaway":"À retenir"},...] Titre: Stoïcisme' },
      { role: 'user', content },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  })
  
  const choice = response.choices[0]
  console.log('=== RAW RESPONSE ===')
  console.log('Content:', JSON.stringify(choice?.message?.content))
  console.log('\nReasoning:', JSON.stringify((choice?.message as any)?.reasoning_content?.substring?.(0, 500)))
  console.log('\nFinish reason:', choice?.finish_reason)
}

test().catch(console.error)
