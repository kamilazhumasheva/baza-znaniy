import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface SearchResult {
  type: "MATERIAL" | "FAQ";
  id: string;
  title: string;
  snippet: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  rank: number;
  sim: number;
}

/**
 * Гибридный поиск: полнотекстовый (websearch_to_tsquery, rus-конфигурация)
 * + триграммное сходство (pg_trgm) как страховка от опечаток и неточных формулировок.
 * Результат ранжируется комбинированным скором ts_rank*2 + similarity.
 */
export async function searchContent(params: {
  query: string;
  categoryId?: string;
  limit?: number;
}): Promise<SearchResult[]> {
  const { query, categoryId, limit = 20 } = params;
  if (!query.trim()) return [];

  const materialCategoryFilter = categoryId
    ? Prisma.sql`AND m."categoryId" = ${categoryId}`
    : Prisma.empty;
  const faqCategoryFilter = categoryId
    ? Prisma.sql`AND f."categoryId" = ${categoryId}`
    : Prisma.empty;

  const results = await prisma.$queryRaw<SearchResult[]>(Prisma.sql`
    SELECT * FROM (
      SELECT
        'MATERIAL' AS type,
        m.id AS id,
        m.title AS title,
        left(m.description, 240) AS snippet,
        m."categoryId" AS "categoryId",
        c.name AS "categoryName",
        c.slug AS "categorySlug",
        ts_rank(
          to_tsvector('russian', coalesce(m.title, '') || ' ' || coalesce(m.description, '')),
          websearch_to_tsquery('russian', ${query})
        ) AS rank,
        similarity(m.title, ${query}) AS sim
      FROM "Material" m
      JOIN "Category" c ON c.id = m."categoryId"
      WHERE m.status = 'PUBLISHED'
        ${materialCategoryFilter}
        AND (
          to_tsvector('russian', coalesce(m.title, '') || ' ' || coalesce(m.description, ''))
            @@ websearch_to_tsquery('russian', ${query})
          OR m.title % ${query}
        )

      UNION ALL

      SELECT
        'FAQ' AS type,
        f.id AS id,
        f.question AS title,
        left(f.answer, 240) AS snippet,
        f."categoryId" AS "categoryId",
        c.name AS "categoryName",
        c.slug AS "categorySlug",
        ts_rank(
          to_tsvector('russian', coalesce(f.question, '') || ' ' || coalesce(f.answer, '')),
          websearch_to_tsquery('russian', ${query})
        ) AS rank,
        similarity(f.question, ${query}) AS sim
      FROM "Faq" f
      JOIN "Category" c ON c.id = f."categoryId"
      WHERE f.status = 'PUBLISHED'
        ${faqCategoryFilter}
        AND (
          to_tsvector('russian', coalesce(f.question, '') || ' ' || coalesce(f.answer, ''))
            @@ websearch_to_tsquery('russian', ${query})
          OR f.question % ${query}
        )
    ) results
    ORDER BY (rank * 2 + sim) DESC
    LIMIT ${limit}
  `);

  return results;
}

export async function performSearch(params: {
  query: string;
  categoryId?: string;
  userId?: string;
}): Promise<SearchResult[]> {
  const { query, categoryId, userId } = params;
  const results = await searchContent({ query, categoryId });

  if (query.trim()) {
    await prisma.searchLog.create({
      data: { userId, query: query.trim(), resultsCount: results.length },
    });
  }

  return results;
}

export interface SuggestResult {
  type: "MATERIAL" | "FAQ";
  id: string;
  title: string;
}

export async function suggestContent(query: string, limit = 8): Promise<SuggestResult[]> {
  if (!query.trim()) return [];

  return prisma.$queryRaw<SuggestResult[]>(Prisma.sql`
    SELECT * FROM (
      SELECT 'MATERIAL' AS type, m.id AS id, m.title AS title, similarity(m.title, ${query}) AS sim
      FROM "Material" m
      WHERE m.status = 'PUBLISHED' AND (m.title ILIKE ${"%" + query + "%"} OR m.title % ${query})

      UNION ALL

      SELECT 'FAQ' AS type, f.id AS id, f.question AS title, similarity(f.question, ${query}) AS sim
      FROM "Faq" f
      WHERE f.status = 'PUBLISHED' AND (f.question ILIKE ${"%" + query + "%"} OR f.question % ${query})
    ) suggestions
    ORDER BY sim DESC
    LIMIT ${limit}
  `);
}
