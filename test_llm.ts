import 'dotenv/config';
async function main() {
  const res = await fetch(process.env.LLM_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.LLM_API_KEY
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [{ role: 'user', content: 'Bonjour. Réponds en une phrase courte.' }],
      max_tokens: 50
    })
  });
  const data = await res.json();
  console.log('LLM response:', data.choices?.[0]?.message?.content);
}
main();
