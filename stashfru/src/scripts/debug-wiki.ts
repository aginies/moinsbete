import 'dotenv/config'

const WIKIPEDIA_API = 'https://fr.wikipedia.org/api/rest_v1'

async function test() {
  const titles = ['Biais_cognitifs', 'Stoïcisme', 'Intelligence_émotionnelle', 'Mémoire_de_travail', 'Prise_de_décision']
  
  for (const title of titles) {
    const url = `${WIKIPEDIA_API}/page/summary/${encodeURIComponent(title)}`
    console.log('URL:', url)
    const res = await fetch(url)
    console.log('Status:', res.status)
    const text = await res.text()
    console.log('First 200 chars:', text.substring(0, 200))
    console.log('---')
  }
}

test().catch(console.error)
