import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { LibraryItem, Category, Difficulty } from "@/types/course";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const difficulty = searchParams.get("difficulty") || "";

  let items = await db.library.findAll();

  if (query) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }

  if (category) {
    items = items.filter((item) => item.category === category);
  }

  if (difficulty) {
    items = items.filter((item) => item.difficulty === difficulty);
  }

  items.sort((a, b) => b.usageCount - a.usageCount);

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const user = session.user as { id?: string; role?: string };
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const body = await req.json();

  const item: LibraryItem = {
    id: uuidv4(),
    title: body.title || "새 라이브러리 아이템",
    description: body.description || "",
    category: (body.category as Category) || "other",
    difficulty: (body.difficulty as Difficulty) || "beginner",
    blocks: body.blocks || [],
    authorId: user.id!,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  await db.library.create(item);
  return NextResponse.json({ item }, { status: 201 });
}
