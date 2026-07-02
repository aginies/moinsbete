import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { PrismaClient } from './src/generated/client';
const p = new PrismaClient();
async function main() {
  const ideas = await p.idea.findMany({
    take: 5,
    orderBy: { orderIndex: 'desc' },
    include: { source: { select: { title: true } } }
  });
  for (const i of ideas) {
    console.log('=== ' + i.title + ' ===');
    console.log('Source:', i.source.title);
    console.log('Content:', i.content);
    console.log('Takeaway:', i.takeaway);
    console.log('---');
  }
  await p.$disconnect();
}
main();
