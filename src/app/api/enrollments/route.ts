import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Enrollment } from "@/types/course";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ enrollments: [] });
  }

  const user = session.user as { id?: string };
  const enrollments = await db.enrollments.findMany(
    (e) => e.userId === user.id
  );
  return NextResponse.json({ enrollments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const user = session.user as { id?: string };
  const body = await req.json();
  const { courseId } = body;

  const existing = await db.enrollments.findOne(
    (e) => e.userId === user.id && e.courseId === courseId
  );
  if (existing) {
    return NextResponse.json({ enrollment: existing });
  }

  const enrollment: Enrollment = {
    id: uuidv4(),
    userId: user.id!,
    courseId,
    enrolledAt: new Date().toISOString(),
    progress: {},
  };

  await db.enrollments.create(enrollment);
  return NextResponse.json({ enrollment }, { status: 201 });
}
