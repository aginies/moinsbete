import 'dotenv/config'
import OpenAI from 'openai'

const llm = new OpenAI({
  baseURL: process.env.LLM_BASE_URL!,
  apiKey: process.env.LLM_API_KEY!,
})

async function test() {
  try {
    const res = await llm.chat.completions.create({
      model: "unsloth/Qwen3.6-35B-A3B-MTP-GGUF/Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf",
      messages: [
        { role: 'system', content: 'Réponds toujours en français. Sois concis.' },
        { role: 'user', content: 'Donne-moi 3 conseils de productivité en une phrase chacun.' },
      ],
      temperature: 0.7,
      max_tokens: 200,
    })
    const choice = res.choices[0]
    console.log('Content:', choice?.message?.content)
    console.log('Reasoning:', (choice?.message as any)?.reasoning_content?.substring(0, 200))
    console.log('Finish reason:', choice?.finish_reason)
  } catch (e: any) {
    console.error('Error:', e.message)
  }
}

test()
