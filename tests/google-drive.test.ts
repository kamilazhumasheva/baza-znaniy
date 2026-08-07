import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchGoogleDriveDocument,
  fileTypeFromContentDisposition,
  fileTypeFromContentType,
  parseGoogleDriveUrl,
} from "@/lib/google-drive";

describe("parseGoogleDriveUrl", () => {
  it("Google Документ экспортируется в .docx", () => {
    const result = parseGoogleDriveUrl("https://docs.google.com/document/d/ABC123/edit?usp=sharing");

    expect(result).toEqual({
      downloadUrl: "https://docs.google.com/document/d/ABC123/export?format=docx",
      fileType: "DOCX",
    });
  });

  it("Google Таблица экспортируется в .xlsx", () => {
    const result = parseGoogleDriveUrl("https://docs.google.com/spreadsheets/d/XYZ789/edit#gid=0");

    expect(result).toEqual({
      downloadUrl: "https://docs.google.com/spreadsheets/d/XYZ789/export?format=xlsx",
      fileType: "XLSX",
    });
  });

  it("файл на Диске скачивается напрямую, тип определяется позже", () => {
    const result = parseGoogleDriveUrl("https://drive.google.com/file/d/FILE42/view?usp=drive_link");

    expect(result).toEqual({
      downloadUrl: "https://drive.google.com/uc?export=download&id=FILE42",
      fileType: null,
    });
  });

  it("понимает старый формат ссылки с параметром id", () => {
    expect(parseGoogleDriveUrl("https://drive.google.com/open?id=FILE42")?.downloadUrl).toBe(
      "https://drive.google.com/uc?export=download&id=FILE42",
    );
  });

  it("отклоняет ссылки не на Google (защита от обращения сервера к чужим адресам)", () => {
    expect(parseGoogleDriveUrl("https://example.com/file/d/ABC/view")).toBeNull();
    expect(parseGoogleDriveUrl("http://localhost:3001/secret")).toBeNull();
    expect(parseGoogleDriveUrl("https://drive.google.com.evil.com/file/d/ABC/view")).toBeNull();
  });

  it("отклоняет мусор вместо ссылки", () => {
    expect(parseGoogleDriveUrl("просто текст")).toBeNull();
    expect(parseGoogleDriveUrl("")).toBeNull();
  });
});

describe("определение типа файла по заголовкам ответа", () => {
  it("по Content-Type", () => {
    expect(fileTypeFromContentType("application/pdf")).toBe("PDF");
    expect(
      fileTypeFromContentType(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8",
      ),
    ).toBe("XLSX");
    expect(fileTypeFromContentType("text/html")).toBeNull();
    expect(fileTypeFromContentType(null)).toBeNull();
  });

  it("по имени файла из Content-Disposition", () => {
    expect(fileTypeFromContentDisposition('attachment; filename="Тарифы.xlsx"')).toBe("XLSX");
    expect(fileTypeFromContentDisposition('attachment; filename="Приказ.PDF"')).toBe("PDF");
    expect(fileTypeFromContentDisposition('attachment; filename="photo.png"')).toBeNull();
  });
});

function mockResponse(body: Buffer, headers: Record<string, string>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
      arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    })),
  );
}

describe("fetchGoogleDriveDocument", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("скачивает Google Таблицу и проставляет тип XLSX", async () => {
    mockResponse(Buffer.from("данные таблицы"), {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await fetchGoogleDriveDocument(
      "https://docs.google.com/spreadsheets/d/ABC/edit",
    );

    expect(result.fileType).toBe("XLSX");
    expect(result.buffer.toString()).toBe("данные таблицы");
  });

  it("для файла на Диске определяет тип по заголовкам ответа", async () => {
    mockResponse(Buffer.from("%PDF-1.4"), { "content-type": "application/pdf" });

    const result = await fetchGoogleDriveDocument("https://drive.google.com/file/d/ABC/view");

    expect(result.fileType).toBe("PDF");
  });

  it("сообщает понятную ошибку, если Google отдал страницу вместо файла", async () => {
    mockResponse(Buffer.from("<html>Sign in</html>"), { "content-type": "text/html; charset=utf-8" });

    await expect(
      fetchGoogleDriveDocument("https://drive.google.com/file/d/ABC/view"),
    ).rejects.toThrow(/Откройте доступ к файлу по ссылке/);
  });

  it("отклоняет слишком большой файл", async () => {
    mockResponse(Buffer.from("x"), {
      "content-type": "application/pdf",
      "content-length": String(100 * 1024 * 1024),
    });

    await expect(
      fetchGoogleDriveDocument("https://drive.google.com/file/d/ABC/view"),
    ).rejects.toThrow(/слишком большой/);
  });
});
