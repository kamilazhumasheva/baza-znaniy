import type { FileType } from "@prisma/client";
import type { ParsedDocument } from "./types";
import { parseDocx } from "./docx";
import { parsePdf } from "./pdf";
import { parseXlsx } from "./xlsx";

export type { DocumentSection, ParsedDocument } from "./types";

export async function parseDocument(buffer: Buffer, fileType: FileType): Promise<ParsedDocument> {
  switch (fileType) {
    case "DOCX":
      return parseDocx(buffer);
    case "PDF":
      return parsePdf(buffer);
    case "XLSX":
      return parseXlsx(buffer);
    default:
      throw new Error(`Неподдерживаемый тип файла: ${fileType}`);
  }
}

export function fileTypeFromName(name: string): FileType {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "docx") return "DOCX";
  if (ext === "pdf") return "PDF";
  if (ext === "xlsx") return "XLSX";
  throw new Error("Поддерживаются только файлы .docx, .pdf, .xlsx");
}
