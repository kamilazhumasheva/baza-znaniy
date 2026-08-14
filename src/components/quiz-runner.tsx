"use client";

import { useState } from "react";
import clsx from "clsx";

export interface QuizQuestion {
  id: string;
  question: string;
  correct: string;
  options: string[];
  category: string;
}

export function QuizRunner({ questions }: { questions: QuizQuestion[] }) {
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[step];
  const isLast = step === questions.length - 1;
  const answered = chosen !== null;

  function choose(option: string) {
    if (answered) return;
    setChosen(option);
    if (option === current.correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setStep((s) => s + 1);
    setChosen(null);
  }

  if (finished) {
    const percent = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-10 text-center">
        <p className="text-4xl font-semibold text-foreground">
          {correctCount} из {questions.length}
        </p>
        <p className="text-muted">
          {percent >= 80
            ? "Отличный результат — материал усвоен."
            : percent >= 50
              ? "Неплохо. Стоит перечитать темы, где ошиблись."
              : "Есть что подтянуть. Попробуйте пройти ещё раз после чтения материалов."}
        </p>
        <a
          href="/quiz"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Пройти заново
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Вопрос {step + 1} из {questions.length}
        </span>
        <span>{current.category}</span>
      </div>

      {/* полоса прогресса */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${((step + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <h2 className="text-lg font-medium text-foreground">{current.question}</h2>

      <div className="flex flex-col gap-2">
        {current.options.map((option) => {
          const isCorrect = option === current.correct;
          const isChosen = option === chosen;

          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              disabled={answered}
              className={clsx(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                !answered && "border-border bg-surface hover:border-accent",
                // После ответа подсвечиваем верный вариант всегда — человек
                // должен уйти со страницы, зная правильный ответ.
                answered && isCorrect && "border-accent bg-accent/10 text-foreground",
                answered && isChosen && !isCorrect && "border-danger bg-danger/10 text-foreground",
                answered && !isCorrect && !isChosen && "border-border bg-surface text-muted",
              )}
            >
              {option}
              {answered && isCorrect && <span className="ml-2 text-accent">— верно</span>}
              {answered && isChosen && !isCorrect && (
                <span className="ml-2 text-danger">— ваш ответ</span>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <button
          type="button"
          onClick={next}
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {isLast ? "Показать результат" : "Следующий вопрос"}
        </button>
      )}
    </div>
  );
}
