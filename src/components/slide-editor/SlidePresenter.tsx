"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

const CANVAS_W = 960;
const CANVAS_H = 540;

interface SlidePresenterProps {
  slides: Slide[];
  theme: PresentationTheme;
  startIndex?: number;
  onClose: () => void;
}

export function SlidePresenter({
  slides,
  theme,
  startIndex = 0,
  onClose,
}: SlidePresenterProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [windowSize, setWindowSize] = useState({ w: 960, h: 540 });
  const [transitionClass, setTransitionClass] = useState("");

  useEffect(() => {
    const update = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scale = Math.min(windowSize.w / CANVAS_W, windowSize.h / CANVAS_H);

  const navigateTo = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= slides.length || newIndex === currentIndex) return;

      const targetSlide = slides[newIndex];
      const transition = targetSlide.transition || "none";

      if (transition === "none") {
        setCurrentIndex(newIndex);
        return;
      }

      const isForward = newIndex > currentIndex;
      let enterClass = "";

      if (transition === "fade") {
        enterClass = "slide-transition-fade";
      } else if (transition === "slide-left") {
        enterClass = isForward
          ? "slide-transition-slide-left-enter"
          : "slide-transition-slide-right-enter";
      } else if (transition === "slide-up") {
        enterClass = isForward
          ? "slide-transition-slide-up-enter"
          : "slide-transition-slide-down-enter";
      }

      setTransitionClass(enterClass);
      setCurrentIndex(newIndex);

      setTimeout(() => {
        setTransitionClass("");
      }, 400);
    },
    [currentIndex, slides]
  );

  const goNext = useCallback(() => {
    navigateTo(currentIndex + 1);
  }, [currentIndex, navigateTo]);

  const goPrev = useCallback(() => {
    navigateTo(currentIndex - 1);
  }, [currentIndex, navigateTo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft" || e.key === "Backspace") goPrev();
      if (e.key === "Home") navigateTo(0);
      if (e.key === "End") navigateTo(slides.length - 1);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose, slides.length, navigateTo]);

  // Enter fullscreen
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    document.body.style.overflow = "hidden";
    return () => {
      document.exitFullscreen?.().catch(() => {});
      document.body.style.overflow = "";
    };
  }, []);

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return null;

  const isFreeform = !!(currentSlide.elements && currentSlide.elements.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={goNext}
      onContextMenu={(e) => {
        e.preventDefault();
        goPrev();
      }}
    >
      {/* Slide with transition */}
      <div className={transitionClass}>
        {isFreeform ? (
          <PresentationFreeformSlide
            slide={currentSlide}
            theme={theme}
            scale={scale}
          />
        ) : (
          <SlideCanvas
            slide={currentSlide}
            theme={theme}
            scale={scale}
            interactive={false}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-white/40 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Slide number */}
      <div className="absolute bottom-3 right-4 text-white/20 text-xs select-none">
        {currentIndex + 1} / {slides.length}
      </div>

      {/* Speaker notes */}
      {currentSlide.notes && (
        <div className="absolute bottom-8 left-4 right-4 text-white/15 text-[10px] max-w-md truncate select-none pointer-events-none">
          {currentSlide.notes}
        </div>
      )}

      {/* Close hint */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-3 right-4 text-white/20 hover:text-white/60 text-xs transition cursor-pointer"
      >
        ESC
      </button>

      {/* Transition styles */}
      <style jsx>{`
        .slide-transition-fade {
          animation: fadeIn 0.4s ease-out;
        }
        .slide-transition-slide-left-enter {
          animation: slideLeftIn 0.4s ease-out;
        }
        .slide-transition-slide-right-enter {
          animation: slideRightIn 0.4s ease-out;
        }
        .slide-transition-slide-up-enter {
          animation: slideUpIn 0.4s ease-out;
        }
        .slide-transition-slide-down-enter {
          animation: slideDownIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideLeftIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideRightIn {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideUpIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDownIn {
          from { transform: translateY(-100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Read-only freeform slide renderer for presentation mode ──

function PresentationFreeformSlide({
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
        width: CANVAS_W * scale,
        height: CANVAS_H * scale,
        borderRadius: 8 * scale,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          ...bgStyle,
          position: "relative",
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          fontFamily: theme.fontFamily,
        }}
      >
        {sorted.map((el) => (
          <PresentationElement key={el.id} element={el} />
        ))}

        {/* 워터마크 */}
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

function PresentationElement({ element }: { element: SlideElement }) {
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
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: style.borderRadius,
          boxShadow: style.shadow ? "0 4px 16px rgba(0,0,0,0.15)" : undefined,
        }}
      >
        {type === "text" && <PresentTextElement content={content as ElementTextContent} />}
        {type === "shape" && (
          <PresentShapeElement
            content={content as ElementShapeContent}
            style={style}
            width={width}
            height={height}
          />
        )}
        {type === "image" && <PresentImageElement content={content as ElementImageContent} />}
        {type === "code" && (
          <PresentCodeElement content={content as ElementCodeContent} style={style} />
        )}
      </div>
    </div>
  );
}

function PresentTextElement({ content }: { content: ElementTextContent }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontSize: content.fontSize,
        fontWeight: content.fontWeight || "normal",
        fontStyle: content.fontStyle || "normal",
        textDecoration: content.textDecoration || "none",
        textAlign: content.textAlign || "left",
        color: content.color || "#171717",
        lineHeight: content.lineHeight || 1.5,
        display: "flex",
        alignItems:
          content.verticalAlign === "bottom"
            ? "flex-end"
            : content.verticalAlign === "middle"
            ? "center"
            : "flex-start",
        padding: 8,
      }}
    >
      <div className="w-full whitespace-pre-wrap">{content.text}</div>
    </div>
  );
}

function PresentShapeElement({
  content,
  style,
  width,
  height,
}: {
  content: ElementShapeContent;
  style: { fill?: string; stroke?: string; strokeWidth?: number; borderRadius?: number };
  width: number;
  height: number;
}) {
  const { shapeKind } = content;

  if (shapeKind === "circle" || shapeKind === "triangle" || shapeKind === "diamond" || shapeKind === "arrow") {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {shapeKind === "circle" && (
          <ellipse
            cx={width / 2} cy={height / 2}
            rx={width / 2 - (style.strokeWidth || 0)}
            ry={height / 2 - (style.strokeWidth || 0)}
            fill={style.fill || "#e5e7eb"} stroke={style.stroke || "#9ca3af"}
            strokeWidth={style.strokeWidth || 2}
          />
        )}
        {shapeKind === "triangle" && (
          <polygon
            points={`${width / 2},2 ${width - 2},${height - 2} 2,${height - 2}`}
            fill={style.fill || "#e5e7eb"} stroke={style.stroke || "#9ca3af"}
            strokeWidth={style.strokeWidth || 2}
          />
        )}
        {shapeKind === "diamond" && (
          <polygon
            points={`${width / 2},2 ${width - 2},${height / 2} ${width / 2},${height - 2} 2,${height / 2}`}
            fill={style.fill || "#e5e7eb"} stroke={style.stroke || "#9ca3af"}
            strokeWidth={style.strokeWidth || 2}
          />
        )}
        {shapeKind === "arrow" && (
          <polygon
            points={`0,${height * 0.3} ${width * 0.65},${height * 0.3} ${width * 0.65},0 ${width},${height / 2} ${width * 0.65},${height} ${width * 0.65},${height * 0.7} 0,${height * 0.7}`}
            fill={style.fill || "#e5e7eb"} stroke={style.stroke || "#9ca3af"}
            strokeWidth={style.strokeWidth || 2}
          />
        )}
        {content.text && (
          <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="central"
            fill={content.textColor || "#171717"} fontSize={content.fontSize || 16}>
            {content.text}
          </text>
        )}
      </svg>
    );
  }

  if (shapeKind === "line") {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: style.strokeWidth || 2, backgroundColor: style.stroke || "#9ca3af" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%", height: "100%",
        backgroundColor: style.fill || "#e5e7eb",
        border: `${style.strokeWidth || 2}px solid ${style.stroke || "#9ca3af"}`,
        borderRadius: style.borderRadius || 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {content.text && (
        <span style={{ color: content.textColor || "#171717", fontSize: content.fontSize || 16 }}>
          {content.text}
        </span>
      )}
    </div>
  );
}

function PresentImageElement({ content }: { content: ElementImageContent }) {
  if (!content.imageUrl) return null;
  return (
    <img
      src={content.imageUrl}
      alt={content.imageAlt || ""}
      style={{ width: "100%", height: "100%", objectFit: content.objectFit || "contain" }}
      draggable={false}
    />
  );
}

function PresentCodeElement({
  content,
  style,
}: {
  content: ElementCodeContent;
  style: { fill?: string; borderRadius?: number };
}) {
  return (
    <div
      style={{
        width: "100%", height: "100%",
        backgroundColor: style.fill || "#1e1e2e",
        borderRadius: style.borderRadius || 8,
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20">
        <span className="text-neutral-400 text-xs">{content.language}</span>
      </div>
      <pre className="flex-1 p-3 text-sm font-mono whitespace-pre-wrap overflow-auto" style={{ color: "#cdd6f4" }}>
        {content.code}
      </pre>
    </div>
  );
}
