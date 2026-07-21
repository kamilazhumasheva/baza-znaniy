import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { performSearch } from "@/lib/search";

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") ?? undefined;

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await performSearch({ query, categoryId, userId: session?.user?.id });
  return NextResponse.json({ results });
}
