import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'saviez-vous')

fs.mkdirSync(IMAGE_DIR, { recursive: true })

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ô]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[ÿ]/g, 'y')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '')
}

async function downloadImage(filename: string): Promise<string | null> {
  const safeName = slugify(filename) + '.jpg'
  const localPath = path.join(IMAGE_DIR, safeName)
  
  if (fs.existsSync(localPath)) {
    return safeName
  }

  const encoded = encodeURIComponent(filename)
  // Get image info to determine actual filename
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encoded}&prop=imageinfo&iiprop=url&format=json`
  
  try {
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'MoinsBete/1.0 (contact: admin@stashfru.fr)' },
    })
    const data = await res.json()
    
    const pages = data.query?.pages
    const page = Object.values(pages as Record<string, any>)[0]
    const imageUrl = page?.imageinfo?.[0]?.url
    
    if (!imageUrl) return null
    
    // Download the actual file
    const imgRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'MoinsBete/1.0 (contact: admin@stashfru.fr)' },
    })
    
    if (!imgRes.ok) return null
    
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    fs.writeFileSync(localPath, buffer)
    return safeName
  } catch (e) {
    console.error(`  Failed to download ${filename}: ${(e as Error).message}`)
    return null
  }
}

async function main() {
  console.log('⬇️ Downloading SaviezVous images from Wikimedia Commons\n')

  const factsWithImages = await prisma.saviezVousFact.findMany({
    where: { imageFilename: { not: null } },
    select: { id: true, imageFilename: true },
    take: 2000,
  })

  console.log(`Facts with image filenames: ${factsWithImages.length}\n`)

  let downloaded = 0
  let skipped = 0
  let errors = 0

  for (const fact of factsWithImages) {
    const filename = fact.imageFilename as string
    const result = await downloadImage(filename)
    
    if (result) {
      downloaded++
      if (downloaded % 50 === 0) {
        console.log(`  Downloaded ${downloaded}...`)
      }
    } else {
      errors++
    }
  }

  console.log(`\n=== Résumé ===`)
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Skipped (exists): ${skipped}`)
  console.log(`Errors: ${errors}`)
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
