import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const enrollment = await db.enrollments.findById(id);
  if (!enrollment) {
    return NextResponse.json({ error: "등록 없음" }, { status: 404 });
  }

  const updated = await db.enrollments.update(id, {
    progress: { ...enrollment.progress, ...body.progress },
  });

  return NextResponse.json({ enrollment: updated });
}
