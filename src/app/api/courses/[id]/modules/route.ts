import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Module } from "@/types/course";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const modules = await db.modules.findMany((m) => m.courseId === id);
  modules.sort((a, b) => a.orderIndex - b.orderIndex);
  return NextResponse.json({ modules });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const course = await db.courses.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: "코스 없음" }, { status: 404 });
  }

  const user = session.user as { id?: string };
  if (course.instructorId !== user.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const body = await req.json();

  // Reorder
  if (body.reorder && Array.isArray(body.moduleIds)) {
    for (let i = 0; i < body.moduleIds.length; i++) {
      await db.modules.update(body.moduleIds[i], { orderIndex: i });
    }
    return NextResponse.json({ success: true });
  }

  // Create
  const existing = await db.modules.findMany((m) => m.courseId === courseId);
  const mod: Module = {
    id: uuidv4(),
    courseId,
    title: body.title || "새 모듈",
    orderIndex: existing.length,
    createdAt: new Date().toISOString(),
  };

  await db.modules.create(mod);
  return NextResponse.json({ module: mod }, { status: 201 });
}
