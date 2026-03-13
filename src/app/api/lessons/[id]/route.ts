import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Lesson } from "@/types/course";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // If id looks like "new-{moduleId}", create a new lesson
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
  const body = await req.json();

  const updated = await db.lessons.update(id, {
    ...body,
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

  // id here is moduleId
  const { id: moduleId } = await params;
  const body = await req.json();

  const mod = await db.modules.findById(moduleId);
  if (!mod) {
    return NextResponse.json({ error: "모듈 없음" }, { status: 404 });
  }

  const existing = await db.lessons.findMany((l) => l.moduleId === moduleId);
  const now = new Date().toISOString();

  const lesson: Lesson = {
    id: uuidv4(),
    moduleId,
    courseId: mod.courseId,
    title: body.title || "새 레슨",
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
  await db.lessons.delete(id);
  return NextResponse.json({ success: true });
}
