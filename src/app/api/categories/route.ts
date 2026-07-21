import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { categorySchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api";
import { logChange } from "@/lib/changelog";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = categorySchema.parse(await req.json());
    const category = await prisma.category.create({ data: body });
    await logChange({
      entityType: "Category",
      entityId: category.id,
      userId: guard.session.user.id,
      action: "CREATE",
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
