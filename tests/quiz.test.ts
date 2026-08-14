import { describe, expect, it } from "vitest";
import { buildQuizQuestions, shuffle, type QuizSource } from "@/lib/quiz";

describe("shuffle", () => {
  it("сохраняет все элементы, ничего не теряя и не дублируя", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffle(input);

    expect(result).toHaveLength(input.length);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
  });

  it("не меняет исходный массив", () => {
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it("даёт равномерное распределение (первый элемент бывает разным)", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(shuffle([1, 2, 3, 4, 5])[0]);
    // При равномерном перемешивании на первой позиции должны побывать все элементы.
    expect(seen.size).toBe(5);
  });

  it("не падает на пустом массиве и на одном элементе", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["один"])).toEqual(["один"]);
  });
});

describe("buildQuizQuestions", () => {
  const pool: QuizSource[] = [
    {
      id: "1",
      question: "Сколько каналов в пакете?",
      answer: "160+",
      wrongOptions: ["80", "200"],
      category: { name: "Тарифы" },
    },
    {
      id: "2",
      question: "Кто выполняет переход?",
      answer: "ЦАП",
      wrongOptions: ["ПСС"],
      category: { name: "Обучение" },
    },
  ];

  it("верный ответ всегда среди вариантов", () => {
    for (const q of buildQuizQuestions(pool, 10)) {
      expect(q.options).toContain(q.correct);
    }
  });

  it("варианты содержат верный ответ и все неверные", () => {
    const question = buildQuizQuestions(pool, 10).find((q) => q.id === "1")!;
    expect([...question.options].sort()).toEqual(["160+", "200", "80"]);
  });

  it("ограничивает количество вопросов", () => {
    expect(buildQuizQuestions(pool, 1)).toHaveLength(1);
  });

  it("возвращает пустой набор, если вопросов нет", () => {
    expect(buildQuizQuestions([], 10)).toEqual([]);
  });
});
