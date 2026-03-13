"use client";

import { useRef, useState, memo } from "react";
import type {
  Slide,
  PresentationTheme,
  SlideElement,
  ElementTextContent,
  ElementShapeContent,
  ElementImageContent,
  ElementCodeContent,
} from "@/types/slide";
import { SlideCanvas } from "./SlideCanvas";
import { Plus, Trash2, Copy } from "lucide-react";

interface SlideThumbnailsProps {
  slides: Slide[];
  activeIndex: number;
  theme: PresentationTheme;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function SlideThumbnails({
  slides,
  activeIndex,
  theme,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
  onReorder,
}: SlideThumbnailsProps) {
  const dragSrcRef = useRef<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragSrcRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragSrcRef.current !== null && dragSrcRef.current !== index) {
      setDropTarget(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragSrcRef.current !== null && dragSrcRef.current !== index) {
      onReorder(dragSrcRef.current, index);
    }
    dragSrcRef.current = null;
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    dragSrcRef.current = null;
    setDropTarget(null);
  };

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
      {slides.map((slide, i) => (
        <div key={slide.id}>
          {/* Drop indicator */}
          {dropTarget === i && dragSrcRef.current !== null && dragSrcRef.current > i && (
            <div className="h-0.5 bg-indigo-500 rounded-full mx-1 mb-1" />
          )}

          <div
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(i)}
            className={`group relative cursor-pointer rounded-lg overflow-hidden transition-all duration-150 ${
              i === activeIndex
                ? "ring-2 ring-indigo-500 shadow-md"
                : "ring-1 ring-neutral-200 hover:ring-neutral-300"
            } ${
              dragSrcRef.current === i ? "opacity-50" : ""
            }`}
          >
            {/* Slide number */}
            <div className="absolute top-1 left-1.5 z-10 text-[9px] font-medium text-neutral-400 bg-white/80 backdrop-blur-sm rounded px-1">
              {i + 1}
            </div>

            {/* Action buttons */}
            <div className="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(i);
                }}
                className="p-0.5 bg-white/80 backdrop-blur-sm rounded hover:bg-indigo-50"
                title="복제"
              >
                <Copy className="w-2.5 h-2.5 text-neutral-400 hover:text-indigo-500" />
              </button>
              {slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(i);
                  }}
                  className="p-0.5 bg-white/80 backdrop-blur-sm rounded hover:bg-red-50"
                  title="삭제"
                >
                  <Trash2 className="w-2.5 h-2.5 text-neutral-400 hover:text-red-500" />
                </button>
              )}
            </div>

            {/* Transition indicator */}
            {slide.transition && slide.transition !== "none" && (
              <div className="absolute bottom-1 left-1.5 z-10 text-[8px] text-indigo-400 bg-white/80 backdrop-blur-sm rounded px-1">
                {slide.transition === "fade" ? "F" : slide.transition === "slide-left" ? "←" : "↑"}
              </div>
            )}

            {/* Mini canvas */}
            <div className="pointer-events-none">
              <MemoizedCanvas slide={slide} theme={theme} />
            </div>
          </div>

          {/* Drop indicator (after) */}
          {dropTarget === i && dragSrcRef.current !== null && dragSrcRef.current < i && (
            <div className="h-0.5 bg-indigo-500 rounded-full mx-1 mt-1" />
          )}
        </div>
      ))}

      {/* Add slide button */}
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-1 py-3 border border-dashed border-neutral-300 rounded-lg text-[11px] text-neutral-400 hover:border-neutral-500 hover:text-neutral-600 transition"
      >
        <Plus className="w-3 h-3" />
        추가
      </button>
    </div>
  );
}

const THUMB_SCALE = 0.17;

const MemoizedCanvas = memo(function MemoCanvas({
  slide,
  theme,
}: {
  slide: Slide;
  theme: PresentationTheme;
}) {
  const hasFreeform = !!(slide.elements && slide.elements.length > 0);

  if (hasFreeform) {
    return <MiniFreefom slide={slide} theme={theme} scale={THUMB_SCALE} />;
  }

  return (
    <SlideCanvas
      slide={slide}
      theme={theme}
      scale={THUMB_SCALE}
      interactive={false}
    />
  );
});

function MiniFreefom({
  slide,
  theme,
  scale,
}: {
  slide: Slide;
  theme: PresentationTheme;
  scale: number;
}) {
  const elements = slide.elements || [];
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const bgStyle = theme.bgGradient
    ? { background: theme.bgGradient }
    : { backgroundColor: theme.bgColor };

  return (
    <div
      style={{
        width: 960 * scale,
        height: 540 * scale,
        overflow: "hidden",
        position: "relative",
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
          fontFamily: theme.fontFamily,
        }}
      >
        {sorted.map((el) => (
          <MiniElement key={el.id} element={el} />
        ))}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            right: 20,
            fontSize: 10,
            fontWeight: 500,
            color: theme.bodyColor,
            opacity: 0.25,
          }}
        >
          한국AI강사협회
        </div>
      </div>
    </div>
  );
}

function MiniElement({ element }: { element: SlideElement }) {
  const { type, x, y, width, height, rotation, style, content } = element;
  if (element.visible === false) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
        zIndex: element.zIndex,
        opacity: style.opacity ?? 1,
        overflow: "hidden",
        borderRadius: style.borderRadius,
      }}
    >
      {type === "text" && (() => {
        const c = content as ElementTextContent;
        return (
          <div
            style={{
              width: "100%", height: "100%", padding: 8,
              fontSize: c.fontSize, fontWeight: c.fontWeight || "normal",
              color: c.color || "#171717", lineHeight: c.lineHeight || 1.5,
              textAlign: c.textAlign || "left",
              display: "flex",
              alignItems: c.verticalAlign === "bottom" ? "flex-end" : c.verticalAlign === "middle" ? "center" : "flex-start",
            }}
          >
            <div className="w-full whitespace-pre-wrap overflow-hidden">{c.text}</div>
          </div>
        );
      })()}
      {type === "shape" && (() => {
        const c = content as ElementShapeContent;
        if (c.shapeKind === "circle") {
          return (
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
              <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 1} ry={height / 2 - 1}
                fill={style.fill || "#e5e7eb"} stroke={style.stroke || "#9ca3af"} strokeWidth={style.strokeWidth || 2} />
            </svg>
          );
        }
        return (
          <div style={{
            width: "100%", height: "100%",
            backgroundColor: style.fill || "#e5e7eb",
            border: `${style.strokeWidth || 2}px solid ${style.stroke || "#9ca3af"}`,
            borderRadius: style.borderRadius || 0,
          }} />
        );
      })()}
      {type === "image" && (() => {
        const c = content as ElementImageContent;
        return c.imageUrl ? (
          <img src={c.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: c.objectFit || "contain" }} draggable={false} />
        ) : null;
      })()}
      {type === "code" && (
        <div style={{ width: "100%", height: "100%", backgroundColor: style.fill || "#1e1e2e", borderRadius: style.borderRadius || 8 }} />
      )}
    </div>
  );
}
