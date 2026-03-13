import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

  const review: Review = {
    id: uuidv4(),
    userId: user.id!,
    courseId: body.courseId,
    rating: body.rating || 5,
    comment: body.comment || "",
    createdAt: new Date().toISOString(),
  };

  await db.reviews.create(review);
  return NextResponse.json({ review }, { status: 201 });
}
