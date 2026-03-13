"use client";

import { useRef, useState, useCallback } from "react";
import type {
  SlideElement,
  ElementTextContent,
  ElementShapeContent,
  ElementImageContent,
  ElementCodeContent,
  ElementContent,
} from "@/types/slide";
import type { ResizeHandle } from "@/hooks/useCanvasDrag";

interface CanvasElementProps {
  element: SlideElement;
  selected: boolean;
  editing: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onDoubleClick: (id: string) => void;
  onStartMove: (e: React.PointerEvent, id: string) => void;
  onStartResize: (e: React.PointerEvent, id: string, handle: ResizeHandle) => void;
  onStartRotate: (e: React.PointerEvent, id: string, cx: number, cy: number) => void;
  onContentChange: (id: string, content: ElementContent) => void;
}

const HANDLES: { handle: ResizeHandle; style: React.CSSProperties }[] = [
  { handle: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
  { handle: "n", style: { top: -5, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" } },
  { handle: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
  { handle: "w", style: { top: "50%", left: -5, transform: "translateY(-50%)", cursor: "w-resize" } },
  { handle: "e", style: { top: "50%", right: -5, transform: "translateY(-50%)", cursor: "e-resize" } },
  { handle: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
  { handle: "s", style: { bottom: -5, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" } },
  { handle: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
];

export function CanvasElement({
  element,
  selected,
  editing,
  onSelect,
  onDoubleClick,
  onStartMove,
  onStartResize,
  onStartRotate,
  onContentChange,
}: CanvasElementProps) {
  const { id, type, x, y, width, height, rotation, style, content } = element;
  const [hovered, setHovered] = useState(false);

  if (element.visible === false) return null;

  return (
    <div
      data-element-id={id}
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
        cursor: element.locked ? "default" : "move",
      }}
      onPointerDown={(e) => {
        if (element.locked) return;
        onSelect(id, e.shiftKey);
        if (!editing && !e.shiftKey) onStartMove(e, id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(id);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Element content */}
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: type === "text" ? "visible" : "hidden",
          borderRadius: style.borderRadius,
          boxShadow: style.shadow ? "0 4px 16px rgba(0,0,0,0.15)" : undefined,
        }}
      >
        {type === "text" && (
          <TextElement
            content={content as ElementTextContent}
            editing={editing}
            onChange={(c) => onContentChange(id, c)}
          />
        )}
        {type === "shape" && (
          <ShapeElement
            content={content as ElementShapeContent}
            style={style}
            width={width}
            height={height}
          />
        )}
        {type === "image" && (
          <ImageElement
            content={content as ElementImageContent}
            onChange={(c) => onContentChange(id, c)}
          />
        )}
        {type === "code" && (
          <CodeElement
            content={content as ElementCodeContent}
            style={style}
            editing={editing}
            onChange={(c) => onContentChange(id, c)}
          />
        )}
      </div>

      {/* Hover outline (when not selected) */}
      {hovered && !selected && !element.locked && (
        <div
          style={{
            position: "absolute",
            inset: -1,
            border: "1px dashed #a5b4fc",
            borderRadius: style.borderRadius ? style.borderRadius + 1 : 0,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Selection outline + handles */}
      {selected && !element.locked && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -1,
              border: "2px solid #6366f1",
              borderRadius: style.borderRadius ? style.borderRadius + 1 : 0,
              pointerEvents: "none",
            }}
          />
          {/* Resize handles */}
          {HANDLES.map(({ handle, style: hs }) => (
            <div
              key={handle}
              style={{
                position: "absolute",
                width: 10,
                height: 10,
                backgroundColor: "#fff",
                border: "2px solid #6366f1",
                borderRadius: 2,
                zIndex: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                ...hs,
              }}
              onPointerDown={(e) => onStartResize(e, id, handle)}
            />
          ))}
          {/* Rotate handle */}
          <div
            style={{
              position: "absolute",
              top: -28,
              left: "50%",
              transform: "translateX(-50%)",
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: "2px solid #6366f1",
              cursor: "grab",
              zIndex: 10,
            }}
            onPointerDown={(e) => {
              const rect = (e.target as HTMLElement).closest("[data-element-id]")!.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              onStartRotate(e, id, cx, cy);
            }}
          />
          {/* Line from element top to rotate handle */}
          <div
            style={{
              position: "absolute",
              top: -20,
              left: "50%",
              transform: "translateX(-50%)",
              width: 1,
              height: 16,
              backgroundColor: "#6366f1",
              pointerEvents: "none",
            }}
          />
        </>
      )}
    </div>
  );
}

// ── Element renderers ──

function TextElement({
  content,
  editing,
  onChange,
}: {
  content: ElementTextContent;
  editing: boolean;
  onChange: (c: ElementTextContent) => void;
}) {
  const fontFamily = content.fontFamily
    ? `"${content.fontFamily}", sans-serif`
    : undefined;

  const textStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    fontSize: content.fontSize,
    fontFamily,
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
  };

  if (editing) {
    return (
      <div style={textStyle}>
        <textarea
          autoFocus
          value={content.text}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          className="w-full bg-transparent outline-none resize-none"
          style={{
            fontSize: content.fontSize,
            fontFamily,
            fontWeight: content.fontWeight || "normal",
            fontStyle: content.fontStyle || "normal",
            textDecoration: content.textDecoration || "none",
            textAlign: content.textAlign || "left",
            color: content.color || "#171717",
            lineHeight: content.lineHeight || 1.5,
          }}
        />
      </div>
    );
  }

  return (
    <div style={textStyle}>
      <div className="w-full whitespace-pre-wrap">{content.text}</div>
    </div>
  );
}

function ShapeElement({
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
            cx={width / 2}
            cy={height / 2}
            rx={width / 2 - (style.strokeWidth || 0)}
            ry={height / 2 - (style.strokeWidth || 0)}
            fill={style.fill || "#e5e7eb"}
            stroke={style.stroke || "#9ca3af"}
            strokeWidth={style.strokeWidth || 2}
          />
        )}
        {shapeKind === "triangle" && (
          <polygon
            points={`${width / 2},${style.strokeWidth || 2} ${width - (style.strokeWidth || 2)},${height - (style.strokeWidth || 2)} ${style.strokeWidth || 2},${height - (style.strokeWidth || 2)}`}
            fill={style.fill || "#e5e7eb"}
            stroke={style.stroke || "#9ca3af"}
            strokeWidth={style.strokeWidth || 2}
          />
        )}
        {shapeKind === "diamond" && (
          <polygon
            points={`${width / 2},${style.strokeWidth || 2} ${width - (style.strokeWidth || 2)},${height / 2} ${width / 2},${height - (style.strokeWidth || 2)} ${style.strokeWidth || 2},${height / 2}`}
            fill={style.fill || "#e5e7eb"}
            stroke={style.stroke || "#9ca3af"}
            strokeWidth={style.strokeWidth || 2}
          />
        )}
        {shapeKind === "arrow" && (
          <polygon
            points={`0,${height * 0.3} ${width * 0.65},${height * 0.3} ${width * 0.65},0 ${width},${height / 2} ${width * 0.65},${height} ${width * 0.65},${height * 0.7} 0,${height * 0.7}`}
            fill={style.fill || "#e5e7eb"}
            stroke={style.stroke || "#9ca3af"}
            strokeWidth={style.strokeWidth || 2}
          />
        )}
        {content.text && (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={content.textColor || "#171717"}
            fontSize={content.fontSize || 16}
          >
            {content.text}
          </text>
        )}
      </svg>
    );
  }

  // Rectangle, rounded-rect, line
  if (shapeKind === "line") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: style.strokeWidth || 2,
            backgroundColor: style.stroke || "#9ca3af",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: style.fill || "#e5e7eb",
        border: `${style.strokeWidth || 2}px solid ${style.stroke || "#9ca3af"}`,
        borderRadius: style.borderRadius || 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {content.text && (
        <span
          style={{
            color: content.textColor || "#171717",
            fontSize: content.fontSize || 16,
            textAlign: "center",
          }}
        >
          {content.text}
        </span>
      )}
    </div>
  );
}

function ImageElement({
  content,
  onChange,
}: {
  content: ElementImageContent;
  onChange: (c: ElementImageContent) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          onChange({ ...content, imageUrl: data.url, imageAlt: file.name });
        }
      } catch {
        // ignore
      }
      setUploading(false);
    },
    [content, onChange]
  );

  if (content.imageUrl) {
    return (
      <img
        src={content.imageUrl}
        alt={content.imageAlt || ""}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
        draggable={false}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50">
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
        onClick={(e) => {
          e.stopPropagation();
          fileRef.current?.click();
        }}
        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition"
      >
        {uploading ? "업로드 중..." : "이미지 업로드"}
      </button>
    </div>
  );
}

function CodeElement({
  content,
  style,
  editing,
  onChange,
}: {
  content: ElementCodeContent;
  style: { fill?: string; borderRadius?: number };
  editing: boolean;
  onChange: (c: ElementCodeContent) => void;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: style.fill || "#1e1e2e",
        borderRadius: style.borderRadius || 8,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20">
        {editing ? (
          <select
            value={content.language}
            onChange={(e) => onChange({ ...content, language: e.target.value })}
            className="bg-transparent text-neutral-400 text-xs outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {["javascript", "typescript", "python", "java", "go", "rust", "html", "css", "sql", "bash", "json"].map(
              (l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              )
            )}
          </select>
        ) : (
          <span className="text-neutral-400 text-xs">{content.language}</span>
        )}
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={content.code}
          onChange={(e) => onChange({ ...content, code: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="코드 입력..."
          className="flex-1 p-3 bg-transparent text-sm font-mono outline-none resize-none"
          style={{ color: "#cdd6f4" }}
          spellCheck={false}
        />
      ) : (
        <pre
          className="flex-1 p-3 text-sm font-mono whitespace-pre-wrap overflow-auto"
          style={{ color: "#cdd6f4" }}
        >
          {content.code || " "}
        </pre>
      )}
    </div>
  );
}
