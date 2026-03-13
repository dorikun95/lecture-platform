"use client";

import { useState, useRef, useEffect } from "react";
import type { ShapeKind, SlideElement, ElementTextContent } from "@/types/slide";
import type { AlignAction } from "@/lib/slide-element-utils";
import { FONTS, FONT_CATEGORIES, FONT_LANGS } from "@/lib/fonts";
import type { FontLang } from "@/lib/fonts";
import {
  Type,
  Square,
  Image,
  Code2,
  FolderOpen,
  Loader2,
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
} from "lucide-react";

interface ElementToolbarProps {
  onInsertText: () => void;
  onInsertShape: (kind: ShapeKind) => void;
  onInsertImage: () => void;
  onInsertCode: () => void;
  onImport?: () => void;
  importing?: boolean;
  selectedElements: SlideElement[];
  onAlign: (action: AlignAction) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLock: () => void;
  onStyleChange?: (id: string, changes: Partial<SlideElement>) => void;
}

const SHAPES: { kind: ShapeKind; label: string; icon: string }[] = [
  { kind: "rectangle", label: "사각형", icon: "▭" },
  { kind: "rounded-rect", label: "둥근 사각형", icon: "▢" },
  { kind: "circle", label: "원", icon: "○" },
  { kind: "triangle", label: "삼각형", icon: "△" },
  { kind: "diamond", label: "다이아몬드", icon: "◇" },
  { kind: "arrow", label: "화살표", icon: "➤" },
  { kind: "line", label: "선", icon: "—" },
];

