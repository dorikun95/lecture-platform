import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseBody, LessonUpdateSchema } from "@/lib/security/validators";
import { isLessonOwner, isCoursOwner } from "@/lib/security/ownership";
import { sanitizeHtml } from "@/lib/security/sanitize";
import type { Lesson } from "@/types/course";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id.startsWith("new-")) {
    return NextResponse.json({ error: "Use POST to create" }, { status: 400 });
  }

  const lesson = await db.lessons.findById(id);
  if (!lesson) {
    return NextResponse.json({ error: "레슨을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ lesson });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id?: string };

  // Ownership check: only the course owner can edit lessons
  const isOwner = await isLessonOwner(id, user.id!);
  if (!isOwner) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = parseBody(LessonUpdateSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Sanitize HTML content in blocks
  const updateData = { ...parsed.data };
  if (updateData.blocks && Array.isArray(updateData.blocks)) {
    updateData.blocks = updateData.blocks.map((block: Record<string, unknown>) => {
      if (typeof block.content === "string") {
        return { ...block, content: sanitizeHtml(block.content) };
      }
      return block;
    });
  }

  const updated = await db.lessons.update(id, {
    ...updateData,
    updatedAt: new Date().toISOString(),
  });

  if (!updated) {
    return NextResponse.json({ error: "레슨 없음" }, { status: 404 });
  }

  return NextResponse.json({ lesson: updated });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { id: moduleId } = await params;
  const user = session.user as { id?: string };

  const mod = await db.modules.findById(moduleId);
  if (!mod) {
    return NextResponse.json({ error: "모듈 없음" }, { status: 404 });
  }

  // Ownership check
  const isOwner = await isCoursOwner(mod.courseId, user.id!);
  if (!isOwner) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const body = await req.json();
  const existing = await db.lessons.findMany((l) => l.moduleId === moduleId);
  const now = new Date().toISOString();

  const lesson: Lesson = {
    id: uuidv4(),
    moduleId,
    courseId: mod.courseId,
    title: typeof body.title === "string" ? body.title.slice(0, 200) : "새 레슨",
    orderIndex: existing.length,
    blocks: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.lessons.create(lesson);
  return NextResponse.json({ lesson }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id?: string };

  // Ownership check
  const isOwner = await isLessonOwner(id, user.id!);
  if (!isOwner) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  await db.lessons.delete(id);
  return NextResponse.json({ success: true });
}
