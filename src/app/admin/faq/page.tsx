import { prisma } from "@/lib/db";
import { AdminFaqList } from "@/components/admin/admin-faq-list";

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter = status === "DRAFT" || status === "PUBLISHED" ? status : undefined;

  const [faqs, categories] = await Promise.all([
    prisma.faq.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Вопросы (FAQ)</h1>
      <AdminFaqList initialFaqs={faqs} categories={categories} initialStatus={statusFilter} />
    </div>
  );
}
