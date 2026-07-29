import ExcelJS from "exceljs";
import type { DocumentSection, ParsedDocument } from "./types";

// Таблица-квиз (частый формат для аттестации сотрудников): первая строка —
// заголовок вида "Текст вопроса | Ответ 1 (Верный) | Ответ 2 | Ответ 3".
// Колонка A — вопрос, колонка B — правильный ответ; неверные варианты (C, D...)
// в базу знаний не идут — сотруднику нужен готовый ответ, а не варианты теста.
function looksLikeQuizHeader(row: string[]): boolean {
  const question = (row[0] ?? "").toLowerCase();
  const answer = (row[1] ?? "").toLowerCase();
  return question.includes("вопрос") && answer.includes("ответ");
}

// Вопросы и ответы часто продублированы на русском и казахском через "/"
// в одной ячейке — оставляем только первую (русскую) часть.
function stripBilingual(text: string): string {
  const slashIndex = text.indexOf("/");
  return (slashIndex === -1 ? text : text.slice(0, slashIndex)).trim();
}

export function sectionsFromRows(sheetName: string, rows: string[][]): DocumentSection[] {
  if (rows.length === 0) return [];

  if (looksLikeQuizHeader(rows[0])) {
    const sections: DocumentSection[] = [];
    for (const row of rows.slice(1)) {
      const question = stripBilingual(row[0] ?? "");
      const answer = stripBilingual(row[1] ?? "");
      if (question && answer) sections.push({ heading: question, content: answer });
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
      const values = (row.values as ExcelJS.CellValue[])
        .slice(1)
        .map((v) => (v == null ? "" : String(v).trim()));
      if (values.some(Boolean)) rows.push(values);
    });

    sections.push(...sectionsFromRows(sheet.name, rows));
  });

  return { sections };
}
