import { describe, expect, it } from "vitest";
import { sectionsFromHtml } from "@/lib/parsing/docx";
import { sectionsFromText } from "@/lib/parsing/pdf";
import { cellToString, findQuizColumns, sectionsFromRows } from "@/lib/parsing/xlsx";

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

  it("распознаёт таблицу с колонкой нумерации перед вопросом", () => {
    const rows = [
      ["№", "Текст вопроса", "Ответ 1 (Верный)", "Ответ 2", "Ответ 3"],
      ["1", "Какой адрес платформы Qbox?", "qbox.telecom.kz", "неверный", "тоже неверный"],
    ];

    const sections = sectionsFromRows("вопросы по Qbox", rows);

    expect(sections).toEqual([
      { heading: "Какой адрес платформы Qbox?", content: "qbox.telecom.kz" },
    ]);
  });

  it("распознаёт таблицу, где колонка нумерации пустая", () => {
    const rows = [
      ["", "Текст вопроса", "Ответ 1 (Верный)", "Ответ 2"],
      ["1", "Вопрос про ЦАП?", "Верный ответ", "Неверный"],
    ];

    expect(sectionsFromRows("ЦАП", rows)).toEqual([
      { heading: "Вопрос про ЦАП?", content: "Верный ответ" },
    ]);
  });
});

describe("findQuizColumns", () => {
  it("предпочитает колонку, помеченную как верный ответ", () => {
    expect(findQuizColumns(["Текст вопроса", "Ответ 2", "Ответ 1 (Верный)"])).toEqual({
      questionIndex: 0,
      answerIndex: 2,
    });
  });

  it("возвращает null, если это не таблица вопросов", () => {
    expect(findQuizColumns(["Тариф", "Цена"])).toBeNull();
    expect(findQuizColumns(["Текст вопроса"])).toBeNull();
  });
});

describe("cellToString", () => {
  it("берёт результат формулы вместо объекта", () => {
    expect(cellToString({ formula: "A1+B1", result: 1500 })).toBe("1500");
  });

  it("склеивает текст с форматированием", () => {
    expect(
      cellToString({ richText: [{ text: "Bereket " }, { text: "new A" }] }),
    ).toBe("Bereket new A");
  });

  it("берёт текст гиперссылки", () => {
    expect(cellToString({ text: "Прейскурант", hyperlink: "https://example.com" })).toBe(
      "Прейскурант",
    );
  });

  it("не переносит ошибку ячейки в текст", () => {
    expect(cellToString({ error: "#N/A" })).toBe("");
  });

  it("обрабатывает обычные значения", () => {
    expect(cellToString("  текст  ")).toBe("текст");
    expect(cellToString(42)).toBe("42");
    expect(cellToString(null)).toBe("");
  });
});
