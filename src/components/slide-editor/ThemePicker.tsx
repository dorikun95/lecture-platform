"use client";

import type { PresentationTheme } from "@/types/slide";
import { THEMES } from "@/lib/slide-utils";

interface ThemePickerProps {
  currentTheme: PresentationTheme;
  onSelect: (theme: PresentationTheme) => void;
  onClose: () => void;
}

export function ThemePicker({ currentTheme, onSelect, onClose }: ThemePickerProps) {
  return (
    <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-100 rounded-xl shadow-xl p-3 z-30 w-64 animate-slide-up">
      <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-2 px-1">
        테마 선택
      </p>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => {
              onSelect(theme);
              onClose();
            }}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition ${
              currentTheme.id === theme.id
                ? "ring-2 ring-indigo-400"
                : "hover:bg-neutral-50"
            }`}
          >
            {/* Color preview */}
            <div
              className="w-full aspect-[16/9] rounded-md flex flex-col items-center justify-center gap-0.5 p-2"
              style={{
                background: theme.bgGradient || theme.bgColor,
                border: theme.bgColor === "#ffffff" ? "1px solid #e5e5e5" : "none",
              }}
            >
              <div
                className="w-3/4 h-1.5 rounded-sm"
                style={{ backgroundColor: theme.titleColor }}
              />
              <div
                className="w-1/2 h-1 rounded-sm opacity-50"
                style={{ backgroundColor: theme.bodyColor }}
              />
              <div
                className="w-1/3 h-1 rounded-sm mt-0.5"
                style={{ backgroundColor: theme.accentColor }}
              />
            </div>
            <span className="text-[11px] text-neutral-500">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
