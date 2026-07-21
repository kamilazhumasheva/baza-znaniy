import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { categoryUpdateSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api";
import { logChange } from "@/lib/changelog";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  try {
    const body = categoryUpdateSchema.parse(await req.json());
    const category = await prisma.category.update({ where: { id }, data: body });
    await logChange({
      entityType: "Category",
      entityId: id,
      userId: guard.session.user.id,
      action: "UPDATE",
    });
    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  const inUse = await prisma.material.findFirst({ where: { categoryId: id } });
  if (inUse) {
    return jsonError("Нельзя удалить категорию, в которой есть материалы", 409);
  }

  await prisma.category.delete({ where: { id } });
  await logChange({
    entityType: "Category",
    entityId: id,
    userId: guard.session.user.id,
    action: "DELETE",
  });
  return new NextResponse(null, { status: 204 });
}
