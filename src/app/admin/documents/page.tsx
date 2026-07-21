import { prisma } from "@/lib/db";
import { DocumentsManager } from "@/components/admin/documents-manager";

export default async function AdminDocumentsPage() {
  const [documents, categories] = await Promise.all([
    prisma.document.findMany({
      where: { previousVersionId: null },
      include: { category: true, uploadedBy: { select: { name: true } }, nextVersion: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Документы</h1>
      <DocumentsManager initialDocuments={documents} categories={categories} />
    </div>
  );
}
