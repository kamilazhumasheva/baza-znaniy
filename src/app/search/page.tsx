import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { performSearch } from "@/lib/search";
import { SearchBar } from "@/components/search-bar";
import { SearchCategoryFilter } from "@/components/search-category-filter";

async function SearchResults({
  query,
  categoryId,
}: {
  query: string;
  categoryId?: string;
}) {
  const session = await auth();
  const results = query
    ? await performSearch({ query, categoryId, userId: session?.user?.id })
    : [];

  if (!query) {
    return <p className="text-sm text-muted">Введите запрос, чтобы начать поиск.</p>;
  }

  if (results.length === 0) {
    return <p className="text-sm text-muted">По запросу «{query}» ничего не найдено.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {results.map((r) => (
        <Link
          key={`${r.type}-${r.id}`}
          href={r.type === "MATERIAL" ? `/materials/${r.id}` : `/categories/${r.categorySlug}`}
          className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
              {r.type === "MATERIAL" ? "материал" : "вопрос"} · {r.categoryName}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{r.title}</h3>
          <p className="whitespace-pre-line text-sm text-muted">{r.snippet}</p>
        </Link>
      ))}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string }>;
}) {
  const { q = "", categoryId } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <SearchBar defaultValue={q} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-foreground">
          {q ? `Результаты по запросу «${q}»` : "Поиск"}
        </h1>
        <Suspense>
          <SearchCategoryFilter categories={categories} />
        </Suspense>
      </div>
      <SearchResults query={q} categoryId={categoryId} />
    </main>
  );
}
