import { describe, expect, it } from "vitest";
import { sectionsFromHtml } from "@/lib/parsing/docx";
import { sectionsFromText } from "@/lib/parsing/pdf";
import { sectionsFromRows } from "@/lib/parsing/xlsx";

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

describe("sectionsFromRows (xlsx)", () => {
  it("распознаёт таблицу-квиз и оставляет только вопрос и верный ответ, без казахского варианта", () => {
    const rows = [
      ["Текст вопроса", "Ответ 1 (Верный)", "Ответ 2", "Ответ 3"],
      [
        "Как называется пакет Казахтелеком ТВ+ в пакете 2026 Keremet TV?/2026 Keremet TV топтамасындағы Казахтелеком ТВ+ топтамасы қалай аталады?",
        "ТВ плюс Optima/TB плюс Optima",
        "ТВ плюс Full/ТВ плюс Full",
        "ТВ плюс Mobile/ТВ плюс Mobile",
      ],
    ];

    const sections = sectionsFromRows("ЦАП", rows);

    expect(sections).toHaveLength(1);
    expect(sections[0]).toEqual({
      heading: "Как называется пакет Казахтелеком ТВ+ в пакете 2026 Keremet TV?",
      content: "ТВ плюс Optima",
    });
  });

  it("пропускает строки без вопроса или ответа", () => {
    const rows = [
      ["Текст вопроса", "Ответ 1 (Верный)"],
      ["", "Пустой вопрос"],
      ["Вопрос без ответа?", ""],
    ];

    expect(sectionsFromRows("Лист", rows)).toEqual([]);
  });

  it("для обычной таблицы (не квиза) использует имя листа и склеивает строки через |", () => {
    const rows = [
      ["Тариф", "Цена"],
      ["Базовый", "1000 тг"],
    ];

    const sections = sectionsFromRows("Тарифы", rows);

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("Тарифы");
    expect(sections[0].content).toBe("Тариф | Цена\nБазовый | 1000 тг");
  });

  it("возвращает пустой массив для пустой таблицы", () => {
    expect(sectionsFromRows("Лист", [])).toEqual([]);
  });
});
