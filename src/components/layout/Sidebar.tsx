"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: string;
  open: boolean;
  onClose: () => void;
}

const instructorNav = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/courses", label: "내 코스" },
  { href: "/courses/new", label: "새 코스" },
  { href: "/library", label: "라이브러리" },
  { href: "/settings", label: "설정" },
];

const studentNav = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/library", label: "라이브러리 탐색" },
  { href: "/settings", label: "설정" },
];

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "instructor" || role === "admin" ? instructorNav : studentNav;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[220px] bg-sidebar z-50 flex flex-col transition-transform duration-200 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 py-5">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-white tracking-tight">
                Lecture
              </span>
              <span className="text-[13px] font-normal text-neutral-500">
                Platform
              </span>
            </Link>
            <button
              onClick={onClose}
              className="md:hidden p-1 hover:bg-white/10 rounded-md"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {nav.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "block px-3 py-2 text-[13px] rounded-md transition-all duration-150",
                      isActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-5 py-4 border-t border-white/[0.06]">
          <p className="text-[11px] text-neutral-600">인터랙티브 강의 자료 공유</p>
        </div>
      </aside>
    </>
  );
}
