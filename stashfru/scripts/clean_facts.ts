import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

const prefixes = [
  /^Vue satellite\.\s*/,
  /^Portrait de [^\.]+\.\s*/,
  /^En \d{4}\.\s*/,
  /^Page de titre de [^\.]+\.\s*/,
  /^Intérieur de [^\.]+\.\s*/,
  /^Maquette annotée de [^\.]+\.\s*/,
  /^Simulation de [^\.]+\.\s*/,
  /^Carte de visite de [^\.]+\.\s*/,
  /^Détail du [^\.]+\.\s*/,
  /^Un exemple de [^\.]+\.\s*/,
  /^Un candidat de [^\.]+\.\s*/,
  /^Un paresseux,[^\.]+\.\s*/,
  /^Le groupe [^\.]+\.\s*/,
  /^Les membres du [^\.]+\.\s*/,
  /^Le manteau porté [^\.]+\.\s*/,
  /^Autrefois,[^\.]+\.\s*/,
  /^Développante du [^\.]+\.\s*/,
  /^Grande ceinture [^\.]+\.\s*/,
  /^Une petite [^\.]+\.\s*/,
  /^Bibliothèque nationale [^\.]+\.\s*/,
  /^Préparation de [^\.]+\.\s*/,
  /^Film catastrophe [^\.]+\.\s*/,
  /^Le panneau frontal [^\.]+\.\s*/,
  /^Ville nouvelle [^\.]+\.\s*/,
  /^Terrasse du [^\.]+\.\s*/,
  /^Le musée des [^\.]+\.\s*/,
  /^Fourmis champignonistes [^\.]+\.\s*/,
  /^La tombe de [^\.]+\.\s*/,
  /^Mathilde de [^\.]+\.\s*/,
  /^Le coffret de [^\.]+\.\s*/,
  /^Gisant d[^\.]+\.\s*/,
  /^Frank Margerin [^\.]+\.\s*/,
  /^Couverture de [^\.]+\.\s*/,
  /^Image de [^\.]+\.\s*/,
  /^Extrait de [^\.]+\.\s*/,
  /^Page de [^\.]+\.\s*/,
  /^Fig\.\s*/,
  /^Fig\s*/,
]

async function main() {
  const allFacts = await prisma.saviezVousFact.findMany()
  let cleaned = 0
  
  for (const fact of allFacts) {
    let text = fact.text
    
    for (const prefix of prefixes) {
      text = text.replace(prefix, '')
    }
    
    text = text.replace(/\s+/g, ' ').trim()
    
    if (text !== fact.text) {
      await prisma.saviezVousFact.update({
        where: { id: fact.id },
        data: { text },
      })
      cleaned++
    }
  }
  
  console.log(`Cleaned ${cleaned} facts`)
  
  // Verify sample
  const sample = await prisma.saviezVousFact.findMany({ take: 5 })
  console.log('---')
  for (const f of sample) {
    console.log(f.text)
    console.log(`  URL: ${f.sourceUrl}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
