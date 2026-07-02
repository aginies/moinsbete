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
      max_tokens: 50
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Raw response:', text.substring(0, 500));
}
main();
