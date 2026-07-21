import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { jsonError, handleApiError } from "@/lib/api";
import { logChange } from "@/lib/changelog";
import { storage } from "@/lib/storage";
import { fileTypeFromName, parseDocument } from "@/lib/parsing";
import { generateDraftsFromDocument } from "@/lib/pipeline/extractDrafts";

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
    const title = form.get("title");
    const categoryId = form.get("categoryId");

    if (!(file instanceof File)) return jsonError("Файл обязателен", 422);
    if (typeof title !== "string" || !title.trim()) return jsonError("Название обязательно", 422);
    if (typeof categoryId !== "string" || !categoryId) return jsonError("Категория обязательна", 422);

    const fileType = fileTypeFromName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = await storage.save(buffer, file.name);

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
