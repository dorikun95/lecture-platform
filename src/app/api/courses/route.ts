import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { parseBody, CourseCreateSchema } from "@/lib/security/validators";
import { sanitizeCourse } from "@/lib/security/sanitize";
import type { Course } from "@/types/course";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ courses: [] });
    }

    const user = session.user as { id?: string; role?: string };
    let courses: Course[];

    if (user.role === "instructor" || user.role === "admin") {
      courses = await db.courses.findMany((c) => c.instructorId === user.id);
    } else {
      courses = await db.courses.findMany((c) => c.visibility === "public");
    }

    courses.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ courses: courses.map(sanitizeCourse) });
  } catch {
    return NextResponse.json({ courses: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "인증 필요" }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string };
    if (user.role !== "instructor" && user.role !== "admin") {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = parseBody(CourseCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { title, description, category, difficulty, visibility } = parsed.data;
    const slug = slugify(title) + "-" + uuidv4().slice(0, 8);
    const now = new Date().toISOString();

    const course: Course = {
      id: uuidv4(),
      instructorId: user.id!,
      title,
      slug,
      description: description || "",
      visibility: visibility || "private",
      category: (category || "other") as Course["category"],
      difficulty: difficulty || "beginner",
      shareToken: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    await db.courses.create(course);

    return NextResponse.json({ course: sanitizeCourse(course) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
