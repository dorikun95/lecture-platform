import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseBody, ReviewSchema } from "@/lib/security/validators";
import { sanitizeHtml } from "@/lib/security/sanitize";
import type { Review } from "@/types/course";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ reviews: [] });
  }

  const reviews = await db.reviews.findMany((r) => r.courseId === courseId);
  reviews.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const user = session.user as { id?: string };
  const body = await req.json();

  const parsed = parseBody(ReviewSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Verify course exists
  const course = await db.courses.findById(parsed.data.courseId);
  if (!course) {
    return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
  }

  // Prevent duplicate reviews
  const existing = await db.reviews.findOne(
    (r) => r.userId === user.id && r.courseId === parsed.data.courseId
  );
  if (existing) {
    return NextResponse.json({ error: "이미 리뷰를 작성했습니다." }, { status: 409 });
  }

  const review: Review = {
    id: uuidv4(),
    userId: user.id!,
    courseId: parsed.data.courseId,
    rating: parsed.data.rating,
    comment: sanitizeHtml(parsed.data.comment || ""),
    createdAt: new Date().toISOString(),
  };

  await db.reviews.create(review);
  return NextResponse.json({ review }, { status: 201 });
}
