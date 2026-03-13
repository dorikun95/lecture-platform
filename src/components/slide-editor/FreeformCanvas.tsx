"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type {
  Slide,
  PresentationTheme,
  SlideElement,
  ElementContent,
  ShapeKind,
} from "@/types/slide";
import { useCanvasDrag } from "@/hooks/useCanvasDrag";
import { CanvasElement } from "./CanvasElement";

const CANVAS_W = 960;
const CANVAS_H = 540;

interface ContextMenuState {
  screenX: number;
  screenY: number;
  canvasX: number;
  canvasY: number;
  elementId?: string;
}

interface FreeformCanvasProps {
  slide: Slide;
  theme: PresentationTheme;
  selectedIds: string[];
  editingId: string | null;
  onSelect: (ids: string[]) => void;
  onEditStart: (id: string) => void;
  onElementUpdate: (id: string, changes: Partial<SlideElement>) => void;
  onContentChange: (id: string, content: ElementContent) => void;
  onCanvasClick: () => void;
  onInsertTextAt?: (x: number, y: number) => void;
  onInsertShapeAt?: (kind: ShapeKind, x: number, y: number) => void;
  onInsertImageAt?: (x: number, y: number) => void;
  onInsertCodeAt?: (x: number, y: number) => void;
  onDuplicateElement?: () => void;
  onDeleteElement?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onImportFile?: (file: File) => void;
  importing?: boolean;
  /** External scale override (if provided, auto-zoom is skipped) */
  externalScale?: number;
  /** Zoom change callback for Ctrl+scroll */
  onZoomChange?: (zoom: number) => void;
  /** Current zoom for reporting auto-zoom back */
  onAutoZoom?: (zoom: number) => void;
  /** Pan offset */
  panOffset?: { x: number; y: number };
  /** Pan change callback */
  onPanChange?: (offset: { x: number; y: number }) => void;
}

