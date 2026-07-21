import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import { favoriteSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api";

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const favorites = await prisma.favorite.findMany({
    where: { userId: guard.session.user.id },
    include: {
      material: { include: { category: true } },
      faq: { include: { category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = favoriteSchema.parse(await req.json());
    const favorite = await prisma.favorite.create({
      data: {
        userId: guard.session.user.id,
        targetType: body.materialId ? "MATERIAL" : "FAQ",
        materialId: body.materialId,
        faqId: body.faqId,
      },
    });
    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const { searchParams } = req.nextUrl;
  const materialId = searchParams.get("materialId");
  const faqId = searchParams.get("faqId");

  await prisma.favorite.deleteMany({
    where: {
      userId: guard.session.user.id,
      ...(materialId ? { materialId } : {}),
      ...(faqId ? { faqId } : {}),
    },
  });

  return new NextResponse(null, { status: 204 });
}
