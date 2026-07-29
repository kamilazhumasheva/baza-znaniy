import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { FaqItem } from "@/components/faq-item";
import { FavoriteButton } from "@/components/favorite-button";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      category: true,
      author: { select: { name: true } },
      document: true,
      faqs: { where: isAdmin ? {} : { status: "PUBLISHED" } },
    },
  });

  if (!material || (material.status === "DRAFT" && !isAdmin)) notFound();

  let isFavorited = false;
  if (session?.user) {
    await prisma.viewHistory.create({
      data: { userId: session.user.id, targetType: "MATERIAL", materialId: material.id },
    });
    const favorite = await prisma.favorite.findUnique({
      where: { userId_materialId: { userId: session.user.id, materialId: material.id } },
    });
    isFavorited = Boolean(favorite);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href={`/categories/${material.category.slug}`} className="text-sm text-muted hover:text-foreground">
        ← {material.category.name}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{material.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {material.author.name}
            {material.publishedAt && ` · ${new Date(material.publishedAt).toLocaleDateString("ru-RU")}`}
            {material.status === "DRAFT" && " · черновик"}
          </p>
        </div>
        <FavoriteButton
          materialId={material.id}
          initialFavorited={isFavorited}
          isAuthenticated={Boolean(session?.user)}
        />
      </div>

      <p className="whitespace-pre-line text-foreground">{material.description}</p>

      {material.document && isAdmin && (
        <a
          href={`/api/documents/${material.document.id}/file`}
          className="flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" />
          </svg>
          Скачать документ
        </a>
      )}

      {material.faqs.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Связанные вопросы</h2>
          <div className="flex flex-col gap-2">
            {material.faqs.map((f) => (
              <FaqItem key={f.id} question={f.question} answer={f.answer} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
