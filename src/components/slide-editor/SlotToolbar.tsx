"use client";

import type { SlotContent } from "@/types/slide";

interface SlotToolbarProps {
  content: SlotContent;
  onChange: (content: SlotContent) => void;
  slotType: string;
}

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72];

const COLORS = [
  { label: "기본", value: "" },
  { label: "검정", value: "#171717" },
  { label: "흰색", value: "#ffffff" },
  { label: "회색", value: "#737373" },
  { label: "빨강", value: "#ef4444" },
  { label: "파랑", value: "#3b82f6" },
  { label: "초록", value: "#22c55e" },
  { label: "보라", value: "#8b5cf6" },
  { label: "노랑", value: "#eab308" },
  { label: "인디고", value: "#6366f1" },
];

export function SlotToolbar({ content, onChange, slotType }: SlotToolbarProps) {
  // Only show text formatting for text-based slots
  if (slotType === "image") return null;

  const isTextSlot = ["title", "subtitle", "body"].includes(slotType);

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 bg-white border border-neutral-200 rounded-lg shadow-sm">
      {isTextSlot && (
        <>
          {/* Font size */}
          <select
            value={content.fontSize || ""}
            onChange={(e) =>
              onChange({
                ...content,
                fontSize: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-14 text-[11px] text-neutral-600 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="">크기</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="w-px h-4 bg-neutral-200 mx-0.5" />

          {/* Bold */}
          <button
            onClick={() =>
              onChange({
                ...content,
                fontWeight:
                  content.fontWeight === "bold" ? "normal" : "bold",
              })
            }
            className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition ${
              content.fontWeight === "bold"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
            }`}
            title="굵게"
          >
            B
          </button>

          {/* Italic */}
          <button
            onClick={() =>
              onChange({
                ...content,
                fontStyle:
                  content.fontStyle === "italic" ? "normal" : "italic",
              })
            }
            className={`w-7 h-7 flex items-center justify-center rounded text-xs italic transition ${
              content.fontStyle === "italic"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
            }`}
            title="기울임"
          >
            I
          </button>

          {/* Underline */}
          <button
            onClick={() =>
              onChange({
                ...content,
                textDecoration:
                  content.textDecoration === "underline"
                    ? "none"
                    : "underline",
              })
            }
            className={`w-7 h-7 flex items-center justify-center rounded text-xs underline transition ${
              content.textDecoration === "underline"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
            }`}
            title="밑줄"
          >
            U
          </button>

          <div className="w-px h-4 bg-neutral-200 mx-0.5" />

          {/* Alignment */}
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => onChange({ ...content, textAlign: align })}
              className={`w-7 h-7 flex items-center justify-center rounded text-[10px] transition ${
                (content.textAlign || "left") === align
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
              }`}
              title={align === "left" ? "왼쪽" : align === "center" ? "가운데" : "오른쪽"}
            >
              {align === "left" && "≡"}
              {align === "center" && "≡"}
              {align === "right" && "≡"}
            </button>
          ))}

          <div className="w-px h-4 bg-neutral-200 mx-0.5" />

          {/* Color */}
          <div className="relative group">
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-xs transition hover:bg-neutral-50"
              title="글자 색상"
            >
              <span className="text-neutral-500">A</span>
              <span
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-0.5 rounded-full"
                style={{ backgroundColor: content.textColor || "#171717" }}
              />
            </button>
            <div className="absolute top-full left-0 mt-1 p-1.5 bg-white border border-neutral-200 rounded-lg shadow-lg z-40 hidden group-hover:grid grid-cols-5 gap-1 w-32">
              {COLORS.map((c) => (
                <button
                  key={c.value || "default"}
                  onClick={() =>
                    onChange({ ...content, textColor: c.value || undefined })
                  }
                  className={`w-5 h-5 rounded-full border transition hover:scale-110 ${
                    (content.textColor || "") === c.value
                      ? "ring-2 ring-indigo-400 ring-offset-1"
                      : "border-neutral-200"
                  }`}
                  style={{
                    backgroundColor: c.value || "#e5e5e5",
                    backgroundImage: !c.value
                      ? "linear-gradient(135deg, #ef4444 25%, #3b82f6 50%, #22c55e 75%)"
                      : undefined,
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
