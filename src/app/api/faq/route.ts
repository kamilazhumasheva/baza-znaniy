import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { faqSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api";
import { logChange } from "@/lib/changelog";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const statusParam = searchParams.get("status");

  const where: Prisma.FaqWhereInput = { categoryId };

  if (isAdmin && statusParam && (statusParam === "DRAFT" || statusParam === "PUBLISHED")) {
    where.status = statusParam;
  } else if (!isAdmin) {
    where.status = "PUBLISHED";
  }

  const faqs = await prisma.faq.findMany({
    where,
    include: { category: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(faqs);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = faqSchema.parse(await req.json());
    const faq = await prisma.faq.create({ data: body });
    await logChange({
      entityType: "Faq",
      entityId: faq.id,
      userId: guard.session.user.id,
      action: "CREATE",
    });
    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
