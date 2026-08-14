import { prisma } from "@/lib/db";
import { FeedbackList } from "@/components/admin/feedback-list";

export default async function AdminFeedbackPage() {
  const [items, helpfulCount] = await Promise.all([
    // Показываем неразобранные жалобы: «Нет» и «устарело». Голоса «Да»
    // отдельно разбирать не нужно — они идут в счётчик ниже.
    prisma.feedback.findMany({
      where: { resolved: false, kind: { in: ["NOT_HELPFUL", "OUTDATED"] } },
      include: {
        material: { select: { id: true, title: true } },
        faq: { select: { id: true, question: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.feedback.count({ where: { kind: "HELPFUL" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Отзывы сотрудников</h1>
        <p className="mt-1 text-sm text-muted">
          Сообщения «не помогло» и «устарело». Всего отметок «помогло»: {helpfulCount}.
        </p>
      </div>

      <FeedbackList
        initialItems={items.map((f) => ({
          id: f.id,
          kind: f.kind,
          comment: f.comment,
          createdAt: f.createdAt.toISOString(),
          authorName: f.user?.name ?? null,
          targetTitle: f.material?.title ?? f.faq?.question ?? "—",
          materialId: f.material?.id ?? null,
        }))}
      />
    </div>
  );
}
