import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Отметить жалобу разобранной, чтобы она ушла из списка активных. */
export async function PATCH(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  try {
    await prisma.feedback.update({ where: { id }, data: { resolved: true } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
