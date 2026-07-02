import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

const LLM_BASE_URL = process.env.LLM_BASE_URL || '';
const LLM_MODEL = process.env.LLM_MODEL || '';
const LLM_API_KEY = process.env.LLM_API_KEY || '';

if (!LLM_BASE_URL || !LLM_MODEL || !LLM_API_KEY) {
  console.error('Missing LLM env vars: LLM_BASE_URL, LLM_MODEL, LLM_API_KEY');
  process.exit(1);
}

function slugify(text: string): string {
  return text
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
    .replace(/^-|-$/g, '');
}

async function callLLM(prompt: string): Promise<string> {
  const res = await fetch(LLM_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LLM_API_KEY,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: 'Tu es un assistant qui répond toujours en JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error ${res.status}: ${text.substring(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generateIdeasForTopic(topicName: string, topicDescription: string, existingSlugs: string[], topicId: string): Promise<Array<{ title: string; content: string; takeaway: string; slug: string }>> {
  const slugsList = existingSlugs.slice(0, 15).join('\n') || 'Aucun';
  const prompt = `Génère 5 nouvelles idées pour "${topicName}". ${topicDescription ? 'Contexte: ' + topicDescription : ''}

Format JSON array:
[
  {"title": "Titre accrocheur", "content": "Faits + explication + exemple, 100-150 mots", "takeaway": "Leçon en 1 phrase", "slug": "slug-minuscules-dash"}
]

Règles: style direct éducatif français, pas de doublons.

Slugs existants (${existingSlugs.length}):
${slugsList}

Réponds UNIQUEMENT avec le JSON array.`;

  const response = await callLLM(prompt);
  
  let jsonStr = response;
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const ideas = JSON.parse(jsonStr);
    if (!Array.isArray(ideas)) {
      console.error('  LLM did not return array, got:', typeof ideas);
      return [];
    }
    
    const cleaned = ideas.map((idea: any) => ({
      title: idea.title?.trim() || '',
      content: idea.content?.trim() || '',
      takeaway: idea.takeaway?.trim() || '',
      slug: idea.slug?.trim() || slugify(idea.title || ''),
    })).filter((idea: any) => idea.title && idea.content && idea.takeaway);
    
    return cleaned;
  } catch (e) {
    console.error('  Failed to parse LLM response:', (e as Error).message);
    console.error('  Response preview:', response.substring(0, 300));
    return [];
  }
}

async function createSourcesForTopic(topicName: string, topicId: string, sourceTitles: Array<{ title: string; url: string }>): Promise<string[]> {
  const createdIds: string[] = [];
  
  for (const { title, url } of sourceTitles) {
    try {
      const existing = await prisma.source.findUnique({ where: { slug: slugify(title) } });
      if (existing) {
        console.log(`  Source "${title}" already exists: ${existing.id}`);
        // Link source to topic
        await prisma.sourceTopic.upsert({
          where: { sourceId_topicId: { sourceId: existing.id, topicId } },
          create: { sourceId: existing.id, topicId },
          update: {},
        });
        createdIds.push(existing.id);
        continue;
      }
      
      const source = await prisma.source.create({
        data: {
          title,
          slug: slugify(title),
          type: 'WIKIPEDIA',
          url,
        },
      });
      
      // Link source to topic
      await prisma.sourceTopic.create({
        data: { sourceId: source.id, topicId },
      });
      
      createdIds.push(source.id);
      console.log(`  Created source: "${title}" (${source.id})`);
    } catch (e) {
      console.error(`  Failed to create source "${title}": ${(e as Error).message}`);
    }
  }
  
  return createdIds;
}