const ALIGN_ACTIONS: { action: AlignAction; label: string; icon: string }[] = [
  { action: "align-left", label: "왼쪽 정렬", icon: "⫷" },
  { action: "align-center-h", label: "가로 중앙", icon: "⫿" },
  { action: "align-right", label: "오른쪽 정렬", icon: "⫸" },
  { action: "align-top", label: "위쪽 정렬", icon: "⊤" },
  { action: "align-center-v", label: "세로 중앙", icon: "⊡" },
  { action: "align-bottom", label: "아래쪽 정렬", icon: "⊥" },
  { action: "distribute-h", label: "가로 분배", icon: "⋯" },
  { action: "distribute-v", label: "세로 분배", icon: "⋮" },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

const COLORS = [
  "#171717", "#ffffff", "#737373", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#6366f1",
];

export function ElementToolbar({
  onInsertText,
  onInsertShape,
  onInsertImage,
  onInsertCode,
  onImport,
  importing,
  selectedElements,
  onAlign,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onDelete,
  onDuplicate,
  onLock,
  onStyleChange,
}: ElementToolbarProps) {
  const hasSelection = selectedElements.length > 0;
  const multiSelect = selectedElements.length > 1;
  const singleEl = selectedElements.length === 1 ? selectedElements[0] : null;
  const isText = singleEl?.type === "text";
  const textContent = isText ? (singleEl.content as ElementTextContent) : null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {/* Insert tools */}
      <ToolGroup>
        <ToolBtn onClick={onInsertText} title="텍스트 추가 (더블클릭으로도 추가 가능)" icon={<Type className="w-3.5 h-3.5" />} />
        <ShapeDropdown onInsertShape={onInsertShape} />
        <ToolBtn onClick={onInsertImage} title="이미지 삽입" icon={<Image className="w-3.5 h-3.5" />} />
        <ToolBtn onClick={onInsertCode} title="코드 블록 삽입" icon={<Code2 className="w-3.5 h-3.5" />} />
        {onImport && (
          <>
            <Divider />
            <ToolBtn
              onClick={onImport}
              title="파일 가져오기 (PPT, PDF, DOCX, MD)"
              icon={importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5" />}
            />
          </>
        )}
      </ToolGroup>

      {/* Text formatting */}
      {isText && textContent && singleEl && onStyleChange && (
        <>
          <Divider />
          <ToolGroup>
            <FontFamilyDropdown
              value={textContent.fontFamily || "Pretendard Variable"}
              onChange={(fontFamily) =>
                onStyleChange(singleEl.id, {
                  content: { ...textContent, fontFamily },
                })
              }
            />
            <select
              value={textContent.fontSize}
              onChange={(e) =>
                onStyleChange(singleEl.id, {
                  content: { ...textContent, fontSize: Number(e.target.value) },
                })
              }
              className="w-16 text-[11px] text-neutral-600 bg-transparent border-none outline-none cursor-pointer"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
            <ToolBtn
              onClick={() =>
                onStyleChange(singleEl.id, {
                  content: { ...textContent, fontWeight: textContent.fontWeight === "bold" ? "normal" : "bold" },
                })
              }
              title="굵게 (Ctrl+B)"
              icon={<Bold className="w-3.5 h-3.5" />}
              active={textContent.fontWeight === "bold"}
            />
            <ToolBtn
              onClick={() =>
                onStyleChange(singleEl.id, {
                  content: { ...textContent, fontStyle: textContent.fontStyle === "italic" ? "normal" : "italic" },
                })
              }
              title="기울임 (Ctrl+I)"
              icon={<Italic className="w-3.5 h-3.5" />}
              active={textContent.fontStyle === "italic"}
            />
            <ToolBtn
              onClick={() =>
                onStyleChange(singleEl.id, {
                  content: { ...textContent, textDecoration: textContent.textDecoration === "underline" ? "none" : "underline" },
                })
              }
              title="밑줄 (Ctrl+U)"
              icon={<Underline className="w-3.5 h-3.5" />}
              active={textContent.textDecoration === "underline"}
            />
          </ToolGroup>
          <Divider />
          <ToolGroup>
            <ToolBtn
              onClick={() => onStyleChange(singleEl.id, { content: { ...textContent, textAlign: "left" } })}
              title="왼쪽 정렬"
              icon={<AlignLeft className="w-3.5 h-3.5" />}
              active={(textContent.textAlign || "left") === "left"}
            />
            <ToolBtn
              onClick={() => onStyleChange(singleEl.id, { content: { ...textContent, textAlign: "center" } })}
              title="가운데 정렬"
              icon={<AlignCenter className="w-3.5 h-3.5" />}
              active={textContent.textAlign === "center"}
            />
            <ToolBtn
              onClick={() => onStyleChange(singleEl.id, { content: { ...textContent, textAlign: "right" } })}
              title="오른쪽 정렬"
              icon={<AlignRight className="w-3.5 h-3.5" />}
              active={textContent.textAlign === "right"}
            />
          </ToolGroup>
          <Divider />
          <ColorPicker
            value={textContent.color || "#171717"}
            onChange={(color) =>
              onStyleChange(singleEl.id, { content: { ...textContent, color } })
            }
            label="글자 색상"
          />
        </>
      )}

      {/* Shape fill/stroke */}
      {singleEl?.type === "shape" && onStyleChange && (
        <>
          <Divider />
          <ColorPicker
            value={singleEl.style.fill || "#e5e7eb"}
            onChange={(fill) =>
              onStyleChange(singleEl.id, { style: { ...singleEl.style, fill } })
            }
            label="채우기"
          />
          <ColorPicker
            value={singleEl.style.stroke || "#9ca3af"}
            onChange={(stroke) =>
              onStyleChange(singleEl.id, { style: { ...singleEl.style, stroke } })
            }
            label="선 색상"
          />
        </>
      )}

      {/* Alignment tools (multi-select) */}
      {multiSelect && (
        <>
          <Divider />
          <ToolGroup>
            {ALIGN_ACTIONS.map(({ action, label, icon }) => (
              <ToolBtn key={action} onClick={() => onAlign(action)} title={label} label={icon} />
            ))}
          </ToolGroup>
        </>
      )}


      {/* Z-order + actions */}
      {hasSelection && (
        <>
          <Divider />
          <ToolGroup>
            <ToolBtn onClick={onBringToFront} title="맨 앞으로 (레이어)" icon={<ArrowUpToLine className="w-3.5 h-3.5" />} />
            <ToolBtn onClick={onBringForward} title="한 단계 앞으로" icon={<ArrowUp className="w-3.5 h-3.5" />} />
            <ToolBtn onClick={onSendBackward} title="한 단계 뒤로" icon={<ArrowDown className="w-3.5 h-3.5" />} />
            <ToolBtn onClick={onSendToBack} title="맨 뒤로 (레이어)" icon={<ArrowDownToLine className="w-3.5 h-3.5" />} />
          </ToolGroup>
          <Divider />
          <ToolGroup>
            <ToolBtn onClick={onDuplicate} title="복제 (Ctrl+D)" icon={<Copy className="w-3.5 h-3.5" />} />
            <ToolBtn onClick={onLock} title={singleEl?.locked ? "잠금 해제" : "잠금"} icon={singleEl?.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />} />
            <ToolBtn onClick={onDelete} title="삭제 (Del)" icon={<Trash2 className="w-3.5 h-3.5" />} danger />
          </ToolGroup>
        </>
      )}
    </div>
  );
}

// ── Sub-components ──

function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 px-1 py-0.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-neutral-200 mx-0.5" />;
}

