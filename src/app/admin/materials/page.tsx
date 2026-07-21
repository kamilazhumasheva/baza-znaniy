import { prisma } from "@/lib/db";
import { AdminMaterialsList } from "@/components/admin/materials-list";

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter = status === "DRAFT" || status === "PUBLISHED" ? status : undefined;

  const [materials, categories] = await Promise.all([
    prisma.material.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Материалы</h1>
      <AdminMaterialsList initialMaterials={materials} categories={categories} initialStatus={statusFilter} />
    </div>
  );
}
