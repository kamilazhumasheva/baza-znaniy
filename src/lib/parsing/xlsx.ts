import ExcelJS from "exceljs";
import type { DocumentSection, ParsedDocument } from "./types";

// Каждый лист Excel становится отдельной секцией; строки сериализуются
// в читаемую таблицу "значение | значение", первая строка считается заголовком таблицы.
export async function parseXlsx(buffer: Buffer): Promise<ParsedDocument> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sections: DocumentSection[] = [];

  workbook.eachSheet((sheet) => {
    const rows: string[] = [];
    sheet.eachRow((row) => {
      const values = (row.values as ExcelJS.CellValue[])
        .slice(1)
        .map((v) => (v == null ? "" : String(v).trim()))
        .filter(Boolean);
      if (values.length > 0) rows.push(values.join(" | "));
    });

    if (rows.length > 0) {
      sections.push({ heading: sheet.name, content: rows.join("\n") });
    }
  });

  return { sections };
}
