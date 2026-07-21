import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [draftMaterials, draftFaqs, documentsCount, usersCount] = await Promise.all([
    prisma.material.count({ where: { status: "DRAFT" } }),
    prisma.faq.count({ where: { status: "DRAFT" } }),
    prisma.document.count(),
    prisma.user.count(),
  ]);

  const cards = [
    { label: "Черновики материалов на проверку", value: draftMaterials, href: "/admin/materials?status=DRAFT" },
    { label: "Черновики вопросов на проверку", value: draftFaqs, href: "/admin/faq?status=DRAFT" },
    { label: "Загруженные документы", value: documentsCount, href: "/admin/documents" },
    { label: "Пользователи", value: usersCount, href: "/admin/users" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Админ-панель</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
          >
            <span className="text-sm text-muted">{c.label}</span>
            <span className="text-3xl font-semibold text-foreground">{c.value}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
