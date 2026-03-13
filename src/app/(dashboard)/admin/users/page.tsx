"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link href="/admin" className="text-[12px] text-neutral-400 hover:text-neutral-600 transition">
          &larr;
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">사용자 관리</h1>
      </div>

      <Card>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-neutral-50 rounded" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left py-2.5 px-4 font-medium text-neutral-400 text-[11px] uppercase tracking-wider">
                    이름
                  </th>
                  <th className="text-left py-2.5 px-4 font-medium text-neutral-400 text-[11px] uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="text-left py-2.5 px-4 font-medium text-neutral-400 text-[11px] uppercase tracking-wider">
                    역할
                  </th>
                  <th className="text-left py-2.5 px-4 font-medium text-neutral-400 text-[11px] uppercase tracking-wider">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-neutral-50 hover:bg-neutral-50/50 transition"
                  >
                    <td className="py-2.5 px-4 font-medium text-neutral-900">
                      {u.name}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500">{u.email}</td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={
                          u.role === "admin"
                            ? "error"
                            : u.role === "instructor"
                              ? "info"
                              : "default"
                        }
                      >
                        {u.role === "instructor"
                          ? "강사"
                          : u.role === "admin"
                            ? "관리자"
                            : "수강생"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-neutral-400">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