function ToolBtn({
  onClick, title, label, icon, active, danger,
}: {
  onClick: () => void;
  title: string;
  label?: string;
  icon?: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-[11px] transition ${
        active
          ? "bg-neutral-200 text-neutral-900"
          : danger
          ? "text-red-400 hover:text-red-600 hover:bg-red-50"
          : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {icon || label}
    </button>
  );
}

// ── Click-toggle shape dropdown ──

function ShapeDropdown({ onInsertShape }: { onInsertShape: (k: ShapeKind) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-7 h-7 flex items-center justify-center rounded transition ${
          open ? "bg-neutral-200 text-neutral-900" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
        }`}
        title="도형 삽입"
      >
        <Square className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 p-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col gap-0.5 min-w-[130px]">
          {SHAPES.map(({ kind, label, icon }) => (
            <button
              key={kind}
              onClick={() => {
                onInsertShape(kind);
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition text-left"
            >
              <span className="w-4 text-center">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Font family dropdown ──

function FontFamilyDropdown({
  value, onChange,
}: {
  value: string;
  onChange: (family: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [langFilter, setLangFilter] = useState<FontLang>("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const currentFont = FONTS.find((f) => f.family === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-1.5 h-7 rounded text-[11px] transition max-w-[120px] ${
          open ? "bg-neutral-200 text-neutral-900" : "text-neutral-600 hover:bg-neutral-50"
        }`}
        title="글꼴 선택"
      >
        <span className="truncate" style={{ fontFamily: `"${value}", sans-serif` }}>
          {currentFont?.label || value}
        </span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 text-neutral-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 w-60 max-h-96 flex flex-col">
          {/* Language filter tabs */}
          <div className="flex border-b border-neutral-100 px-2 pt-1.5 pb-0 sticky top-0 bg-white z-10 rounded-t-lg">
            {FONT_LANGS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLangFilter(l.key)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-t transition border-b-2 ${
                  langFilter === l.key
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          {/* Font list */}
          <div className="overflow-y-auto flex-1">
            {FONT_CATEGORIES.map((cat) => {
              const fonts = FONTS.filter(
                (f) => f.category === cat.key && (langFilter === "all" || f.lang === langFilter || f.lang === "both")
              );
              if (fonts.length === 0) return null;
              return (
                <div key={cat.key}>
                  <div className="px-3 py-1.5 text-[10px] text-neutral-400 font-medium uppercase tracking-wider sticky top-0 bg-neutral-50 border-b border-neutral-100">
                    {cat.label} ({fonts.length})
                  </div>
                  {fonts.map((font) => (
                    <button
                      key={font.family}
                      onClick={() => {
                        onChange(font.family);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] transition ${
                        value === font.family
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <span className="truncate" style={{ fontFamily: `"${font.family}", sans-serif` }}>
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
          </div>
        </div>
      )}
    </div>
  );
}

// ── Click-toggle color picker ──

function ColorPicker({
  value, onChange, label,
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-7 h-7 flex items-center justify-center rounded transition ${
          open ? "bg-neutral-100" : "hover:bg-neutral-50"
        }`}
        title={label || "색상"}
      >
        <span
          className="w-4 h-4 rounded border border-neutral-300"
          style={{ backgroundColor: value }}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 w-36">
          {label && (
            <p className="text-[10px] text-neutral-400 mb-1.5">{label}</p>
          )}
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={`w-5 h-5 rounded-full border-2 transition hover:scale-110 ${
                  value === c ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-neutral-300"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-7 cursor-pointer border border-neutral-200 rounded"
          />
        </div>
      )}
    </div>
  );
}