async function generateIdeasForSource(sourceTitle: string, sourceUrl: string | null, sourceId: string, topicIds: string[]): Promise<Array<{ title: string; content: string; takeaway: string; slug: string }>> {
  const topicNames = topicIds.length > 0 ? topicIds.slice(0, 3).join(', ') : 'général';
  const prompt = `Génère 5 nouvelles idées basées sur "${sourceTitle}"${sourceUrl ? ' (source: ' + sourceUrl + ')' : ''}. Thèmes: ${topicNames}.

Format JSON array:
[
  {"title": "Titre accrocheur", "content": "Faits + explication + exemple, 100-150 mots", "takeaway": "Leçon en 1 phrase", "slug": "slug-minuscules-dash"}
]

Règles: style direct éducatif français, contenu lié à la source.

Réponds UNIQUEMENT avec le JSON array.`;

  const response = await callLLM(prompt);
  
  let jsonStr = response;
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const ideas = JSON.parse(jsonStr);
    if (!Array.isArray(ideas)) return [];
    
    return ideas.map((idea: any) => ({
      title: idea.title?.trim() || '',
      content: idea.content?.trim() || '',
      takeaway: idea.takeaway?.trim() || '',
      slug: idea.slug?.trim() || slugify(idea.title || ''),
    })).filter((idea: any) => idea.title && idea.content && idea.takeaway);
  } catch (e) {
    console.error(`  Failed to parse LLM for source "${sourceTitle}": ${(e as Error).message}`);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting idea generation\n');
  
  const startTime = Date.now();
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  // ===== STEP 1: Add F1 and Le Mans sources for Voitures topic =====
  console.log('=== Étape 1: Sources Voitures (F1 + Le Mans) ===');
  const voituresTopic = await prisma.topic.findFirst({
    where: { name: 'Voitures' },
  });
  
  if (voituresTopic) {
    const f1Sources = [
      { title: 'Formule 1', url: 'https://fr.wikipedia.org/wiki/Formule_1' },
      { title: '24 Heures du Mans', url: 'https://fr.wikipedia.org/wiki/24_Heures_du_Mans' },
    ];
    
    const sourceIds = await createSourcesForTopic('Voitures', voituresTopic.id, f1Sources);
    
    // Generate ideas for F1 and Le Mans
    for (const sourceId of sourceIds) {
      const source = await prisma.source.findUnique({
        where: { id: sourceId },
        include: { sourceTopics: { select: { topicId: true } } },
      });
      if (!source) continue;
      
     const topicIds = source.sourceTopics.map(t => t.topicId);
      const ideas = await generateIdeasForSource(source.title, source.url, source.id, topicIds);
      
console.log(`  Generating ideas for "${source.title}": ${ideas.length} ideas`);
      
      for (const idea of ideas) {
        try {
          const finalSlug = idea.slug.replace(/-\d+$/, '');
          const existing = await prisma.idea.findUnique({ where: { slug: finalSlug } });
          if (existing) {
            console.log(`    Skipping "${idea.title}" - slug "${finalSlug}" exists`);
            totalSkipped++;
            continue;
          }
          
          // Get max orderIndex
          const maxOrder = await prisma.idea.findFirst({
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true },
          });
          const orderIndex = (maxOrder?.orderIndex ?? -1) + 1;
          
          const created = await prisma.idea.create({
            data: {
              title: idea.title,
              content: idea.content,
              takeaway: idea.takeaway,
              slug: finalSlug,
              sourceId: source.id,
              orderIndex,
              isPublished: true,
              ideaTopics: {
                create: topicIds.map(topicId => ({ topicId })),
              },
            },
          });
          
          totalCreated++;
          console.log(`    ✓ Created: "${idea.title}" (orderIndex: ${orderIndex})`);
        } catch (e) {
          console.error(`    ✗ Failed "${idea.title}": ${(e as Error).message}`);
          totalErrors++;
        }
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
  } else {
    console.log('  Voitures topic not found');
  }
  
  // ===== STEP 2: Generate ideas for topics with <50 ideas =====
  console.log('\n=== Étape 2: Génération par thème ===');
  
  const topicsWithCounts = await prisma.topic.findMany({
    include: {
      ideaTopics: { select: { ideaId: true } },
      sourceTopics: { select: { sourceId: true } },
    },
  });
  
  for (const topic of topicsWithCounts) {
    const ideaCount = topic.ideaTopics.length;
    if (ideaCount >= 50) {
      console.log(`  ⏭️ Skipping "${topic.name}" (${ideaCount} ideas, >= 50)`);
      continue;
    }
    
    console.log(`\n  📝 "${topic.name}" (${ideaCount} existing ideas, generating 20)`);
    
    // Get existing slugs for this topic
    const existingIdeas = await prisma.idea.findMany({
      where: { ideaTopics: { some: { topicId: topic.id } } },
      select: { slug: true },
    });
    const existingSlugs = existingIdeas.map(i => i.slug.replace(/-\d+$/, ''));
    
    // Generate ideas in batches of 5 (LLM limit)
    let allIdeas: Array<{ title: string; content: string; takeaway: string; slug: string }> = [];
    for (let batch = 0; batch < 4; batch++) {
      const batchIdeas = await generateIdeasForTopic(topic.name, topic.description || '', existingSlugs, topic.id);
      allIdeas = allIdeas.concat(batchIdeas);
      if (allIdeas.length >= 20 || batchIdeas.length === 0) break;
      await new Promise(r => setTimeout(r, 500));
    }
    console.log(`    Total LLM ideas: ${allIdeas.length}`);
    
    // Get max orderIndex
    const maxOrder = await prisma.idea.findFirst({
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    let currentOrder = (maxOrder?.orderIndex ?? -1) + 1;
    
    // Find existing sources for this topic or use any source
    const topicSources = await prisma.sourceTopic.findMany({
      where: { topicId: topic.id },
      select: { sourceId: true },
    });
    
    let availableSourceIds = topicSources.map(s => s.sourceId);
    if (availableSourceIds.length === 0) {
      const allSources = await prisma.source.findMany({ select: { id: true } });
      availableSourceIds = allSources.map(s => s.id);
    }
    
    for (const idea of allIdeas) {
      try {
        const finalSlug = idea.slug.replace(/-\d+$/, '');
        const existing = await prisma.idea.findUnique({ where: { slug: finalSlug } });
        if (existing) {
          totalSkipped++;
          continue;
        }
        
        // Pick first available source (or random)
        const sourceId = availableSourceIds[0] || (await prisma.source.findFirst({ select: { id: true } }))?.id;
        if (!sourceId) {
          console.error(`    ✗ No sources available for topic "${topic.name}"`);
          totalErrors++;
          continue;
        }
        
        const created = await prisma.idea.create({
          data: {
            title: idea.title,
            content: idea.content,
            takeaway: idea.takeaway,
            slug: finalSlug,
            sourceId,
            orderIndex: currentOrder++,
            isPublished: true,
            ideaTopics: {
              create: { topicId: topic.id },
            },
          },
        });
        
        totalCreated++;
        console.log(`    ✓ "${idea.title}" (orderIndex: ${currentOrder - 1})`);
      } catch (e) {
        console.error(`    ✗ Failed "${idea.title}": ${(e as Error).message}`);
        totalErrors++;
      }
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  // ===== STEP 3: Generate ideas for sources with <10 ideas =====
  console.log('\n=== Étape 3: Génération par source (sources avec <10 idées) ===');
  
  const allSources = await prisma.source.findMany({
    include: {
      ideas: { select: { id: true } },
      sourceTopics: { select: { topicId: true } },
    },
  });
  
  const lowIdeaSources = allSources.filter(s => s.ideas.length < 10 && s.ideas.length > 0);
  
  for (const source of lowIdeaSources) {
    const topicIds = source.sourceTopics.map(t => t.topicId);
    console.log(`  📝 "${source.title}" (${source.ideas.length} ideas, generating 10)`);
    
    // Generate ideas in batches of 5 for sources
    let allIdeas: Array<{ title: string; content: string; takeaway: string; slug: string }> = [];
    for (let batch = 0; batch < 2; batch++) {
      const batchIdeas = await generateIdeasForSource(source.title, source.url, source.id, topicIds);
      allIdeas = allIdeas.concat(batchIdeas);
      if (allIdeas.length >= 10 || batchIdeas.length === 0) break;
      await new Promise(r => setTimeout(r, 500));
    }
    console.log(`    Total LLM ideas: ${allIdeas.length}`);
    
    const maxOrder = await prisma.idea.findFirst({
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    let currentOrder = (maxOrder?.orderIndex ?? -1) + 1;
    
    for (const idea of allIdeas) {
      try {
        const finalSlug = idea.slug.replace(/-\d+$/, '');
        const existing = await prisma.idea.findUnique({ where: { slug: finalSlug } });
        if (existing) {
          totalSkipped++;
          continue;
        }
        
        const created = await prisma.idea.create({
          data: {
            title: idea.title,
            content: idea.content,
            takeaway: idea.takeaway,
            slug: finalSlug,
            sourceId: source.id,
            orderIndex: currentOrder++,
            isPublished: true,
            ideaTopics: {
              create: topicIds.map(topicId => ({ topicId })),
            },
          },
        });
        
        totalCreated++;
        console.log(`    ✓ "${idea.title}" (orderIndex: ${currentOrder - 1})`);
      } catch (e) {
        console.error(`    ✗ Failed "${idea.title}": ${(e as Error).message}`);
        totalErrors++;
      }
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  // ===== STEP 4: Create ideas for sources with 0 ideas =====
  console.log('\n=== Étape 4: Sources sans idées (Personnalité, Développement économique) ===');
  
  const zeroIdeaSources = allSources.filter(s => s.ideas.length === 0);
  
  for (const source of zeroIdeaSources) {
    console.log(`  📝 "${source.title}" (0 idées, generating 10)`);
    
    // Get topic IDs from sourceTopics
    const sourceTopicLinks = await prisma.sourceTopic.findMany({
      where: { sourceId: source.id },
      select: { topicId: true },
    });
    const topicIds = sourceTopicLinks.map(t => t.topicId);
    
    // Generate ideas in batches of 5
    let allIdeas: Array<{ title: string; content: string; takeaway: string; slug: string }> = [];
    for (let batch = 0; batch < 2; batch++) {
      const batchIdeas = await generateIdeasForSource(source.title, source.url, source.id, topicIds);
      allIdeas = allIdeas.concat(batchIdeas);
      if (allIdeas.length >= 10 || batchIdeas.length === 0) break;
      await new Promise(r => setTimeout(r, 500));
    }
    console.log(`    Total LLM ideas: ${allIdeas.length}`);
    
    const maxOrder = await prisma.idea.findFirst({
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    let currentOrder = (maxOrder?.orderIndex ?? -1) + 1;
    
    for (const idea of allIdeas) {
      try {
        const finalSlug = idea.slug.replace(/-\d+$/, '');
        const existing = await prisma.idea.findUnique({ where: { slug: finalSlug } });
        if (existing) {
          totalSkipped++;
          continue;
        }
        
        const data: any = {
          title: idea.title,
          content: idea.content,
          takeaway: idea.takeaway,
          slug: finalSlug,
          sourceId: source.id,
          orderIndex: currentOrder++,
          isPublished: true,
        };
        
        if (topicIds.length > 0) {
          data.ideaTopics = {
            create: topicIds.map(topicId => ({ topicId })),
          };
        }
        
        const created = await prisma.idea.create({ data });
        
        totalCreated++;
        console.log(`    ✓ "${idea.title}" (orderIndex: ${currentOrder - 1})`);
      } catch (e) {
        console.error(`    ✗ Failed "${idea.title}": ${(e as Error).message}`);
        totalErrors++;
      }
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  // ===== Summary =====
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n=== Résumé ===`);
  console.log(`Temps total: ${elapsed}s`);
  console.log(`Idées créées: ${totalCreated}`);
  console.log(`Sautées (doublons): ${totalSkipped}`);
  console.log(`Erreurs: ${totalErrors}`);
  
  const finalCount = await prisma.idea.count({ where: { isPublished: true } });
  console.log(`Total idées publiées: ${finalCount}`);
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
