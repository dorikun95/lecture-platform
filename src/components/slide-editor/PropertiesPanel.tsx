"use client";

import type { Slide, SlotContent, PresentationTheme, SlideTransition } from "@/types/slide";
import { getLayout } from "@/lib/slide-utils";

interface PropertiesPanelProps {
  slide: Slide;
  activeSlot: string | null;
  theme: PresentationTheme;
  onSlotChange: (slotId: string, content: SlotContent) => void;
  onSlideChange: (slide: Slide) => void;
}

const TRANSITIONS: { id: SlideTransition; label: string }[] = [
  { id: "none", label: "없음" },
  { id: "fade", label: "페이드" },
  { id: "slide-left", label: "슬라이드 (좌)" },
  { id: "slide-up", label: "슬라이드 (상)" },
];

export function PropertiesPanel({
  slide,
  activeSlot,
  theme,
  onSlotChange,
  onSlideChange,
}: PropertiesPanelProps) {
  const layout = getLayout(slide.layoutId);

  // Find the active slot definition
  const slotDef = activeSlot
    ? layout.slots.find((s) => s.id === activeSlot)
    : null;
  const slotContent = activeSlot ? slide.slots[activeSlot] || {} : null;

  return (
    <div className="w-56 flex-shrink-0 overflow-y-auto border-l border-neutral-100 pl-4">
      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-3">
        {activeSlot && slotDef ? slotDef.label : "슬라이드"}
      </p>

      {activeSlot && slotContent && slotDef ? (
        <SlotProperties
          slotId={activeSlot}
          slotType={slotDef.type}
          content={slotContent}
          theme={theme}
          onChange={(c) => onSlotChange(activeSlot, c)}
        />
      ) : (
        <SlideProperties
          slide={slide}
          layout={layout}
          onChange={onSlideChange}
        />
      )}
    </div>
  );
}

function SlotProperties({
  slotId,
  slotType,
  content,
  theme,
  onChange,
}: {
  slotId: string;
  slotType: string;
  content: SlotContent;
  theme: PresentationTheme;
  onChange: (c: SlotContent) => void;
}) {
  if (slotType === "image") {
    return (
      <div className="space-y-3">
        <PropertyRow label="대체 텍스트">
          <input
            value={content.imageAlt || ""}
            onChange={(e) => onChange({ ...content, imageAlt: e.target.value })}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded-md outline-none focus:border-neutral-400"
            placeholder="이미지 설명"
          />
        </PropertyRow>
      </div>
    );
  }

  if (slotType === "code") {
    return (
      <div className="space-y-3">
        <PropertyRow label="언어">
          <select
            value={content.language || "javascript"}
            onChange={(e) => onChange({ ...content, language: e.target.value })}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded-md outline-none"
          >
            {["javascript","typescript","python","java","go","rust","html","css","sql","bash","json","yaml"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </PropertyRow>
      </div>
    );
  }

  // Text-based slots (title, subtitle, body)
  return (
    <div className="space-y-3">
      <PropertyRow label="폰트 크기">
        <input
          type="number"
          value={content.fontSize || ""}
          onChange={(e) =>
            onChange({
              ...content,
              fontSize: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="w-full text-xs px-2 py-1 border border-neutral-200 rounded-md outline-none focus:border-neutral-400"
          placeholder="기본값"
          min={10}
          max={100}
        />
      </PropertyRow>

      <PropertyRow label="굵기">
        <select
          value={content.fontWeight || ""}
          onChange={(e) =>
            onChange({
              ...content,
              fontWeight: (e.target.value as "normal" | "bold") || undefined,
            })
          }
          className="w-full text-xs px-2 py-1 border border-neutral-200 rounded-md outline-none"
        >
          <option value="">기본값</option>
          <option value="normal">일반</option>
          <option value="bold">굵게</option>
        </select>
      </PropertyRow>

      <PropertyRow label="정렬">
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => onChange({ ...content, textAlign: align })}
              className={`flex-1 text-[10px] py-1 rounded transition ${
                (content.textAlign || "left") === align
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              {align === "left" ? "좌" : align === "center" ? "중" : "우"}
            </button>
          ))}
        </div>
      </PropertyRow>

      <PropertyRow label="색상">
        <input
          type="color"
          value={content.textColor || theme.titleColor}
          onChange={(e) =>
            onChange({ ...content, textColor: e.target.value })
          }
          className="w-full h-7 border border-neutral-200 rounded-md cursor-pointer"
        />
        {content.textColor && (
          <button
            onClick={() => onChange({ ...content, textColor: undefined })}
            className="text-[10px] text-neutral-400 hover:text-neutral-600 mt-1"
          >
            기본값으로 초기화
          </button>
        )}
      </PropertyRow>
    </div>
  );
}

function SlideProperties({
  slide,
  layout,
  onChange,
}: {
  slide: Slide;
  layout: { name: string };
  onChange: (s: Slide) => void;
}) {
  return (
    <div className="space-y-3">
      <PropertyRow label="레이아웃">
        <p className="text-xs text-neutral-600">{layout.name}</p>
      </PropertyRow>

      <PropertyRow label="전환 효과">
        <select
          value={slide.transition || "none"}
          onChange={(e) =>
            onChange({ ...slide, transition: e.target.value as SlideTransition })
          }
          className="w-full text-xs px-2 py-1 border border-neutral-200 rounded-md outline-none"
        >
          {TRANSITIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label="발표자 노트">
        <textarea
          value={slide.notes || ""}
          onChange={(e) => onChange({ ...slide, notes: e.target.value })}
          placeholder="발표 시 참고할 메모..."
          className="w-full text-xs px-2 py-1.5 border border-neutral-200 rounded-md outline-none focus:border-neutral-400 resize-y min-h-[60px]"
          rows={3}
        />
      </PropertyRow>
    </div>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] text-neutral-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
