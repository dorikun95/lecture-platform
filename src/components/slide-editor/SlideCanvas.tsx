"use client";

import { useRef, useState } from "react";
import type { Slide, PresentationTheme, SlotContent } from "@/types/slide";
import { getLayout } from "@/lib/slide-utils";

interface SlideCanvasProps {
  slide: Slide;
  theme: PresentationTheme;
  scale?: number;
  interactive?: boolean;
  activeSlot?: string | null;
  editingSlot?: string | null;
  onSlotClick?: (slotId: string) => void;
  onSlotDoubleClick?: (slotId: string) => void;
  onSlotChange?: (slotId: string, content: SlotContent) => void;
}

export function SlideCanvas({
  slide,
  theme,
  scale = 1,
  interactive = true,
  activeSlot,
  editingSlot,
  onSlotClick,
  onSlotDoubleClick,
  onSlotChange,
}: SlideCanvasProps) {
  const layout = getLayout(slide.layoutId);

  const bgStyle = theme.bgGradient
    ? { background: theme.bgGradient }
    : { backgroundColor: theme.bgColor };

  // Detect column count from grid areas
  const firstRow = layout.gridAreas.split('"')[1] || "";
  const colCount = firstRow.trim().split(/\s+/).length;
  const gridTemplateColumns = colCount > 1 ? Array(colCount).fill("1fr").join(" ") : "1fr";

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 960 * scale,
        height: 540 * scale,
        borderRadius: 8 * scale,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          ...bgStyle,
          position: "relative",
          width: 960,
          height: 540,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          display: "grid",
          gridTemplateRows: layout.gridTemplate,
          gridTemplateColumns,
          gridTemplateAreas: layout.gridAreas,
          padding: 48,
          gap: 24,
          fontFamily: theme.fontFamily,
        }}
      >
        {layout.slots.map((slotDef) => {
          const content = slide.slots[slotDef.id] || {};
          const isSelected = activeSlot === slotDef.id;
          const isEditing = editingSlot === slotDef.id;

          return (
            <div
              key={slotDef.id}
              style={{ gridArea: slotDef.gridArea }}
              className={`relative rounded-lg transition-all duration-150 ${
                interactive
                  ? "cursor-pointer"
                  : ""
              } ${
                isSelected && !isEditing
                  ? "ring-2 ring-indigo-500 bg-indigo-500/5"
                  : interactive && !isEditing
                    ? "hover:ring-1 hover:ring-indigo-300/40"
                    : ""
              } ${isEditing ? "ring-2 ring-indigo-400" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (interactive) onSlotClick?.(slotDef.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (interactive) onSlotDoubleClick?.(slotDef.id);
              }}
            >
              {slotDef.type === "title" && (
                <SlotTitle
                  content={content}
                  theme={theme}
                  isLargeTitle={slide.layoutId === "title" || slide.layoutId === "section-header" || slide.layoutId === "hero"}
                  editing={isEditing}
                  onChange={
                    onSlotChange
                      ? (c) => onSlotChange(slotDef.id, c)
                      : undefined
                  }
                />
              )}
              {slotDef.type === "subtitle" && (
                <SlotSubtitle
                  content={content}
                  theme={theme}
                  editing={isEditing}
                  onChange={
                    onSlotChange
                      ? (c) => onSlotChange(slotDef.id, c)
                      : undefined
                  }
                />
              )}
              {slotDef.type === "body" && (
                <SlotBody
                  content={content}
                  theme={theme}
                  editing={isEditing}
                  onChange={
                    onSlotChange
                      ? (c) => onSlotChange(slotDef.id, c)
                      : undefined
                  }
                />
              )}
              {slotDef.type === "image" && (
                <SlotImage
                  content={content}
                  editing={isEditing}
                  onChange={
                    onSlotChange
                      ? (c) => onSlotChange(slotDef.id, c)
                      : undefined
                  }
                />
              )}
              {slotDef.type === "code" && (
                <SlotCode
                  content={content}
                  theme={theme}
                  editing={isEditing}
                  onChange={
                    onSlotChange
                      ? (c) => onSlotChange(slotDef.id, c)
                      : undefined
                  }
                />
              )}
              {slotDef.type === "quiz" && (
                <SlotQuiz
                  content={content}
                  theme={theme}
                  editing={isEditing}
                  onChange={
                    onSlotChange
                      ? (c) => onSlotChange(slotDef.id, c)
                      : undefined
                  }
                />
              )}

              {/* Empty slot placeholder */}
              {interactive && isSlotEmpty(slotDef.type, content) && !isEditing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-sm opacity-20"
                    style={{ color: theme.bodyColor }}
                  >
                    {isSelected ? "더블클릭하여 편집" : slotDef.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* 워터마크: 한국AI강사협회 */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            right: 20,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.02em",
            color: theme.bodyColor,
            opacity: 0.25,
            fontFamily: theme.fontFamily,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          한국AI강사협회
        </div>
      </div>
    </div>
  );
}

function isSlotEmpty(type: string, content: SlotContent): boolean {
  if (type === "title" || type === "subtitle" || type === "body")
    return !content.text;
  if (type === "image") return !content.imageUrl;
  if (type === "code") return !content.code;
  if (type === "quiz") return !content.question;
  return true;
}

// ── Formatting helpers ──

function getTextStyle(content: SlotContent, theme: PresentationTheme, defaultColor: string, defaultSize: number) {
  return {
    color: content.textColor || defaultColor,
    fontSize: content.fontSize || defaultSize,
    fontWeight: content.fontWeight || undefined,
    fontStyle: content.fontStyle || undefined,
    textDecoration: content.textDecoration || undefined,
    textAlign: (content.textAlign || undefined) as React.CSSProperties["textAlign"],
  };
}

// ── Slot Renderers ──

function SlotTitle({
  content,
  theme,
  isLargeTitle,
  editing,
  onChange,
}: {
  content: SlotContent;
  theme: PresentationTheme;
  isLargeTitle: boolean;
  editing: boolean;
  onChange?: (c: SlotContent) => void;
}) {
  const defaultSize = isLargeTitle ? 44 : 32;
  const style = getTextStyle(content, theme, theme.titleColor, defaultSize);

  if (editing && onChange) {
    return (
      <div className="h-full flex items-center">
        <textarea
          autoFocus
          value={content.text || ""}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          placeholder="제목 입력..."
          className="w-full bg-transparent outline-none resize-none leading-tight"
          style={{ ...style, fontWeight: style.fontWeight || "bold" }}
          rows={2}
        />
      </div>
    );
  }

  return (
    <div
      className="h-full flex items-center leading-tight"
      style={{ ...style, fontWeight: style.fontWeight || "bold" }}
    >
      {content.text || ""}
    </div>
  );
}

function SlotSubtitle({
  content,
  theme,
  editing,
  onChange,
}: {
  content: SlotContent;
  theme: PresentationTheme;
  editing: boolean;
  onChange?: (c: SlotContent) => void;
}) {
  const style = getTextStyle(content, theme, theme.bodyColor, 20);

  if (editing && onChange) {
    return (
      <textarea
        autoFocus
        value={content.text || ""}
        onChange={(e) => onChange({ ...content, text: e.target.value })}
        placeholder="부제목 입력..."
        className="w-full bg-transparent outline-none resize-none"
        style={style}
        rows={2}
      />
    );
  }
  return (
    <div style={style}>
      {content.text || ""}
    </div>
  );
}

function SlotBody({
  content,
  theme,
  editing,
  onChange,
}: {
  content: SlotContent;
  theme: PresentationTheme;
  editing: boolean;
  onChange?: (c: SlotContent) => void;
}) {
  const style = getTextStyle(content, theme, theme.bodyColor, 18);

  if (editing && onChange) {
    return (
      <textarea
        autoFocus
        value={content.text || ""}
        onChange={(e) => onChange({ ...content, text: e.target.value })}
        placeholder="본문 입력... (마크다운 지원)"
        className="w-full h-full bg-transparent outline-none resize-none leading-relaxed"
        style={style}
      />
    );
  }
  return (
    <div
      className="leading-relaxed whitespace-pre-wrap overflow-auto h-full"
      style={style}
    >
      {content.text || ""}
    </div>
  );
}

function SlotImage({
  content,
  editing,
  onChange,
}: {
  content: SlotContent;
  editing: boolean;
  onChange?: (c: SlotContent) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        onChange?.({ ...content, imageUrl: data.url, imageAlt: file.name });
      }
    } catch {
      // ignore
    }
    setUploading(false);
  };

  if (content.imageUrl) {
    return (
      <div className="h-full flex items-center justify-center relative">
        <img
          src={content.imageUrl}
          alt={content.imageAlt || ""}
          className="max-w-full max-h-full object-contain rounded-md"
        />
        {editing && onChange && (
          <button
            onClick={() => onChange({ ...content, imageUrl: "", imageAlt: "" })}
            className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded hover:bg-black/70"
          >
            변경
          </button>
        )}
      </div>
    );
  }

  if (!editing) return null;

  return (
    <div className="h-full flex items-center justify-center">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="px-4 py-2 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-600 transition"
      >
        {uploading ? "업로드 중..." : "이미지 업로드"}
      </button>
    </div>
  );
}

function SlotCode({
  content,
  theme,
  editing,
  onChange,
}: {
  content: SlotContent;
  theme: PresentationTheme;
  editing: boolean;
  onChange?: (c: SlotContent) => void;
}) {
  if (editing && onChange) {
    return (
      <div className="h-full flex flex-col rounded-lg overflow-hidden" style={{ backgroundColor: theme.codeBg }}>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20">
          <select
            value={content.language || "javascript"}
            onChange={(e) => onChange({ ...content, language: e.target.value })}
            className="bg-transparent text-neutral-400 text-xs outline-none"
          >
            {["javascript","typescript","python","java","go","rust","html","css","sql","bash","json"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <textarea
          autoFocus
          value={content.code || ""}
          onChange={(e) => onChange({ ...content, code: e.target.value })}
          placeholder="코드 입력..."
          className="flex-1 p-4 bg-transparent text-sm font-mono outline-none resize-none"
          style={{ color: "#cdd6f4" }}
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div
      className="h-full rounded-lg p-4 overflow-auto"
      style={{ backgroundColor: theme.codeBg }}
    >
      <pre className="text-sm font-mono whitespace-pre-wrap" style={{ color: "#cdd6f4" }}>
        {content.code || ""}
      </pre>
    </div>
  );
}

function SlotQuiz({
  content,
  theme,
  editing,
  onChange,
}: {
  content: SlotContent;
  theme: PresentationTheme;
  editing: boolean;
  onChange?: (c: SlotContent) => void;
}) {
  const options = content.options || ["", ""];
  const correctIndex = content.correctIndex ?? 0;

  if (editing && onChange) {
    return (
      <div className="space-y-3 overflow-auto">
        <input
          value={content.question || ""}
          onChange={(e) => onChange({ ...content, question: e.target.value })}
          placeholder="질문 입력..."
          className="w-full bg-transparent outline-none font-medium text-lg"
          style={{ color: theme.titleColor }}
        />
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => onChange({ ...content, correctIndex: i })}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  correctIndex === i
                    ? "border-green-500 bg-green-500"
                    : "border-neutral-300"
                }`}
              >
                {correctIndex === i && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </button>
              <input
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  onChange({ ...content, options: newOpts });
                }}
                placeholder={`선택지 ${i + 1}`}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: theme.bodyColor }}
              />
            </div>
          ))}
          <button
            onClick={() => onChange({ ...content, options: [...options, ""] })}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            + 선택지 추가
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-medium text-lg" style={{ color: theme.titleColor }}>
        {content.question || ""}
      </p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: theme.bgColor + "80" }}
          >
            <span
              className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium"
              style={{ borderColor: theme.accentColor, color: theme.accentColor }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span style={{ color: theme.bodyColor }}>{opt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
