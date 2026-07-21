import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { FaqItem } from "@/components/faq-item";
import { MaterialCard } from "@/components/material-card";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      material: { include: { category: true } },
      faq: { include: { category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const materials = favorites.filter((f) => f.material).map((f) => f.material!);
  const faqs = favorites.filter((f) => f.faq).map((f) => f.faq!);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Избранное</h1>

      {favorites.length === 0 ? (
        <p className="text-sm text-muted">
          Пока пусто. Добавляйте материалы и вопросы в избранное значком ★ на странице материала.
        </p>
      ) : (
        <>
          {materials.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Материалы</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((m) => (
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
            </section>
          )}

          {faqs.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Вопросы</h2>
              <div className="flex flex-col gap-2">
                {faqs.map((f) => (
                  <FaqItem key={f.id} question={f.question} answer={f.answer} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← На главную
      </Link>
    </main>
  );
}
