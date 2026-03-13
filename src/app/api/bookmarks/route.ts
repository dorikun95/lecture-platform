import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Bookmark } from "@/types/course";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ bookmarks: [] });
  }

  const user = session.user as { id?: string };
  const bookmarks = await db.bookmarks.findMany((b) => b.userId === user.id);
  return NextResponse.json({ bookmarks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const user = session.user as { id?: string };
  const body = await req.json();

  const existing = await db.bookmarks.findOne(
    (b) => b.userId === user.id && b.lessonId === body.lessonId
  );
  if (existing) {
    await db.bookmarks.delete(existing.id);
    return NextResponse.json({ removed: true });
  }

  const bookmark: Bookmark = {
    id: uuidv4(),
    userId: user.id!,
    lessonId: body.lessonId,
    note: body.note || "",
    createdAt: new Date().toISOString(),
  };

  await db.bookmarks.create(bookmark);
  return NextResponse.json({ bookmark }, { status: 201 });
}
