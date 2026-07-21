import { describe, expect, it } from "vitest";
import { extractQAFromText } from "@/lib/pipeline/extractDrafts";

describe("extractQAFromText", () => {
  it("использует заголовок как вопрос, если он оканчивается на «?»", () => {
    const result = extractQAFromText(
      "Как перейти с Januya 3 на Januya 4?",
      "Переход доступен только сотрудникам ЦАП и ЦАП-агентам.",
    );

    expect(result).toEqual([
      {
        question: "Как перейти с Januya 3 на Januya 4?",
        answer: "Переход доступен только сотрудникам ЦАП и ЦАП-агентам.",
      },
    ]);
  });

  it("находит несколько пар вопрос-ответ внутри одной секции", () => {
    const content = [
      "Что такое роуминг?",
      "Это услуга связи за пределами домашней сети.",
      "Как его подключить?",
      "Через приложение или звонок в поддержку.",
    ].join("\n");

    const result = extractQAFromText("Роуминг", content);

    expect(result).toEqual([
      { question: "Что такое роуминг?", answer: "Это услуга связи за пределами домашней сети." },
      { question: "Как его подключить?", answer: "Через приложение или звонок в поддержку." },
    ]);
  });

  it("возвращает пустой массив, если в тексте нет вопросов", () => {
    const result = extractQAFromText("Общая информация", "Просто описательный текст без вопросов.");
    expect(result).toEqual([]);
  });

  it("игнорирует вопрос без последующего ответа", () => {
    const content = "Что делать в этом случае?";
    const result = extractQAFromText("Раздел", content);
    expect(result).toEqual([]);
  });
});
