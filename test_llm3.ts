import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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
      max_tokens: 500,
      temperature: 0.7
    })
  });
  const data = await res.json();
  console.log('Content:', data.choices?.[0]?.message?.content);
  console.log('Finish:', data.choices?.[0]?.finish_reason);
}
main();
