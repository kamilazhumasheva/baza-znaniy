import { getAdminStats } from "@/lib/stats";

export default async function AdminStatsPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Пользователи", value: stats.totals.usersCount },
    { label: "Материалы (опубл.)", value: stats.totals.materialsCount - stats.totals.draftMaterialsCount },
    { label: "Материалы (черновики)", value: stats.totals.draftMaterialsCount },
    { label: "Вопросы (опубл.)", value: stats.totals.faqsCount - stats.totals.draftFaqsCount },
    { label: "Вопросы (черновики)", value: stats.totals.draftFaqsCount },
    { label: "Документы", value: stats.totals.documentsCount },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">Статистика</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="text-2xl font-semibold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Популярные запросы</h2>
          <ol className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 text-sm">
            {stats.topQueries.length === 0 && <li className="text-muted">Пока нет данных</li>}
            {stats.topQueries.map((q) => (
              <li key={q.query} className="flex items-center justify-between gap-2">
                <span className="text-foreground">{q.query}</span>
                <span className="text-muted">{q.count}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Запросы без результатов</h2>
          <ol className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 text-sm">
            {stats.noResultQueries.length === 0 && <li className="text-muted">Пока нет данных</li>}
            {stats.noResultQueries.map((q) => (
              <li key={q.query} className="flex items-center justify-between gap-2">
                <span className="text-foreground">{q.query}</span>
                <span className="text-muted">{q.count}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Активность по разделам</h2>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 text-sm">
          {stats.categoryActivity.length === 0 && <p className="text-muted">Пока нет данных</p>}
          {stats.categoryActivity.map((c) => (
            <div key={c.categoryName} className="flex items-center justify-between gap-2">
              <span className="text-foreground">{c.categoryName}</span>
              <span className="text-muted">{c.views} просмотров</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
