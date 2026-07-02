import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
async function main() {
  const prompt = `Tu es un rédacteur pour une plateforme éducative française. Génère 3 nouvelles idées uniques pour le thème "Philosophie".

Règles:
- Chaque idée doit être concise (100-150 mots max dans content)
- Style direct, percutant, éducatif
- Content: fait concret + explication courte + exemple
- Takeaway: une leçon actionable en 1 phrase
- Titres en français, style accrocheur
- Ne PAS répéter les idées existantes

Format JSON array:
[
  {
    "title": "Titre accrocheur",
    "content": "Faits + explication + exemple concret en 100-150 mots",
    "takeaway": "Leçon actionable en 1 phrase",
    "slug": "slug-en-minuscules-avec-dash"
  }
]

Réponds UNIQUEMENT avec le JSON array, rien d'autre.`;

  const res = await fetch(process.env.LLM_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.LLM_API_KEY,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
      stream: false,
    }),
  });
  const text = await res.text();
  console.log('Raw response length:', text.length);
  console.log('Raw response:', text.substring(0, 2000));
}
main();
