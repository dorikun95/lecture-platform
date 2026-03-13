"use client";

import type { SlideLayoutId } from "@/types/slide";
import { LAYOUTS } from "@/lib/slide-utils";

interface LayoutPickerProps {
  currentLayout: SlideLayoutId;
  onSelect: (layoutId: SlideLayoutId) => void;
  onClose: () => void;
}

// Layout icons kept for reference (not rendered directly)

export function LayoutPicker({ currentLayout, onSelect, onClose }: LayoutPickerProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-100 rounded-xl shadow-xl p-3 z-30 w-80 animate-slide-up">
      <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-2 px-1">
        레이아웃 선택
      </p>
      <div className="grid grid-cols-3 gap-1.5 max-h-[360px] overflow-y-auto">
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            onClick={() => {
              onSelect(layout.id);
              onClose();
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition ${
              currentLayout === layout.id
                ? "bg-indigo-50 ring-1 ring-indigo-200"
                : "hover:bg-neutral-50"
            }`}
          >
            {/* Mini layout preview */}
            <div className="w-full aspect-[16/9] bg-neutral-100 rounded-md flex flex-col items-center justify-center gap-0.5 p-1.5">
              {renderLayoutPreview(layout.id)}
            </div>
            <span className="text-[10px] text-neutral-500 leading-tight">
              {layout.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function renderLayoutPreview(id: SlideLayoutId) {
  const previewStyles: Record<SlideLayoutId, React.ReactNode> = {
    "title": (
      <div className="w-3/4 h-2 bg-neutral-400 rounded-sm" />
    ),
    "title-subtitle": (
      <>
        <div className="w-3/4 h-2 bg-neutral-400 rounded-sm" />
        <div className="w-1/2 h-1 bg-neutral-300 rounded-sm" />
      </>
    ),
    "title-body": (
      <>
        <div className="w-1/2 h-1.5 bg-neutral-400 rounded-sm" />
        <div className="w-full h-3 bg-neutral-200 rounded-sm" />
      </>
    ),
    "section-header": (
      <div className="w-2/3 h-3 bg-neutral-400 rounded-sm" />
    ),
    "two-column": (
      <>
        <div className="w-1/2 h-1 bg-neutral-400 rounded-sm" />
        <div className="flex gap-0.5 w-full">
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm" />
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm" />
        </div>
      </>
    ),
    "image-text": (
      <>
        <div className="w-1/3 h-1 bg-neutral-400 rounded-sm" />
        <div className="flex gap-0.5 w-full">
          <div className="flex-1 h-3 bg-indigo-200 rounded-sm" />
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm" />
        </div>
      </>
    ),
    "text-image": (
      <>
        <div className="w-1/3 h-1 bg-neutral-400 rounded-sm" />
        <div className="flex gap-0.5 w-full">
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm" />
          <div className="flex-1 h-3 bg-indigo-200 rounded-sm" />
        </div>
      </>
    ),
    "full-image": (
      <div className="w-full h-5 bg-indigo-200 rounded-sm" />
    ),
    "full-code": (
      <>
        <div className="w-1/3 h-1 bg-neutral-400 rounded-sm" />
        <div className="w-full h-3 bg-neutral-700 rounded-sm" />
      </>
    ),
    "code-explain": (
      <>
        <div className="w-1/3 h-1 bg-neutral-400 rounded-sm" />
        <div className="flex gap-0.5 w-full">
          <div className="flex-1 h-3 bg-neutral-700 rounded-sm" />
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm" />
        </div>
      </>
    ),
    "quiz-slide": (
      <>
        <div className="w-1/3 h-1 bg-neutral-400 rounded-sm" />
        <div className="w-full space-y-0.5">
          <div className="w-full h-1 bg-amber-200 rounded-sm" />
          <div className="w-full h-1 bg-amber-200 rounded-sm" />
        </div>
      </>
    ),
    "blank": (
      <div className="w-full h-5 bg-neutral-200/50 rounded-sm" />
    ),
    "hero": (
      <>
        <div className="w-4/5 h-2.5 bg-neutral-400 rounded-sm" />
        <div className="w-1/2 h-1 bg-neutral-300 rounded-sm" />
        <div className="w-1/4 h-0.5 bg-indigo-300 rounded-sm mt-0.5" />
      </>
    ),
    "big-number": (
      <>
        <div className="w-1/4 h-0.5 bg-neutral-300 rounded-sm" />
        <div className="w-1/3 h-4 bg-indigo-400 rounded-sm" />
        <div className="w-2/3 h-1 bg-neutral-200 rounded-sm" />
      </>
    ),
    "quote": (
      <>
        <div className="w-4/5 h-3 bg-neutral-200 rounded-sm border-l-2 border-indigo-400 pl-1" />
        <div className="w-1/3 h-1 bg-neutral-300 rounded-sm self-end" />
      </>
    ),
    "three-column": (
      <>
        <div className="w-1/2 h-1 bg-neutral-400 rounded-sm" />
        <div className="flex gap-0.5 w-full">
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm" />
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm" />
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm" />
        </div>
      </>
    ),
    "agenda": (
      <>
        <div className="w-1/3 h-1 bg-neutral-400 rounded-sm" />
        <div className="flex gap-0.5 w-full">
          <div className="flex-1 h-3 bg-neutral-200 rounded-sm space-y-0.5 p-0.5">
            <div className="w-full h-0.5 bg-neutral-300 rounded-sm" />
            <div className="w-full h-0.5 bg-neutral-300 rounded-sm" />
            <div className="w-full h-0.5 bg-neutral-300 rounded-sm" />
          </div>
          <div className="flex-1 h-3 bg-indigo-100 rounded-sm" />
        </div>
      </>
    ),
  };

  return previewStyles[id] || null;
}
