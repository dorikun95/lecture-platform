import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const allUsers = await db.users.findAll();
  const safeUsers = allUsers.map(({ password, ...u }) => u);

  return NextResponse.json({ users: safeUsers });
}
