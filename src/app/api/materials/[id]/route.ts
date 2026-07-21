import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { materialUpdateSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api";
import { logChange } from "@/lib/changelog";
import { notifyEmployees } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      category: true,
      author: { select: { name: true } },
      document: true,
      faqs: { where: isAdmin ? {} : { status: "PUBLISHED" } },
    },
  });

  if (!material || (material.status === "DRAFT" && !isAdmin)) {
    return jsonError("Материал не найден", 404);
  }

  if (session?.user) {
    await prisma.viewHistory.create({
      data: { userId: session.user.id, targetType: "MATERIAL", materialId: material.id },
    });
  }

  return NextResponse.json(material);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  try {
    const body = materialUpdateSchema.parse(await req.json());
    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) return jsonError("Материал не найден", 404);

    const becomesPublished = body.status === "PUBLISHED" && existing.status !== "PUBLISHED";

    const material = await prisma.material.update({
      where: { id },
      data: {
        ...body,
        publishedAt: becomesPublished ? new Date() : existing.publishedAt,
      },
    });

    await logChange({
      entityType: "Material",
      entityId: id,
      userId: guard.session.user.id,
      action: becomesPublished ? "PUBLISH" : "UPDATE",
    });

    if (becomesPublished) {
      await notifyEmployees(`Новый материал: ${material.title}`, `/materials/${material.id}`);
    }

    return NextResponse.json(material);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  await prisma.material.delete({ where: { id } });
  await logChange({
    entityType: "Material",
    entityId: id,
    userId: guard.session.user.id,
    action: "DELETE",
  });
  return new NextResponse(null, { status: 204 });
}
