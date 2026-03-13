import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const course =
    (await db.courses.findById(id)) ??
    (await db.courses.findOne((c) => c.slug === id));

  if (!course) {
    return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
  }

  const modules = await db.modules.findMany((m) => m.courseId === course.id);
  modules.sort((a, b) => a.orderIndex - b.orderIndex);

  const lessons = await db.lessons.findMany((l) => l.courseId === course.id);

  return NextResponse.json({ course, modules, lessons });
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
  const course = await db.courses.findById(id);
  if (!course) {
    return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = session.user as { id?: string };
  if (course.instructorId !== user.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await db.courses.update(id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ course: updated });
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
  const course = await db.courses.findById(id);
  if (!course) {
    return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = session.user as { id?: string };
  if (course.instructorId !== user.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  await db.courses.delete(id);
  await db.modules.deleteMany((m) => m.courseId === id);
  await db.lessons.deleteMany((l) => l.courseId === id);

  return NextResponse.json({ success: true });
}
