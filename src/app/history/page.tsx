import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/history");

  const history = await prisma.viewHistory.findMany({
    where: { userId: session.user.id },
    include: {
      material: { include: { category: true } },
      faq: { include: { category: true } },
    },
    orderBy: { viewedAt: "desc" },
    take: 50,
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">История просмотров</h1>

      {history.length === 0 ? (
        <p className="text-sm text-muted">Вы ещё ничего не просматривали.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((h) => {
            const item = h.material ?? h.faq;
            if (!item) return null;
            const title = h.material ? h.material.title : h.faq!.question;
            const href = h.material ? `/materials/${h.material.id}` : `/categories/${h.faq!.category.slug}`;
            return (
              <Link
                key={h.id}
                href={href}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-accent"
              >
                <span className="text-sm text-foreground">{title}</span>
                <time className="shrink-0 text-xs text-muted">
                  {new Date(h.viewedAt).toLocaleString("ru-RU")}
                </time>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← На главную
      </Link>
    </main>
  );
}
