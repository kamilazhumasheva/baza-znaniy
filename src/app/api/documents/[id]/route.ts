import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { jsonError } from "@/lib/api";
import { logChange } from "@/lib/changelog";
import { storage } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      category: true,
      uploadedBy: { select: { name: true } },
      materials: true,
      faqs: true,
      previousVersion: true,
      nextVersion: true,
    },
  });

  if (!document) return jsonError("Документ не найден", 404);
  return NextResponse.json(document);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return jsonError("Документ не найден", 404);

  const linkedMaterial = await prisma.material.findFirst({ where: { documentId: id } });
  if (linkedMaterial) {
    return jsonError("Нельзя удалить документ, на который ссылаются материалы", 409);
  }

  await prisma.document.delete({ where: { id } });
  await storage.delete(document.filePath);

  await logChange({
    entityType: "Document",
    entityId: id,
    userId: guard.session.user.id,
    action: "DELETE",
  });

  return new NextResponse(null, { status: 204 });
}
