import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Fork } from "@/types/course";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { id: libraryItemId } = await params;
  const body = await req.json();
  const { lessonId } = body;

  const item = await db.library.findById(libraryItemId);
  if (!item) {
    return NextResponse.json({ error: "아이템 없음" }, { status: 404 });
  }

  const user = session.user as { id?: string };

  // If lessonId provided, append blocks to that lesson
  if (lessonId) {
    const lesson = await db.lessons.findById(lessonId);
    if (lesson) {
      const newBlocks = item.blocks.map((b) => ({
        ...b,
        id: uuidv4(),
        order: lesson.blocks.length + b.order,
      }));
      await db.lessons.update(lessonId, {
        blocks: [...lesson.blocks, ...newBlocks],
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Record fork
  const now = new Date().toISOString();
  const fork: Fork = {
    id: uuidv4(),
    libraryItemId,
    userId: user.id!,
    lessonId: lessonId || "",
    forkedAt: now,
    lastSyncedAt: now,
  };
  await db.forks.create(fork);

  // Increment usage count
  await db.library.update(libraryItemId, {
    usageCount: item.usageCount + 1,
  });

  return NextResponse.json({ fork, blocks: item.blocks }, { status: 201 });
}
