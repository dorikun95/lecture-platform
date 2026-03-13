import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { courseId } = await params;
  const course = await db.courses.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: "코스 없음" }, { status: 404 });
  }

  const enrollments = await db.enrollments.findMany(
    (e) => e.courseId === courseId
  );
  const reviews = await db.reviews.findMany((r) => r.courseId === courseId);
  const lessons = await db.lessons.findMany((l) => l.courseId === courseId);

  const totalStudents = enrollments.length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Calculate completion rates
  const completionRates = enrollments.map((e) => {
    const completed = Object.values(e.progress).filter(Boolean).length;
    return lessons.length > 0 ? completed / lessons.length : 0;
  });
  const avgCompletion =
    completionRates.length > 0
      ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
      : 0;

  return NextResponse.json({
    totalStudents,
    totalLessons: lessons.length,
    avgRating: Math.round(avgRating * 10) / 10,
    avgCompletion: Math.round(avgCompletion * 100),
    reviews: reviews.slice(0, 5),
    enrollmentsByDate: getEnrollmentsByDate(enrollments),
  });
}

function getEnrollmentsByDate(
  enrollments: { enrolledAt: string }[]
): { date: string; count: number }[] {
  const counts: Record<string, number> = {};
  enrollments.forEach((e) => {
    const date = e.enrolledAt.split("T")[0];
    counts[date] = (counts[date] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
