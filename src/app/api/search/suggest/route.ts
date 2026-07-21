import { NextRequest, NextResponse } from "next/server";
import { suggestContent } from "@/lib/search";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ suggestions: [] });

  const suggestions = await suggestContent(query);
  return NextResponse.json({ suggestions });
}
