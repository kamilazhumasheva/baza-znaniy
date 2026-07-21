import { describe, expect, it } from "vitest";
import { sectionsFromHtml } from "@/lib/parsing/docx";
import { sectionsFromText } from "@/lib/parsing/pdf";

describe("sectionsFromHtml (docx)", () => {
  it("делит документ на секции по заголовкам h1-h6", () => {
    const html = `
      <h1>Продажи</h1>
      <p>Общее описание раздела.</p>
      <h2>Скрипт звонка</h2>
      <p>Первая строка скрипта.</p>
      <p>Вторая строка скрипта.</p>
    `;

    const sections = sectionsFromHtml(html);

    expect(sections).toHaveLength(2);
    expect(sections[0]).toEqual({ heading: "Продажи", content: "Общее описание раздела." });
    expect(sections[1].heading).toBe("Скрипт звонка");
    expect(sections[1].content).toBe("Первая строка скрипта.\nВторая строка скрипта.");
  });

  it("использует первую строку как заголовок, если h-тегов нет", () => {
    const html = `<p>Просто параграф без заголовка</p><p>Ещё текст</p>`;
    const sections = sectionsFromHtml(html);

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("Просто параграф без заголовка");
  });

  it("возвращает пустой массив для пустого документа", () => {
    expect(sectionsFromHtml("")).toEqual([]);
  });
});

describe("sectionsFromText (pdf)", () => {
  it("определяет короткую первую строку блока как заголовок", () => {
    const text = [
      "Тарифы",
      "Описание тарифного плана на нескольких строках.",
      "Ещё одна строка описания.",
    ].join("\n");

    const sections = sectionsFromText(text);

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("Тарифы");
    expect(sections[0].content).toContain("Описание тарифного плана");
  });

  it("разделяет блоки текста, отделённые пустой строкой", () => {
    const text = "Раздел 1\nТекст первого раздела.\n\nРаздел 2\nТекст второго раздела.";
    const sections = sectionsFromText(text);

    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("Раздел 1");
    expect(sections[1].heading).toBe("Раздел 2");
  });

  it("возвращает пустой массив для пустого текста", () => {
    expect(sectionsFromText("")).toEqual([]);
  });
});
