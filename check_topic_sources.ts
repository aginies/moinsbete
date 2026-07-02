import 'dotenv/config';
import { PrismaClient } from './src/generated/client';
const p = new PrismaClient();
async function main() {
  // Check all topic-source links
  const allLinks = await p.sourceTopic.findMany({
    include: { topic: { select: { name: true } }, source: { select: { title: true, url: true } } }
  });
  console.log('Total topic-source links:', allLinks.length);
  
  // Group by topic
  const byTopic: Record<string, string[]> = {};
  for (const link of allLinks) {
    if (!byTopic[link.topic.name]) byTopic[link.topic.name] = [];
    byTopic[link.topic.name].push(link.source.title);
  }
  console.log('\n=== Topics and their sources ===');
  for (const [topic, sources] of Object.entries(byTopic)) {
    console.log(`${topic}: ${sources.length} sources`);
    for (const s of sources) console.log(`  - ${s}`);
  }
  
  // Check if Voitures has any links
  const voituresLinks = allLinks.filter(l => l.topic.name === 'Voitures');
  console.log('\nVoitures links:', voituresLinks.length);
  
  await p.$disconnect();
}
main();
