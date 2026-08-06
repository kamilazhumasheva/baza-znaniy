import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEmbeddingProvider, toVectorLiteral } from "@/lib/embeddings";
import { buildSnippet } from "@/lib/snippet";

// Из БД забираем текст с запасом: конкретную выдержку (строки со словом
// из запроса) формирует buildSnippet уже в приложении.
const SNIPPET_SOURCE_LIMIT = 4000;

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
 * Полнотекстовый поиск: websearch_to_tsquery (rus-конфигурация) + триграммное
 * сходство (pg_trgm) как страховка от опечаток и неточных формулировок.
 * Работает всегда, независимо от того, настроен ли семантический поиск.
 */
async function textSearch(params: {
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
        left(m.description, ${SNIPPET_SOURCE_LIMIT}::int) AS snippet,
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
        left(f.answer, ${SNIPPET_SOURCE_LIMIT}::int) AS snippet,
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

export interface SemanticHit {
  type: "MATERIAL" | "FAQ";
  id: string;
  title: string;
  snippet: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  score: number;
}

/**
 * Семантический поиск по косинусному расстоянию (pgvector). Возвращает []
 * если провайдер эмбеддингов не настроен (EMBEDDINGS_API_KEY) или колонка
 * embedding ещё не создана (npm run db:semantic-search-setup не выполнялся) —
 * в этом случае searchContent() ведёт себя как чистый full-text/trgm поиск.
 */
async function semanticSearch(
  query: string,
  categoryId?: string,
  limit = 20,
): Promise<SemanticHit[]> {
  const provider = getEmbeddingProvider();
  if (!provider) return [];

  let literal: string;
  try {
    literal = toVectorLiteral(await provider.embed(query));
  } catch (error) {
    console.error("Семантический поиск: не удалось получить эмбеддинг запроса", error);
    return [];
  }

  const materialCategoryFilter = categoryId
    ? Prisma.sql`AND m."categoryId" = ${categoryId}`
    : Prisma.empty;
  const faqCategoryFilter = categoryId
    ? Prisma.sql`AND f."categoryId" = ${categoryId}`
    : Prisma.empty;

  try {
    return await prisma.$queryRaw<SemanticHit[]>(Prisma.sql`
      SELECT * FROM (
        SELECT
          'MATERIAL' AS type, m.id AS id, m.title AS title,
          left(m.description, ${SNIPPET_SOURCE_LIMIT}::int) AS snippet,
          m."categoryId" AS "categoryId", c.name AS "categoryName", c.slug AS "categorySlug",
          1 - (m.embedding <=> ${literal}::vector) AS score
        FROM "Material" m
        JOIN "Category" c ON c.id = m."categoryId"
        WHERE m.status = 'PUBLISHED' AND m.embedding IS NOT NULL ${materialCategoryFilter}

        UNION ALL

        SELECT
          'FAQ' AS type, f.id AS id, f.question AS title,
          left(f.answer, ${SNIPPET_SOURCE_LIMIT}::int) AS snippet,
          f."categoryId" AS "categoryId", c.name AS "categoryName", c.slug AS "categorySlug",
          1 - (f.embedding <=> ${literal}::vector) AS score
        FROM "Faq" f
        JOIN "Category" c ON c.id = f."categoryId"
        WHERE f.status = 'PUBLISHED' AND f.embedding IS NOT NULL ${faqCategoryFilter}
      ) semantic
      ORDER BY score DESC
      LIMIT ${limit}
    `);
  } catch (error) {
    console.error(
      "Семантический поиск недоступен (вероятно, не выполнен prisma/sql/semantic-search.sql):",
      error,
    );
    return [];
  }
}

/**
 * Объединяет результаты полнотекстового и семантического поиска: элементы,
 * найденные обоими способами, получают бонус к рангу; уникальные семантические
 * совпадения (близкие по смыслу, но без общих слов) добавляются отдельно.
 * Чистая функция — не обращается к БД, поэтому легко тестируется без Postgres.
 */
export function mergeSearchResults(
  textResults: SearchResult[],
  semanticResults: SemanticHit[],
  limit: number,
): SearchResult[] {
  const merged = new Map<string, SearchResult>();

  for (const r of textResults) {
    merged.set(`${r.type}:${r.id}`, { ...r });
  }

  for (const s of semanticResults) {
    const key = `${s.type}:${s.id}`;
    const existing = merged.get(key);
    if (existing) {
      existing.rank += s.score;
    } else {
      merged.set(key, {
        type: s.type,
        id: s.id,
        title: s.title,
        snippet: s.snippet,
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        categorySlug: s.categorySlug,
        rank: s.score,
        sim: 0,
      });
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.rank * 2 + b.sim - (a.rank * 2 + a.sim))
    .slice(0, limit);
}

/**
 * Гибридный поиск: full-text/trgm + (если настроен) семантический слой.
 * Без EMBEDDINGS_API_KEY ведёт себя идентично прежнему textSearch().
 */
export async function searchContent(params: {
  query: string;
  categoryId?: string;
  limit?: number;
}): Promise<SearchResult[]> {
  const { query, categoryId, limit = 20 } = params;
  if (!query.trim()) return [];

  const [text, semantic] = await Promise.all([
    textSearch({ query, categoryId, limit }),
    semanticSearch(query, categoryId, limit),
  ]);

  return mergeSearchResults(text, semantic, limit).map((result) => ({
    ...result,
    snippet: buildSnippet(result.snippet, query),
  }));
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
