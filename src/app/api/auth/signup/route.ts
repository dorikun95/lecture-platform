import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import type { User, UserRole } from "@/types/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body as {
      email: string;
      password: string;
      name: string;
      role: UserRole;
    };

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!["instructor", "student"].includes(role)) {
      return NextResponse.json(
        { error: "유효하지 않은 역할입니다." },
        { status: 400 }
      );
    }

    const existing = await db.users.findOne((u) => u.email === email);
    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);
    const user: User = {
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
    };

    await db.users.create(user);

    return NextResponse.json(
      { message: "회원가입 성공", userId: user.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
