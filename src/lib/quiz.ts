export interface QuizSource {
  id: string;
  question: string;
  answer: string;
  wrongOptions: string[];
  category: { name: string };
}

export interface QuizQuestion {
  id: string;
  question: string;
  correct: string;
  options: string[];
  category: string;
}

/**
 * Перемешивание Фишера—Йейтса.
 * Популярный приём `sort(() => Math.random() - 0.5)` не годится: компаратор
 * должен быть постоянным, иначе порядок получается неравномерным и зависит
 * от алгоритма сортировки.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Собирает набор вопросов: случайные вопросы, у каждого перемешанные варианты. */
export function buildQuizQuestions(pool: QuizSource[], limit: number): QuizQuestion[] {
  return shuffle(pool)
    .slice(0, limit)
    .map((f) => ({
      id: f.id,
      question: f.question,
      correct: f.answer,
      options: shuffle([f.answer, ...f.wrongOptions]),
      category: f.category.name,
    }));
}
