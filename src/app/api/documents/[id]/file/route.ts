import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { jsonError } from "@/lib/api";
import { storage } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

const CONTENT_TYPES: Record<string, string> = {
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  PDF: "application/pdf",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Скачивание оригинального файла документа доступно только администратору.
// Сотрудники видят содержимое материала на странице, но не файл-первоисточник.
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return jsonError("Документ не найден", 404);

  const buffer = await storage.read(document.filePath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[document.fileType],
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.title)}${document.filePath.slice(document.filePath.lastIndexOf("."))}`,
    },
  });
}
