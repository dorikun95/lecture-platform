"use client";

import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { SlideElement } from "@/types/slide";

interface StatusBarProps {
  slideIndex: number;
  totalSlides: number;
  selectedElements: SlideElement[];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomFit: () => void;
}

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

export function StatusBar({
  slideIndex,
  totalSlides,
  selectedElements,
  zoom,
  onZoomChange,
  onZoomFit,
}: StatusBarProps) {
  const zoomPercent = Math.round(zoom * 100);

  const zoomIn = () => {
    const next = ZOOM_PRESETS.find((p) => p > zoom + 0.01);
    onZoomChange(next ?? 3);
  };

  const zoomOut = () => {
    const prev = [...ZOOM_PRESETS].reverse().find((p) => p < zoom - 0.01);
    onZoomChange(prev ?? 0.25);
  };

  // Selection info
  let selectionInfo = "";
  if (selectedElements.length === 1) {
    const el = selectedElements[0];
    const typeLabel =
      el.type === "text" ? "텍스트" :
      el.type === "shape" ? "도형" :
      el.type === "image" ? "이미지" :
      el.type === "code" ? "코드" : el.type;
    selectionInfo = `${typeLabel} ${el.width}×${el.height}`;
  } else if (selectedElements.length > 1) {
    selectionInfo = `${selectedElements.length}개 선택됨`;
  }

  return (
    <div className="h-7 bg-neutral-50 border-t border-neutral-200 flex items-center px-3 text-[11px] text-neutral-500 select-none flex-shrink-0">
      {/* Left: slide info */}
      <span className="tabular-nums">
        슬라이드 {slideIndex + 1} / {totalSlides}
      </span>

      {/* Center: selection info */}
      <div className="flex-1 text-center">
        {selectionInfo && (
          <span className="text-neutral-400">{selectionInfo}</span>
        )}
      </div>

      {/* Right: zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={zoomOut}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 transition"
          title="축소"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <button
          onClick={onZoomFit}
          className="px-1.5 py-0.5 rounded hover:bg-neutral-200 transition tabular-nums min-w-[44px] text-center text-[10px] font-medium"
          title="화면에 맞춤"
        >
          {zoomPercent}%
        </button>

        <button
          onClick={zoomIn}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 transition"
          title="확대"
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        <div className="w-px h-3.5 bg-neutral-200 mx-0.5" />

        <button
          onClick={onZoomFit}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 transition"
          title="화면에 맞춤"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
