"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as {
    name?: string | null;
    email?: string | null;
    role?: string;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">계정 설정</h1>

      <Card>
        <h3 className="text-[14px] font-medium text-neutral-900 mb-4">프로필 정보</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center">
              <span className="text-[12px] font-medium text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-neutral-900">{user?.name}</p>
              <p className="text-[13px] text-neutral-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-neutral-50">
            <span className="text-[13px] text-neutral-400">역할</span>
            <Badge variant="info">{user?.role === "instructor" ? "강사" : user?.role === "admin" ? "관리자" : "수강생"}</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-[14px] font-medium text-neutral-900 mb-1">테마</h3>
        <p className="text-[13px] text-neutral-400">
          다크모드는 추후 업데이트에서 지원될 예정입니다.
        </p>
      </Card>
    </div>
  );
}
