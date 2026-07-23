(async () => {
const API_KEY = process.env.FREE_NEWS_API_KEY || ''
const BASE = 'https://api.freenewsapi.io/v1'

if (!API_KEY) {
  console.log('❌ FREE_NEWS_API_KEY not set')
  process.exit(1)
}

const category = process.argv[2] || 'world'

const params = new URLSearchParams({
  language: 'fr',
  country: 'fr',
  order_by: 'recent',
  page_size: '5',
  topic: category,
})

console.log(`🔍 Testing category: ${category}`)
console.log(`📡 URL: ${BASE}/news?${params.toString()}\n`)

try {
  const res = await fetch(`${BASE}/news?${params.toString()}`, {
    headers: { 'x-api-key': API_KEY },
    signal: AbortSignal.timeout(30000),
  })

  console.log(`📊 Status: ${res.status} ${res.statusText}`)

  if (!res.ok) {
    const text = await res.text()
    console.log(`❌ Response: ${text}`)
    process.exit(1)
  }

  const data = await res.json()
  console.log(`✅ Success: ${data.data?.length || 0} articles`)
  
  if (data.data?.length > 0) {
    console.log('\n📰 First article:')
    console.log(`   Title: ${data.data[0].title}`)
    console.log(`   Published: ${data.data[0].published_at}`)
    console.log(`   Publisher: ${data.data[0].publisher}`)
    console.log(`   UUID: ${data.data[0].uuid}`)
  }
  
  console.log(`\n📋 Meta:`, JSON.stringify(data.meta, null, 2))
} catch (err) {
  console.log(`❌ Error:`, err)
  process.exit(1)
}
})()
