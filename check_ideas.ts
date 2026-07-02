import 'dotenv/config';
import { PrismaClient } from './src/generated/client';
const p = new PrismaClient();
async function main() {
  // Sample ideas to see structure
  const ideas = await p.idea.findMany({
    take: 3,
    include: { 
      source: { select: { title: true, slug: true, url: true } },
      ideaTopics: { select: { topicId: true } }
    }
  });
  console.log('Sample ideas:');
  for (const i of ideas) {
    console.log('Title:', i.title);
    console.log('Slug:', i.slug);
    console.log('Source:', i.source.title);
    console.log('Content (first 100):', i.content.substring(0, 100));
    console.log('Takeaway:', i.takeaway);
    console.log('OrderIndex:', i.orderIndex);
    console.log('---');
  }
  
  // Check max orderIndex
  const maxOrder = await p.idea.findFirst({ orderBy: { orderIndex: 'desc' }, select: { orderIndex: true } });
  console.log('Max orderIndex:', maxOrder?.orderIndex);
  
  // Total published ideas
  const total = await p.idea.count({ where: { isPublished: true } });
  console.log('Total published ideas:', total);
  
  // Existing slugs to check uniqueness
  const slugs = await p.idea.findMany({ select: { slug: true } });
  const unique = new Set(slugs.map(s => s.slug));
  console.log('Unique slugs:', unique.size, 'vs total:', slugs.length);
  
  await p.$disconnect();
}
main();
