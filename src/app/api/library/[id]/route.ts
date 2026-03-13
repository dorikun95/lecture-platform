import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await db.library.findById(id);
  if (!item) {
    return NextResponse.json({ error: "아이템 없음" }, { status: 404 });
  }
  return NextResponse.json({ item });
}
