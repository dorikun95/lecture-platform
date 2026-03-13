"use client";

import { signOut } from "next-auth/react";
import { Menu } from "lucide-react";

interface HeaderProps {
  userName?: string | null;
  userRole?: string;
  onMenuClick: () => void;
}

export function Header({ userName, userRole, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 md:px-6 bg-white/80 backdrop-blur-md border-b border-neutral-100">
      <button
        onClick={onMenuClick}
        className="md:hidden p-1.5 hover:bg-neutral-50 rounded-md transition"
      >
        <Menu className="w-4 h-4 text-neutral-500" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[13px] font-medium text-neutral-700">{userName}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center">
            <span className="text-[11px] font-medium text-white">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[12px] text-neutral-400 hover:text-neutral-600 transition"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
