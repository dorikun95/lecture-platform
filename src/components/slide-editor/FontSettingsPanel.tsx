"use client";

import { useState, useRef, useEffect } from "react";
import type { TextRole } from "@/types/slide";
import { FONTS, FONT_CATEGORIES, FONT_LANGS } from "@/lib/fonts";
import type { FontLang } from "@/lib/fonts";

export interface RoleFontSettings {
  title?: string;
  subtitle?: string;
  body?: string;
  pageNumber?: string;
  other?: string;
}

interface FontSettingsPanelProps {
  currentFonts: RoleFontSettings;
  onApply: (role: TextRole | "all", fontFamily: string) => void;
  onClose: () => void;
}

const ROLES: { key: TextRole; label: string; desc: string }[] = [
  { key: "title", label: "제목", desc: "슬라이드 제목" },
  { key: "subtitle", label: "부제목", desc: "부제목 텍스트" },
  { key: "body", label: "본문", desc: "본문 텍스트" },
  { key: "pageNumber", label: "쪽 번호", desc: "페이지 번호" },
  { key: "other", label: "기타", desc: "분류되지 않은 텍스트" },
];

export function FontSettingsPanel({
  currentFonts,
  onApply,
  onClose,
}: FontSettingsPanelProps) {
  const [activeRole, setActiveRole] = useState<TextRole | "all">("all");

  return (
    <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-100 rounded-xl shadow-xl p-3 z-30 w-80 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-semibold text-neutral-800">
          일괄 글꼴 변경
        </p>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 text-xs"
        >
          ✕
        </button>
      </div>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        <RoleTab
          label="전체"
          active={activeRole === "all"}
          onClick={() => setActiveRole("all")}
        />
        {ROLES.map((r) => (
          <RoleTab
            key={r.key}
            label={r.label}
            active={activeRole === r.key}
            onClick={() => setActiveRole(r.key)}
          />
        ))}
      </div>

      {/* Description */}
      <p className="text-[10px] text-neutral-400 mb-2">
        {activeRole === "all"
          ? "모든 텍스트 요소의 글꼴을 한번에 변경합니다."
          : `"${ROLES.find((r) => r.key === activeRole)?.desc}" 역할의 글꼴을 변경합니다.`}
      </p>

      {/* Current font display */}
      {activeRole !== "all" && (
        <div className="text-[11px] text-neutral-500 mb-2 px-2 py-1.5 bg-neutral-50 rounded-md">
          현재:{" "}
          <span className="font-medium text-neutral-700">
            {currentFonts[activeRole as TextRole]
              ? FONTS.find((f) => f.family === currentFonts[activeRole as TextRole])?.label ||
                currentFonts[activeRole as TextRole]
              : "(테마 기본값)"}
          </span>
        </div>
      )}

      {/* Font picker */}
      <FontPickerList
        onSelect={(family) => {
          onApply(activeRole, family);
        }}
      />
    </div>
  );
}

function RoleTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[11px] rounded-md transition ${
        active
          ? "bg-indigo-100 text-indigo-700 font-medium"
          : "text-neutral-500 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}

function FontPickerList({ onSelect }: { onSelect: (family: string) => void }) {
  const [langFilter, setLangFilter] = useState<FontLang>("all");
  const [search, setSearch] = useState("");

  const filtered = FONTS.filter((f) => {
    if (langFilter !== "all" && f.lang !== langFilter && f.lang !== "both") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.family.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Search + language filter */}
      <div className="flex items-center gap-1.5 mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="글꼴 검색..."
          className="flex-1 px-2 py-1 text-[11px] border border-neutral-200 rounded-md outline-none focus:border-indigo-300 transition"
        />
        <div className="flex">
          {FONT_LANGS.map((l) => (
            <button
              key={l.key}
              onClick={() => setLangFilter(l.key)}
              className={`px-1.5 py-1 text-[10px] transition ${
                langFilter === l.key
                  ? "text-indigo-600 font-medium"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font list */}
      <div className="max-h-52 overflow-y-auto border border-neutral-100 rounded-lg">
        {FONT_CATEGORIES.map((cat) => {
          const fonts = filtered.filter((f) => f.category === cat.key);
          if (fonts.length === 0) return null;
          return (
            <div key={cat.key}>
              <div className="px-2.5 py-1 text-[10px] text-neutral-400 font-medium uppercase tracking-wider sticky top-0 bg-neutral-50 border-b border-neutral-100">
                {cat.label}
              </div>
              {fonts.map((font) => (
                <button
                  key={font.family}
                  onClick={() => onSelect(font.family)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                  <span
                    className="truncate"
                    style={{ fontFamily: `"${font.family}", sans-serif` }}
                  >
                    {font.label}
                  </span>
                  <span
                    className="text-[10px] text-neutral-400 flex-shrink-0 ml-2"
                    style={{ fontFamily: `"${font.family}", sans-serif` }}
                  >
                    {font.lang === "ko" ? "가나다" : "Abc"}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-center text-[11px] text-neutral-400">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
