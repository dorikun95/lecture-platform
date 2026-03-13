import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db, ensureSeed } from "@/lib/db";
import { parseBody, SignupSchema } from "@/lib/security/validators";
import { validatePassword } from "@/lib/security/password-policy";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter";
import type { User } from "@/types/user";

export async function POST(req: NextRequest) {
  try {
    // Rate limit signup attempts by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const rateCheck = checkRateLimit(`signup:${ip}`, RATE_LIMITS.signup);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "너무 많은 시도입니다. 잠시 후 다시 시도하세요." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate input with Zod schema
    const parsed = parseBody(SignupSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { email, password, name, role } = parsed.data;

    // Password policy check
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.errors.join(", ") },
        { status: 400 }
      );
    }

    await ensureSeed();
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
