import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { userUpdateSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  if (id === guard.session.user.id) {
    return jsonError("Нельзя изменить собственную роль или заблокировать самого себя", 400);
  }

  try {
    const body = userUpdateSchema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id },
      data: body,
      select: { id: true, email: true, name: true, role: true, isBlocked: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
