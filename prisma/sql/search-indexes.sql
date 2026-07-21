-- Полнотекстовый и триграммный поиск (rus-конфигурация + fuzzy для опечаток/автодополнения).
-- Не описывается моделями Prisma (expression-индексы), применяется отдельно:
--   npm run db:search-indexes
-- Идемпотентно: безопасно запускать повторно после каждой prisma migrate.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Material: полнотекстовый индекс по заголовку + описанию
CREATE INDEX IF NOT EXISTS material_fts_idx
  ON "Material"
  USING GIN (to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Material: триграммный индекс по заголовку (автодополнение, опечатки)
CREATE INDEX IF NOT EXISTS material_title_trgm_idx
  ON "Material"
  USING GIN (title gin_trgm_ops);

-- Faq: полнотекстовый индекс по вопросу + ответу
CREATE INDEX IF NOT EXISTS faq_fts_idx
  ON "Faq"
  USING GIN (to_tsvector('russian', coalesce(question, '') || ' ' || coalesce(answer, '')));

-- Faq: триграммный индекс по вопросу (автодополнение, опечатки)
CREATE INDEX IF NOT EXISTS faq_question_trgm_idx
  ON "Faq"
  USING GIN (question gin_trgm_ops);
