"use client";

import { useCallback, useRef, useState } from "react";
import type { SlideElement } from "@/types/slide";

export type DragMode = "move" | "resize" | "rotate" | null;
export type ResizeHandle =
  | "nw" | "n" | "ne"
  | "w" | "e"
  | "sw" | "s" | "se";

interface DragState {
  mode: DragMode;
  elementId: string;
  startX: number;
  startY: number;
  startEl: { x: number; y: number; width: number; height: number; rotation: number };
  handle?: ResizeHandle;
}

interface UseCanvasDragOptions {
  elements: SlideElement[];
  scale: number;
  onUpdate: (id: string, changes: Partial<SlideElement>) => void;
}

const MIN_SIZE = 20;
const GRID = 10;
const snap = (v: number) => Math.round(v / GRID) * GRID;

export function useCanvasDrag({ elements, scale, onUpdate }: UseCanvasDragOptions) {
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startMove = useCallback(
    (e: React.PointerEvent, elementId: string) => {
      const el = elements.find((el) => el.id === elementId);
      if (!el || el.locked) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        mode: "move",
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        startEl: { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation },
      };
      setIsDragging(true);
    },
    [elements]
  );

  const startResize = useCallback(
    (e: React.PointerEvent, elementId: string, handle: ResizeHandle) => {
      const el = elements.find((el) => el.id === elementId);
      if (!el || el.locked) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        mode: "resize",
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        startEl: { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation },
        handle,
      };
      setIsDragging(true);
    },
    [elements]
  );

  const startRotate = useCallback(
    (e: React.PointerEvent, elementId: string, centerX: number, centerY: number) => {
      const el = elements.find((el) => el.id === elementId);
      if (!el || el.locked) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        mode: "rotate",
        elementId,
        startX: centerX,
        startY: centerY,
        startEl: { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation },
      };
      setIsDragging(true);
    },
    [elements]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;

      const dx = (e.clientX - d.startX) / scale;
      const dy = (e.clientY - d.startY) / scale;

      if (d.mode === "move") {
        onUpdate(d.elementId, {
          x: snap(d.startEl.x + dx),
          y: snap(d.startEl.y + dy),
        });
      } else if (d.mode === "resize" && d.handle) {
        const h = d.handle;
        let { x, y, width, height } = d.startEl;

        if (h.includes("e")) width = Math.max(MIN_SIZE, width + dx);
        if (h.includes("w")) {
          const newW = Math.max(MIN_SIZE, width - dx);
          x = x + (width - newW);
          width = newW;
        }
        if (h.includes("s")) height = Math.max(MIN_SIZE, height + dy);
        if (h.includes("n")) {
          const newH = Math.max(MIN_SIZE, height - dy);
          y = y + (height - newH);
          height = newH;
        }

        // Shift to maintain aspect ratio
        if (e.shiftKey) {
          const aspect = d.startEl.width / d.startEl.height;
          if (h === "e" || h === "w") {
            height = width / aspect;
          } else if (h === "n" || h === "s") {
            width = height * aspect;
          } else {
            height = width / aspect;
          }
        }

        onUpdate(d.elementId, {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        });
      } else if (d.mode === "rotate") {
        const angle = Math.atan2(
          e.clientY - d.startY,
          e.clientX - d.startX
        );
        let deg = (angle * 180) / Math.PI + 90;
        // Snap to 15-degree increments when shift is held
        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
        }
        onUpdate(d.elementId, { rotation: Math.round(deg) });
      }
    },
    [scale, onUpdate]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    startMove,
    startResize,
    startRotate,
    onPointerMove,
    onPointerUp,
  };
}
