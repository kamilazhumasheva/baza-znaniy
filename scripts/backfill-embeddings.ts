// Разовый пересчёт эмбеддингов для контента, созданного до подключения
// EMBEDDINGS_API_KEY (новый/изменённый контент получает эмбеддинг автоматически).
// Запуск: npx tsx scripts/backfill-embeddings.ts

import { prisma } from "../src/lib/db";
import { getEmbeddingProvider } from "../src/lib/embeddings";
import { setFaqEmbedding, setMaterialEmbedding } from "../src/lib/pipeline/embedContent";

async function main() {
  if (!getEmbeddingProvider()) {
    console.error("EMBEDDINGS_API_KEY не задан — нечего пересчитывать.");
    process.exit(1);
  }

  const materials = await prisma.material.findMany({ select: { id: true, title: true, description: true } });
  const faqs = await prisma.faq.findMany({ select: { id: true, question: true, answer: true } });

  console.log(`Материалов: ${materials.length}, вопросов: ${faqs.length}`);

  for (const m of materials) {
    await setMaterialEmbedding(m.id, `${m.title}\n${m.description}`);
    console.log(`Material ${m.id} — готово`);
  }

  for (const f of faqs) {
    await setFaqEmbedding(f.id, `${f.question}\n${f.answer}`);
    console.log(`Faq ${f.id} — готово`);
  }

  console.log("Пересчёт завершён.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
