import type { FileType } from "@prisma/client";
import { PublicError } from "@/lib/api";

export interface GoogleDriveSource {
  /** Прямая ссылка для скачивания/экспорта файла */
  downloadUrl: string;
  /** Тип известен заранее только для нативных Google Docs/Sheets */
  fileType: FileType | null;
}

// Разрешаем обращаться только к доменам Google: ссылку вводит администратор,
// а запрос выполняет сервер — без белого списка это была бы дыра SSRF
// (можно было бы заставить сервер сходить во внутреннюю сеть).
const ALLOWED_HOSTS = new Set(["docs.google.com", "drive.google.com"]);

/** До 25 МБ — защита от выкачивания гигантского файла в память сервера. */
export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Превращает ссылку Google Drive в прямую ссылку на скачивание.
 * Поддерживаются:
 *  - Google Документы   → экспорт в .docx
 *  - Google Таблицы     → экспорт в .xlsx
 *  - Файл на Диске      → скачивание как есть (.docx/.pdf/.xlsx)
 * Возвращает null, если ссылка не распознана.
 */
export function parseGoogleDriveUrl(rawUrl: string): GoogleDriveSource | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) return null;

  const docMatch = url.pathname.match(/^\/document\/d\/([^/]+)/);
  if (docMatch) {
    return {
      downloadUrl: `https://docs.google.com/document/d/${docMatch[1]}/export?format=docx`,
      fileType: "DOCX",
    };
  }

  const sheetMatch = url.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
  if (sheetMatch) {
    return {
      downloadUrl: `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=xlsx`,
      fileType: "XLSX",
    };
  }

  const fileMatch = url.pathname.match(/^\/file\/d\/([^/]+)/);
  const idParam = url.searchParams.get("id");
  const fileId = fileMatch?.[1] ?? idParam;

  if (fileId) {
    return {
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      fileType: null, // определим по ответу сервера
    };
  }

  return null;
}

const CONTENT_TYPE_TO_FILE_TYPE: Record<string, FileType> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
};

export function fileTypeFromContentType(contentType: string | null): FileType | null {
  if (!contentType) return null;
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  return CONTENT_TYPE_TO_FILE_TYPE[normalized] ?? null;
}

export function fileTypeFromContentDisposition(disposition: string | null): FileType | null {
  if (!disposition) return null;
  const lower = disposition.toLowerCase();
  if (lower.includes(".docx")) return "DOCX";
  if (lower.includes(".xlsx")) return "XLSX";
  if (lower.includes(".pdf")) return "PDF";
  return null;
}

export class GoogleDriveError extends PublicError {}

/** Скачивает файл по ссылке Google Drive и определяет его тип. */
export async function fetchGoogleDriveDocument(
  rawUrl: string,
): Promise<{ buffer: Buffer; fileType: FileType }> {
  const source = parseGoogleDriveUrl(rawUrl);
  if (!source) {
    throw new GoogleDriveError(
      "Не удалось распознать ссылку. Вставьте ссылку на Google Документ, Google Таблицу или файл на Google Диске.",
    );
  }

  const res = await fetch(source.downloadUrl, { redirect: "follow" });

  if (!res.ok) {
    throw new GoogleDriveError(
      `Google Диск вернул ошибку ${res.status}. Проверьте, что доступ к файлу открыт «Всем, у кого есть ссылка».`,
    );
  }

  const contentType = res.headers.get("content-type");
  const disposition = res.headers.get("content-disposition");

  // Если файл закрыт для доступа, Google отдаёт HTML-страницу входа вместо файла.
  if (contentType?.includes("text/html")) {
    throw new GoogleDriveError(
      "Google Диск вернул страницу вместо файла. Откройте доступ к файлу по ссылке («Всем, у кого есть ссылка» → «Читатель») и попробуйте снова.",
    );
  }

  const declaredSize = Number(res.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_DOWNLOAD_BYTES) {
    throw new GoogleDriveError("Файл слишком большой (больше 25 МБ).");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
    throw new GoogleDriveError("Файл слишком большой (больше 25 МБ).");
  }

  const fileType =
    source.fileType ??
    fileTypeFromContentType(contentType) ??
    fileTypeFromContentDisposition(disposition);

  if (!fileType) {
    throw new GoogleDriveError(
      "Не удалось определить тип файла. Поддерживаются только .docx, .pdf и .xlsx (а также Google Документы и Таблицы).",
    );
  }

  return { buffer, fileType };
}

export function extensionFor(fileType: FileType): string {
  return fileType === "DOCX" ? ".docx" : fileType === "XLSX" ? ".xlsx" : ".pdf";
}
