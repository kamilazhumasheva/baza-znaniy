import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/documents", label: "Документы" },
  { href: "/admin/materials", label: "Материалы" },
  { href: "/admin/faq", label: "Вопросы (FAQ)" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/feedback", label: "Отзывы сотрудников" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/stats", label: "Статистика" },
  { href: "/admin/changelog", label: "Журнал изменений" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="shrink-0 md:w-56">
        <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
