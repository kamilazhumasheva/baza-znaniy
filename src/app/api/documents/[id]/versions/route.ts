import { NextRequest, NextResponse } from "next/server";
import type { Document } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { jsonError, handleApiError } from "@/lib/api";
import { logChange } from "@/lib/changelog";
import { storage } from "@/lib/storage";
import { fileTypeFromName, parseDocument } from "@/lib/parsing";
import { generateDraftsFromDocument } from "@/lib/pipeline/extractDrafts";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  const found = await prisma.document.findUnique({ where: { id } });
  if (!found) return jsonError("Документ не найден", 404);

  let current: Document = found;
  while (current.previousVersionId) {
    const prev: Document | null = await prisma.document.findUnique({
      where: { id: current.previousVersionId },
    });
    if (!prev) break;
    current = prev;
  }

  const versions: Document[] = [current];
  let cursor: Document = current;
  while (true) {
    const next: Document | null = await prisma.document.findUnique({
      where: { previousVersionId: cursor.id },
    });
    if (!next) break;
    versions.push(next);
    cursor = next;
  }

  return NextResponse.json(versions);
}

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  const previous = await prisma.document.findUnique({ where: { id } });
  if (!previous) return jsonError("Документ не найден", 404);

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Файл обязателен", 422);

    const fileType = fileTypeFromName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = await storage.save(buffer, file.name);

    const document = await prisma.document.create({
      data: {
        title: previous.title,
        categoryId: previous.categoryId,
        filePath,
        fileType,
        status: "PUBLISHED",
        version: previous.version + 1,
        previousVersionId: previous.id,
        uploadedById: guard.session.user.id,
      },
    });

    await logChange({
      entityType: "Document",
      entityId: document.id,
      documentId: document.id,
      userId: guard.session.user.id,
      action: "UPLOAD_VERSION",
      details: `Новая версия документа "${previous.title}" (v${document.version})`,
    });

    const parsed = await parseDocument(buffer, fileType);
    const { materialsCount, faqsCount } = await generateDraftsFromDocument({
      documentId: document.id,
      categoryId: previous.categoryId,
      authorId: guard.session.user.id,
      parsed,
    });

    return NextResponse.json({ document, materialsCount, faqsCount }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
