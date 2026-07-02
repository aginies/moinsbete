import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
async function main() {
  const prompt = `Tu es un rédacteur pour une plateforme éducative française. Génère 3 nouvelles idées uniques pour le thème "Philosophie".

Format JSON array:
[
  {
    "title": "Titre",
    "content": "Contenu court",
    "takeaway": "Leçon",
    "slug": "slug"
  }
]

Réponds UNIQUEMENT avec le JSON array.`;

  const res = await fetch(process.env.LLM_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.LLM_API_KEY,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: 'system', content: 'Tu es un assistant qui répond toujours en JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: false,
    }),
  });
  const data = JSON.parse(await res.text());
  console.log('Content length:', data.choices?.[0]?.message?.content?.length);
  console.log('Content:', JSON.stringify(data.choices?.[0]?.message?.content));
  console.log('Reasoning length:', data.choices?.[0]?.message?.reasoning_content?.length);
  console.log('Finish reason:', data.choices?.[0]?.finish_reason);
}
main();
