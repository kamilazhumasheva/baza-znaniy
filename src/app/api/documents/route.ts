import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { jsonError, handleApiError } from "@/lib/api";
import { logChange } from "@/lib/changelog";
import { storage } from "@/lib/storage";
import { fileTypeFromName, parseDocument } from "@/lib/parsing";
import { generateDraftsFromDocument } from "@/lib/pipeline/extractDrafts";
import { extensionFor, fetchGoogleDriveDocument } from "@/lib/google-drive";
import type { FileType } from "@prisma/client";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const documents = await prisma.document.findMany({
    where: { previousVersionId: null },
    include: { category: true, uploadedBy: { select: { name: true } }, nextVersion: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const sourceUrl = form.get("sourceUrl");
    const title = form.get("title");
    const categoryId = form.get("categoryId");

    if (typeof title !== "string" || !title.trim()) return jsonError("Название обязательно", 422);
    if (typeof categoryId !== "string" || !categoryId) return jsonError("Категория обязательна", 422);

    const hasFile = file instanceof File && file.size > 0;
    const hasUrl = typeof sourceUrl === "string" && sourceUrl.trim().length > 0;
    if (!hasFile && !hasUrl) {
      return jsonError("Загрузите файл или укажите ссылку на Google Диск", 422);
    }

    // Документ можно либо загрузить файлом, либо взять по ссылке с Google Диска —
    // дальше обе ветки обрабатываются одинаково.
    let fileType: FileType;
    let buffer: Buffer;
    let storageName: string;

    if (hasFile) {
      fileType = fileTypeFromName(file.name);
      buffer = Buffer.from(await file.arrayBuffer());
      storageName = file.name;
    } else {
      const downloaded = await fetchGoogleDriveDocument(sourceUrl as string);
      fileType = downloaded.fileType;
      buffer = downloaded.buffer;
      storageName = `${title.trim()}${extensionFor(fileType)}`;
    }

    const filePath = await storage.save(buffer, storageName);

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        categoryId,
        filePath,
        fileType,
        status: "PUBLISHED",
        uploadedById: guard.session.user.id,
      },
    });

    await logChange({
      entityType: "Document",
      entityId: document.id,
      documentId: document.id,
      userId: guard.session.user.id,
      action: "CREATE",
    });

    const parsed = await parseDocument(buffer, fileType);
    const { materialsCount, faqsCount } = await generateDraftsFromDocument({
      documentId: document.id,
      categoryId,
      authorId: guard.session.user.id,
      parsed,
    });

    return NextResponse.json({ document, materialsCount, faqsCount }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
