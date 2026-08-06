import { describe, expect, it } from "vitest";
import { buildSnippet, queryNeedles } from "@/lib/snippet";

describe("queryNeedles", () => {
  it("разбивает запрос на слова и отбрасывает окончания у длинных слов", () => {
    expect(queryNeedles("роуминга")).toEqual(["роумин"]);
  });

  it("короткие слова оставляет как есть", () => {
    expect(queryNeedles("тариф")).toEqual(["тариф"]);
  });

  it("игнорирует знаки препинания и односимвольные слова", () => {
    expect(queryNeedles("ТВ+, а Optima?")).toEqual(["тв", "optim"]);
  });
});

describe("buildSnippet", () => {
  const quizText = [
    "1 | Как называется пакет Казахтелеком ТВ+ в пакете 2026 Keremet TV? | ТВ плюс Optima",
    "2 | Наполнение пакета ТВ плюс Optima | 160+ каналов, онлайн кинотеатры 7 шт.",
    "3 | Какая услуга не входит в пакет роуминга | Международные звонки",
  ].join("\n");

  it("возвращает строку, в которой встретилось искомое слово, а не начало текста", () => {
    const snippet = buildSnippet(quizText, "роуминг");

    expect(snippet).toBe("3 | Какая услуга не входит в пакет роуминга | Международные звонки");
    expect(snippet).not.toContain("Keremet");
  });

  it("находит строку по слову в другой форме (роуминга → роуминг)", () => {
    expect(buildSnippet("Услуга роуминг доступна всем", "роуминга")).toContain("роуминг");
  });

  it("возвращает несколько строк, если слово встретилось в нескольких", () => {
    const snippet = buildSnippet(quizText, "Optima");

    expect(snippet).toContain("Keremet TV");
    expect(snippet).toContain("160+ каналов");
  });

  it("для длинной строки без переносов показывает окно вокруг найденного слова", () => {
    const longLine = `${"а".repeat(600)} роуминг ${"б".repeat(600)}`;
    const snippet = buildSnippet(longLine, "роуминг");

    expect(snippet).toContain("роуминг");
    expect(snippet.length).toBeLessThanOrEqual(322);
    expect(snippet.startsWith("…")).toBe(true);
  });

  it("если слово в тексте не встречается — возвращает начало текста", () => {
    const snippet = buildSnippet(quizText, "тарификация");

    expect(snippet.startsWith("1 | Как называется пакет")).toBe(true);
  });

  it("не падает на пустом тексте и пустом запросе", () => {
    expect(buildSnippet("", "роуминг")).toBe("");
    expect(buildSnippet("Какой-то текст", "")).toBe("Какой-то текст");
  });
});
