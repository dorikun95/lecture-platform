"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function AdminPage() {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    libraryItems: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
    ])
      .then(([data]) => {
        setStats(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">관리자 패널</h1>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">총 사용자</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">{stats.users}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">총 코스</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">{stats.courses}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">라이브러리</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">{stats.libraryItems}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/admin/users">
          <Card hover className="cursor-pointer">
            <p className="font-medium text-[14px] text-neutral-900 mb-0.5">사용자 관리</p>
            <p className="text-[13px] text-neutral-400">
              사용자 목록 조회 및 역할 관리
            </p>
          </Card>
        </Link>
        <Link href="/admin/library">
          <Card hover className="cursor-pointer">
            <p className="font-medium text-[14px] text-neutral-900 mb-0.5">라이브러리 관리</p>
            <p className="text-[13px] text-neutral-400">
              콘텐츠 라이브러리 아이템 관리
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
