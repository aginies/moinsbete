import 'dotenv/config';
import { PrismaClient } from './src/generated/client';
const p = new PrismaClient();
async function main() {
  const topics = await p.topic.findMany({
    select: { name: true, ideaTopics: { select: { ideaId: true } } }
  });
  for (const t of topics) console.log(t.name, ':', t.ideaTopics.length);
  await p.$disconnect();
}
main();
