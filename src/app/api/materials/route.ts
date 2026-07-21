import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { materialSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api";
import { logChange } from "@/lib/changelog";
import { notifyEmployees } from "@/lib/notify";
import { setMaterialEmbedding } from "@/lib/pipeline/embedContent";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const pinned = searchParams.get("pinned");
  const statusParam = searchParams.get("status");

  const where: Prisma.MaterialWhereInput = { categoryId };

  if (isAdmin && statusParam && (statusParam === "DRAFT" || statusParam === "PUBLISHED")) {
    where.status = statusParam;
  } else if (!isAdmin) {
    where.status = "PUBLISHED";
  }

  if (pinned === "true") where.pinned = true;

  const materials = await prisma.material.findMany({
    where,
    include: { category: true, author: { select: { name: true } } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(materials);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = materialSchema.parse(await req.json());
    const material = await prisma.material.create({
      data: {
        ...body,
        authorId: guard.session.user.id,
        publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      },
    });
    await logChange({
      entityType: "Material",
      entityId: material.id,
      userId: guard.session.user.id,
      action: "CREATE",
    });

    if (material.status === "PUBLISHED") {
      await notifyEmployees(`Новый материал: ${material.title}`, `/materials/${material.id}`);
    }

    await setMaterialEmbedding(material.id, `${material.title}\n${material.description}`);

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
