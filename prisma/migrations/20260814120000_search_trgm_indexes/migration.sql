-- Триграммные индексы для поиска с опечатками.
-- Раньше создавались только скриптом prisma/sql/search-indexes.sql и отсутствовали
-- в истории миграций, из-за чего Prisma считала базу «разошедшейся» со схемой
-- и на каждой новой миграции предлагала сбросить данные.
--
-- IF NOT EXISTS: на существующих базах индексы уже созданы скриптом,
-- миграция должна пройти без ошибок.

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE INDEX IF NOT EXISTS "material_title_trgm_idx" ON "Material" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "faq_question_trgm_idx" ON "Faq" USING GIN ("question" gin_trgm_ops);
