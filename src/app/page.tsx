import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SearchBar } from "@/components/search-bar";
import { MaterialCard } from "@/components/material-card";
import { FaqItem } from "@/components/faq-item";

export default async function HomePage() {
  const session = await auth();

  const [categories, recentMaterials, pinnedMaterials, popularFaqViews] = await Promise.all([
    prisma.category.findMany({ where: { parentId: null }, orderBy: { order: "asc" } }),
    prisma.material.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.material.findMany({
      where: { status: "PUBLISHED", pinned: true },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.viewHistory.groupBy({
      by: ["faqId"],
      where: { targetType: "FAQ", faqId: { not: null } },
      _count: { faqId: true },
      orderBy: { _count: { faqId: "desc" } },
      take: 5,
    }),
  ]);

  const popularFaqIds = popularFaqViews.map((v) => v.faqId).filter((id): id is string => Boolean(id));
  const popularFaqs = popularFaqIds.length
    ? await prisma.faq.findMany({ where: { id: { in: popularFaqIds }, status: "PUBLISHED" } })
    : await prisma.faq.findMany({ where: { status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, take: 5 });

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-6 border-b border-border bg-surface px-4 py-14 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {session?.user ? `Здравствуйте, ${session.user.name}` : "Корпоративная база знаний"}
          </h1>
          <p className="mt-2 text-muted">Найдите ответ на рабочий вопрос за несколько секунд</p>
        </div>
        <SearchBar autoFocus />
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-accent"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
        {pinnedMaterials.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">Закреплённые новости</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pinnedMaterials.map((m) => (
                <MaterialCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  description={m.description}
                  categoryName={m.category.name}
                  publishedAt={m.publishedAt}
                  pinned
                />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Последние обновления</h2>
          {recentMaterials.length === 0 ? (
            <p className="text-sm text-muted">Материалов пока нет.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentMaterials.map((m) => (
                <MaterialCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  description={m.description}
                  categoryName={m.category.name}
                  publishedAt={m.publishedAt}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Популярные вопросы</h2>
          {popularFaqs.length === 0 ? (
            <p className="text-sm text-muted">Вопросов пока нет.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {popularFaqs.map((f) => (
                <FaqItem key={f.id} question={f.question} answer={f.answer} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
