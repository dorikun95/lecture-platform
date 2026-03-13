import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types/user";

interface AuthResult {
  user: { id: string; email: string; name: string; role: UserRole };
}

export async function requireAuth(
  allowedRoles?: UserRole[]
): Promise<AuthResult | NextResponse> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const user = session.user as unknown as AuthResult["user"];

  if (!user.id || !user.role) {
    return NextResponse.json(
      { error: "유효하지 않은 세션입니다." },
      { status: 401 }
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  return { user };
}

export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
