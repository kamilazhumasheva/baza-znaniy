import { prisma } from "@/lib/db";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Категории</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
