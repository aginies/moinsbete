import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
async function main() {
  // Try with stream=false and more tokens
  const res = await fetch(process.env.LLM_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.LLM_API_KEY
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [{ role: 'user', content: 'Say hello in French' }],
      max_tokens: 1000,
      temperature: 0.7,
      stream: false
    })
  });
  const data = await res.json();
  console.log('Full JSON keys:', Object.keys(data));
  console.log('Choices count:', data.choices?.length);
  if (data.choices?.[0]?.message) {
    console.log('Message keys:', Object.keys(data.choices[0].message));
    console.log('Content length:', data.choices[0].message.content?.length);
    console.log('Content:', JSON.stringify(data.choices[0].message.content));
  } else {
    console.log('No message in choice 0');
    console.log('Choice 0:', JSON.stringify(data.choices?.[0]).substring(0, 500));
  }
}
main();
