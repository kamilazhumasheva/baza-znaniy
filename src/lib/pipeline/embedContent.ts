import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEmbeddingProvider, toVectorLiteral } from "@/lib/embeddings";

async function embedText(text: string): Promise<string | null> {
  const provider = getEmbeddingProvider();
  if (!provider) return null;

  try {
    const vector = await provider.embed(text);
    return toVectorLiteral(vector);
  } catch (error) {
    console.error("Не удалось получить эмбеддинг:", error);
    return null;
  }
}

async function storeEmbedding(table: "Material" | "Faq", id: string, literal: string) {
  try {
    await prisma.$executeRaw`UPDATE ${Prisma.raw(`"${table}"`)} SET embedding = ${literal}::vector WHERE id = ${id}`;
  } catch (error) {
    // Колонка embedding появляется только после `npm run db:semantic-search-setup`.
    console.error(
      `Не удалось сохранить эмбеддинг для ${table} ${id} — вероятно, не выполнен prisma/sql/semantic-search.sql:`,
      error,
    );
  }
}

export async function setMaterialEmbedding(id: string, text: string): Promise<void> {
  const literal = await embedText(text);
  if (literal) await storeEmbedding("Material", id, literal);
}

export async function setFaqEmbedding(id: string, text: string): Promise<void> {
  const literal = await embedText(text);
  if (literal) await storeEmbedding("Faq", id, literal);
}
