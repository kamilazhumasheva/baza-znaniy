import { prisma } from "@/lib/db";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Создание",
  UPDATE: "Изменение",
  DELETE: "Удаление",
  PUBLISH: "Публикация",
  UPLOAD_VERSION: "Загрузка версии",
};

export default async function AdminChangelogPage() {
  const entries = await prisma.changeLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Журнал изменений</h1>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Дата</th>
              <th className="px-4 py-2 font-medium">Кто</th>
              <th className="px-4 py-2 font-medium">Действие</th>
              <th className="px-4 py-2 font-medium">Объект</th>
              <th className="px-4 py-2 font-medium">Детали</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-2 text-muted">{new Date(e.createdAt).toLocaleString("ru-RU")}</td>
                <td className="px-4 py-2 text-foreground">{e.user.name}</td>
                <td className="px-4 py-2 text-foreground">{ACTION_LABELS[e.action] ?? e.action}</td>
                <td className="px-4 py-2 text-muted">
                  {e.entityType} · {e.entityId.slice(0, 8)}
                </td>
                <td className="px-4 py-2 text-muted">{e.details ?? "—"}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Записей пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
