import Link from "next/link";
import { prisma } from "@/lib/db";
import { QuizRunner } from "@/components/quiz-runner";
import { buildQuizQuestions } from "@/lib/quiz";

export const metadata = {
  title: "Самопроверка — Быстрый помощник",
};

const QUESTIONS_PER_RUN = 10;

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId } = await searchParams;

  // В тренажёр идут только вопросы, у которых есть неверные варианты:
  // без них не из чего собрать выбор ответа.
  const pool = await prisma.faq.findMany({
    where: {
      status: "PUBLISHED",
      NOT: { wrongOptions: { isEmpty: true } },
      ...(categoryId ? { categoryId } : {}),
    },
    select: {
      id: true,
      question: true,
      answer: true,
      wrongOptions: true,
      category: { select: { id: true, name: true } },
    },
  });

  const categories = await prisma.category.findMany({
    where: { faqs: { some: { status: "PUBLISHED", NOT: { wrongOptions: { isEmpty: true } } } } },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  // Перемешиваем на сервере: при каждом заходе набор вопросов новый,
  // и клиенту не нужно тянуть весь пул целиком.
  const questions = buildQuizQuestions(pool, QUESTIONS_PER_RUN);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Самопроверка</h1>
        <p className="mt-1 text-sm text-muted">
          Вопросы из загруженных тестов. Результат нигде не сохраняется — это тренировка для себя.
        </p>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/quiz"
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              !categoryId ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground hover:border-accent"
            }`}
          >
            Все темы
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/quiz?categoryId=${c.id}`}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                categoryId === c.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-foreground hover:border-accent"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          Пока нет вопросов для самопроверки. Они появятся, когда администратор загрузит документ
          с таблицей вида «Текст вопроса | Ответ 1 (Верный) | Ответ 2 | Ответ 3» и опубликует
          созданные вопросы.
        </div>
      ) : (
        <QuizRunner questions={questions} />
      )}
    </main>
  );
}
