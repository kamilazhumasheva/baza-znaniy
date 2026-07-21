import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MaterialCard } from "@/components/material-card";
import { FaqItem } from "@/components/faq-item";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: { orderBy: { order: "asc" } } },
  });

  if (!category) notFound();

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const [materials, faqs] = await Promise.all([
    prisma.material.findMany({
      where: { categoryId: { in: categoryIds }, status: "PUBLISHED" },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.faq.findMany({
      where: { categoryId: { in: categoryIds }, status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{category.name}</h1>
        {category.children.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm text-foreground transition-colors hover:border-accent"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Материалы</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-muted">В этом разделе пока нет материалов.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <MaterialCard
                key={m.id}
                id={m.id}
                title={m.title}
                description={m.description}
                categoryName={m.category.name}
                publishedAt={m.publishedAt}
                pinned={m.pinned}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Частые вопросы</h2>
        {faqs.length === 0 ? (
          <p className="text-sm text-muted">Вопросов в этом разделе пока нет.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {faqs.map((f) => (
              <FaqItem key={f.id} question={f.question} answer={f.answer} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
