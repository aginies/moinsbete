import 'dotenv/config';
import { PrismaClient } from './src/generated/client';
const p = new PrismaClient();
async function main() {
  // Sources with fewest ideas
  const sources = await p.source.findMany({
    include: { ideas: { select: { id: true } }, sourceTopics: { select: { topicId: true } } }
  });
  sources.sort((a, b) => a.ideas.length - b.ideas.length);
  console.log('=== Sources with fewest ideas ===');
  for (const s of sources.slice(0, 20)) {
    console.log(`${s.title}: ${s.ideas.length} ideas, topics: ${s.sourceTopics.length}`);
  }
  console.log('\n=== Sources with 0 ideas ===');
  for (const s of sources.filter(s => s.ideas.length === 0)) {
    console.log(s.title);
  }
  // Voitures topic sources
  const voituresTopic = await p.topic.findFirst({ where: { name: 'Voitures' }, include: { sourceTopics: { include: { source: true } } } });
  console.log('\n=== Voitures topic sources ===');
  if (voituresTopic) {
    for (const st of voituresTopic.sourceTopics) {
      console.log(st.source.title, '-', st.source.url);
    }
  }
  await p.$disconnect();
}
main();
