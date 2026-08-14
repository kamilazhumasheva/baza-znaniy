import ExcelJS from "exceljs";
import type { DocumentSection, ParsedDocument } from "./types";

/**
 * ExcelJS возвращает не только строки и числа: формулы, гиперссылки и текст
 * с форматированием приходят объектами. Без разбора они превращались
 * в «[object Object]» и текст ячейки терялся.
 */
export function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toLocaleDateString("ru-RU");

  if (typeof value === "object") {
    const v = value as Record<string, unknown>;

    // Текст с форматированием: { richText: [{ text }, ...] }.
    // Фрагменты склеиваем как есть — обрезка пробелов у каждого склеила бы слова.
    if (Array.isArray(v.richText)) {
      return v.richText
        .map((part) => {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        })
        .join("")
        .trim();
    }

    // Гиперссылка: { text, hyperlink }
    if (typeof v.text === "string") return v.text.trim();

    // Формула: { formula, result } — нужен вычисленный результат
    if ("result" in v) return cellToString(v.result);

    // Ошибка в ячейке: { error: '#N/A' } — в текст не переносим
    if ("error" in v) return "";
  }

  return "";
}

// Таблица-квиз (частый формат для аттестации сотрудников): строка-заголовок
// вида «№ | Текст вопроса | Ответ 1 (Верный) | Ответ 2 | Ответ 3».
// Колонки ищем по названию, а не по фиксированным местам: перед вопросом
// часто идёт колонка нумерации («№» или вовсе пустая).
export function findQuizColumns(
  header: string[],
): { questionIndex: number; answerIndex: number; wrongIndexes: number[] } | null {
  // Array.from, а не map: map пропускает «дырки» разреженного массива и оставляет
  // их в результате, из-за чего findIndex ниже получил бы undefined.
  const lower = Array.from(header, (h) => (h ?? "").toLowerCase());

  const questionIndex = lower.findIndex((h) => h.includes("вопрос"));
  if (questionIndex === -1) return null;

  // Предпочитаем колонку, явно помеченную как верный ответ.
  const correctIndex = lower.findIndex(
    (h, i) => i > questionIndex && h.includes("ответ") && h.includes("верн"),
  );
  const anyAnswerIndex = lower.findIndex((h, i) => i > questionIndex && h.includes("ответ"));
  const answerIndex = correctIndex !== -1 ? correctIndex : anyAnswerIndex;

  if (answerIndex === -1) return null;

  // Остальные колонки «Ответ N» — неверные варианты. Нужны для самопроверки.
  const wrongIndexes = lower
    .map((h, i) => ({ h, i }))
    .filter(({ h, i }) => i > questionIndex && i !== answerIndex && h.includes("ответ"))
    .map(({ i }) => i);

  return { questionIndex, answerIndex, wrongIndexes };
}

// Вопросы и ответы часто продублированы на русском и казахском через "/"
// в одной ячейке — оставляем только первую (русскую) часть.
function stripBilingual(text: string): string {
  const slashIndex = text.indexOf("/");
  return (slashIndex === -1 ? text : text.slice(0, slashIndex)).trim();
}

export function sectionsFromRows(sheetName: string, rows: string[][]): DocumentSection[] {
  if (rows.length === 0) return [];

  const quiz = findQuizColumns(rows[0]);
  if (quiz) {
    const sections: DocumentSection[] = [];
    for (const row of rows.slice(1)) {
      const question = stripBilingual(row[quiz.questionIndex] ?? "");
      const answer = stripBilingual(row[quiz.answerIndex] ?? "");
      if (!question || !answer) continue;

      const wrongOptions = quiz.wrongIndexes
        .map((i) => stripBilingual(row[i] ?? ""))
        .filter((v) => v && v !== answer);

      sections.push({ heading: question, content: answer, wrongOptions });
    }
    return sections;
  }

  const lines = rows.map((r) => r.filter(Boolean).join(" | ")).filter(Boolean);
  return lines.length > 0 ? [{ heading: sheetName, content: lines.join("\n") }] : [];
}

export async function parseXlsx(buffer: Buffer): Promise<ParsedDocument> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sections: DocumentSection[] = [];

  workbook.eachSheet((sheet) => {
    const rows: string[][] = [];
    sheet.eachRow((row) => {
      // row.values — разреженный массив: нулевой индекс не используется, а пустые
      // ячейки остаются «дырками». Array.from превращает дырки в пустые строки,
      // иначе методы вроде findIndex получают undefined и падают.
      const raw = (row.values ?? []) as ExcelJS.CellValue[];
      const values = Array.from(raw, cellToString).slice(1);
      if (values.some(Boolean)) rows.push(values);
    });

    sections.push(...sectionsFromRows(sheet.name, rows));
  });

  return { sections };
}
