import { prisma } from "@/lib/db";

export async function getAdminStats() {
  const [topQueriesRaw, noResultQueriesRaw, totals, categoryActivity] = await Promise.all([
    prisma.searchLog.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    }),
    prisma.searchLog.groupBy({
      by: ["query"],
      where: { resultsCount: 0 },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    }),
    Promise.all([
      prisma.user.count(),
      prisma.material.count(),
      prisma.material.count({ where: { status: "DRAFT" } }),
      prisma.faq.count(),
      prisma.faq.count({ where: { status: "DRAFT" } }),
      prisma.document.count(),
    ]),
    prisma.$queryRaw<{ categoryName: string; views: bigint }[]>`
      SELECT c.name AS "categoryName", count(*) AS views
      FROM "ViewHistory" vh
      LEFT JOIN "Material" m ON m.id = vh."materialId"
      LEFT JOIN "Faq" f ON f.id = vh."faqId"
      JOIN "Category" c ON c.id = coalesce(m."categoryId", f."categoryId")
      GROUP BY c.name
      ORDER BY views DESC
      LIMIT 10
    `,
  ]);

  const [usersCount, materialsCount, draftMaterialsCount, faqsCount, draftFaqsCount, documentsCount] = totals;

  return {
    topQueries: topQueriesRaw.map((q) => ({ query: q.query, count: q._count.query })),
    noResultQueries: noResultQueriesRaw.map((q) => ({ query: q.query, count: q._count.query })),
    categoryActivity: categoryActivity.map((c) => ({ categoryName: c.categoryName, views: Number(c.views) })),
    totals: {
      usersCount,
      materialsCount,
      draftMaterialsCount,
      faqsCount,
      draftFaqsCount,
      documentsCount,
    },
  };
}
