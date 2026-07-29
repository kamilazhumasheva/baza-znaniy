#!/bin/sh
set -e

echo "Применяю миграции базы данных..."
npx prisma migrate deploy

echo "Обновляю поисковые индексы..."
npx prisma db execute --file prisma/sql/search-indexes.sql --schema prisma/schema.prisma

echo "Проверяю seed-данные (безопасно повторять — upsert)..."
npx prisma db seed || true

echo "Запускаю приложение..."
exec npm start