export function FreeformCanvas({
  slide,
  theme,
  selectedIds,
  editingId,
  onSelect,
  onEditStart,
  onElementUpdate,
  onContentChange,
  onCanvasClick,
  onInsertTextAt,
  onInsertShapeAt,
  onInsertImageAt,
  onInsertCodeAt,
  onDuplicateElement,
  onDeleteElement,
  onBringToFront,
  onSendToBack,
  onImportFile,
  importing,
  externalScale,
  onZoomChange,
  onAutoZoom,
  panOffset = { x: 0, y: 0 },
  onPanChange,
}: FreeformCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const scale = externalScale ?? autoScale;

  // Auto-zoom: maximize canvas to container
  useEffect(() => {
    if (externalScale != null) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const s = Math.min(width / CANVAS_W, height / CANVAS_H, 2.5);
        const newScale = Math.max(0.3, s);
        setAutoScale(newScale);
        onAutoZoom?.(newScale);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [externalScale, onAutoZoom]);

  // Ctrl+Scroll wheel zoom (normal scroll blocked on canvas to prevent interference with thumbnail scrolling)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (onZoomChange) {
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          const newZoom = Math.min(3, Math.max(0.25, scale + delta));
          onZoomChange(newZoom);
        }
      } else {
        // Block normal scroll on canvas area to prevent it from propagating
        e.preventDefault();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scale, onZoomChange]);

  // Space+drag panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !(e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsPanning(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanning(false);
        panStartRef.current = null;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handlePanPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning || !onPanChange) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
    },
    [isPanning, onPanChange, panOffset]
  );

  const handlePanPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!panStartRef.current || !onPanChange) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      onPanChange({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    },
    [onPanChange]
  );

  const handlePanPointerUp = useCallback(() => {
    panStartRef.current = null;
  }, []);

  const { isDragging, startMove, startResize, startRotate, onPointerMove, onPointerUp } =
    useCanvasDrag({
      elements: slide.elements || [],
      scale,
      onUpdate: onElementUpdate,
    });

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg) {
        onCanvasClick();
      }
      setContextMenu(null);
    },
    [onCanvasClick]
  );

  // Double-click on empty canvas → insert text
  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target !== e.currentTarget &&
        !(e.target as HTMLElement).dataset.canvasBg
      )
        return;
      if (!onInsertTextAt || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      onInsertTextAt(Math.round(x - 200), Math.round(y - 60));
    },
    [onInsertTextAt, scale]
  );

  // Right-click context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) / scale;
      const canvasY = (e.clientY - rect.top) / scale;
      // Check if right-clicked on an element
      const target = e.target as HTMLElement;
      const elNode = target.closest("[data-element-id]");
      const elementId = elNode?.getAttribute("data-element-id") || undefined;
      setContextMenu({
        screenX: e.clientX,
        screenY: e.clientY,
        canvasX: Math.round(canvasX),
        canvasY: Math.round(canvasY),
        elementId,
      });
    },
    [scale]
  );

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handle = () => setContextMenu(null);
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [contextMenu]);

  const elements = slide.elements || [];
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  const bgStyle = theme.bgGradient
    ? { background: theme.bgGradient }
    : { backgroundColor: theme.bgColor };

  // Drag-and-drop file handling
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!onImportFile) return;
      if (e.dataTransfer.types.includes("Files")) {
        e.preventDefault();
        setDragOver(true);
      }
    },
    [onImportFile]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only if leaving the container (not entering a child)
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!onImportFile) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onImportFile(file);
    },
    [onImportFile]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden"
      style={{
        minHeight: 0,
        position: "relative",
        cursor: isPanning ? (panStartRef.current ? "grabbing" : "grab") : undefined,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerDown={isPanning ? handlePanPointerDown : undefined}
      onPointerMove={isPanning ? handlePanPointerMove : undefined}
      onPointerUp={isPanning ? handlePanPointerUp : undefined}
    >
      {/* Drag-over overlay */}
      {dragOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            border: "2px dashed #6366f1",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div className="text-sm font-medium text-indigo-600">
            파일을 놓아서 가져오기
          </div>
        </div>
      )}
      <div
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
          borderRadius: 8 * scale,
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: panStartRef.current ? "none" : "transform 0.15s ease-out",
        }}
      >
        <div
          ref={canvasRef}
          data-canvas-bg="true"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          onContextMenu={handleContextMenu}
          style={{
            ...bgStyle,
            position: "relative",
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            fontFamily: theme.fontFamily,
            cursor: isPanning ? "grab" : isDragging ? "grabbing" : "default",
            pointerEvents: isPanning ? "none" : undefined,
          }}
        >
          {/* Empty slide placeholder */}
          {elements.length === 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  opacity: 0.15,
                  color: theme.bodyColor,
                  pointerEvents: "none",
                }}
              >
                +
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: theme.bodyColor,
                  opacity: 0.3,
                  fontFamily: theme.fontFamily,
                  pointerEvents: "none",
                }}
              >
                도구 모음에서 요소를 추가하거나
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: theme.bodyColor,
                  opacity: 0.25,
                  fontFamily: theme.fontFamily,
                  pointerEvents: "none",
                }}
              >
                더블클릭하여 텍스트 추가 · 우클릭으로 메뉴 열기
              </p>
              {onImportFile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.docx,.html,.htm,.md,.txt,.markdown"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImportFile(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    style={{
                      fontSize: 12,
                      color: theme.bodyColor,
                      opacity: 0.35,
                      fontFamily: theme.fontFamily,
                      background: "none",
                      border: `1px dashed`,
                      borderRadius: 6,
                      padding: "4px 14px",
                      cursor: "pointer",
                      marginTop: 4,
                    }}
                  >
                    {importing ? "가져오는 중..." : "파일에서 가져오기"}
                  </button>
                </>
              )}
            </div>
          )}

          {sorted.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              selected={selectedIds.includes(el.id)}
              editing={editingId === el.id}
              onSelect={(id, additive) => {
                if (additive) {
                  onSelect(
                    selectedIds.includes(id)
                      ? selectedIds.filter((s) => s !== id)
                      : [...selectedIds, id]
                  );
                } else {
                  onSelect([id]);
                }
              }}
              onDoubleClick={onEditStart}
              onStartMove={startMove}
              onStartResize={startResize}
              onStartRotate={startRotate}
              onContentChange={onContentChange}
            />
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

          {/* Multi-select bounding box */}
          {selectedIds.length > 1 && (
            <MultiSelectBox elements={elements} selectedIds={selectedIds} />
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <CanvasContextMenu
          menu={contextMenu}
          hasElement={!!contextMenu.elementId}
          onInsertText={() => {
            onInsertTextAt?.(contextMenu.canvasX - 200, contextMenu.canvasY - 60);
            setContextMenu(null);
          }}
          onInsertShape={(kind) => {
            onInsertShapeAt?.(kind, contextMenu.canvasX - 100, contextMenu.canvasY - 100);
            setContextMenu(null);
          }}
          onInsertImage={() => {
            onInsertImageAt?.(contextMenu.canvasX - 200, contextMenu.canvasY - 150);
            setContextMenu(null);
          }}
          onInsertCode={() => {
            onInsertCodeAt?.(contextMenu.canvasX - 250, contextMenu.canvasY - 150);
            setContextMenu(null);
          }}
          onDuplicate={() => {
            onDuplicateElement?.();
            setContextMenu(null);
          }}
          onDelete={() => {
            onDeleteElement?.();
            setContextMenu(null);
          }}
          onBringToFront={() => {
            onBringToFront?.();
            setContextMenu(null);
          }}
          onSendToBack={() => {
            onSendToBack?.();
            setContextMenu(null);
          }}
          onImport={
            onImportFile
              ? () => {
                  setContextMenu(null);
                  fileInputRef.current?.click();
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

// ── Context Menu ──

function CanvasContextMenu({
  menu,
  hasElement,
  onInsertText,
  onInsertShape,
  onInsertImage,
  onInsertCode,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onImport,
}: {
  menu: ContextMenuState;
  hasElement: boolean;
  onInsertText: () => void;
  onInsertShape: (kind: ShapeKind) => void;
  onInsertImage: () => void;
  onInsertCode: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onImport?: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: menu.screenX,
        top: menu.screenY,
        zIndex: 10000,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-white border border-neutral-200 rounded-lg shadow-xl p-1 min-w-[160px] animate-slide-up">
        {hasElement ? (
          <>
            <CtxItem label="복제" shortcut="Ctrl+D" onClick={onDuplicate} />
            <CtxItem label="삭제" shortcut="Del" onClick={onDelete} danger />
            <div className="h-px bg-neutral-100 my-1" />
            <CtxItem label="맨 앞으로" onClick={onBringToFront} />
            <CtxItem label="맨 뒤로" onClick={onSendToBack} />
          </>
        ) : (
          <>
            <CtxItem label="텍스트 추가" shortcut="T" onClick={onInsertText} />
            <CtxItem label="사각형 추가" onClick={() => onInsertShape("rectangle")} />
            <CtxItem label="원 추가" onClick={() => onInsertShape("circle")} />
            <CtxItem label="이미지 추가" onClick={onInsertImage} />
            <CtxItem label="코드 추가" onClick={onInsertCode} />
            {onImport && (
              <>
                <div className="h-px bg-neutral-100 my-1" />
                <CtxItem label="파일 가져오기" onClick={onImport} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CtxItem({
  label,
  shortcut,
  onClick,
  danger,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] rounded-md transition ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
    >
      <span>{label}</span>
      {shortcut && (
        <span className="text-[10px] text-neutral-400 ml-4">{shortcut}</span>
      )}
    </button>
  );
}

function MultiSelectBox({
  elements,
  selectedIds,
}: {
  elements: SlideElement[];
  selectedIds: string[];
}) {
  const selected = elements.filter((e) => selectedIds.includes(e.id));
  if (selected.length < 2) return null;

  const minX = Math.min(...selected.map((e) => e.x));
  const minY = Math.min(...selected.map((e) => e.y));
  const maxX = Math.max(...selected.map((e) => e.x + e.width));
  const maxY = Math.max(...selected.map((e) => e.y + e.height));

  return (
    <div
      style={{
        position: "absolute",
        left: minX - 2,
        top: minY - 2,
        width: maxX - minX + 4,
        height: maxY - minY + 4,
        border: "1px dashed #6366f1",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
