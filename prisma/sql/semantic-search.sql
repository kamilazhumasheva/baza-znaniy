-- Опциональная миграция для семантического поиска. Применяется отдельно
-- от основной схемы (npm run db:semantic-search-setup), потому что требует
-- расширения pgvector на сервере Postgres — оно не входит в стандартную
-- поставку (в отличие от pg_trgm) и не нужно, пока не подключён провайдер
-- эмбеддингов (см. src/lib/embeddings.ts, EMBEDDINGS_API_KEY в .env).
--
-- В Docker Compose образ db уже pgvector/pgvector:pg16 — расширение доступно
-- сразу. При локальной установке Postgres без Docker расширение нужно
-- поставить отдельно (https://github.com/pgvector/pgvector#installation).
--
-- Идемпотентно: безопасно запускать повторно.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE "Faq" ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW-индекс для быстрого поиска по косинусному расстоянию.
CREATE INDEX IF NOT EXISTS material_embedding_idx
  ON "Material" USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS faq_embedding_idx
  ON "Faq" USING hnsw (embedding vector_cosine_ops);
