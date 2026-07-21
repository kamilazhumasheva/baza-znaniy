import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MaterialEditForm } from "@/components/admin/material-edit-form";
import { AdminFaqInlineList } from "@/components/admin/faq-inline-list";

export default async function AdminMaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [material, categories] = await Promise.all([
    prisma.material.findUnique({
      where: { id },
      include: { category: true, document: true, faqs: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!material) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">Материал</h1>
      <MaterialEditForm material={material} categories={categories} />

      {material.document && (
        <p className="text-sm text-muted">
          Источник: {material.document.title} (версия {material.document.version})
        </p>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Связанные вопросы (FAQ)</h2>
        <AdminFaqInlineList initialFaqs={material.faqs} categoryId={material.categoryId} materialId={material.id} />
      </div>
    </div>
  );
}
