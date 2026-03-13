import { v4 as uuidv4 } from "uuid";
import type {
  SlideElement,
  SlideElementType,
  ShapeKind,
  ElementTextContent,
  ElementShapeContent,
  ElementImageContent,
  ElementCodeContent,
  ElementStyle,
  Slide,
  PresentationTheme,
  TextRole,
} from "@/types/slide";
import { getLayout } from "./slide-utils";

// ── Element factories ──

export function createTextElement(
  overrides?: Partial<SlideElement> & { text?: string; textRole?: TextRole }
): SlideElement {
  const content: ElementTextContent = {
    text: overrides?.text || "텍스트를 입력하세요",
    fontSize: 24,
    fontWeight: "normal",
    textAlign: "left",
    verticalAlign: "top",
    color: "#171717",
    lineHeight: 1.5,
    textRole: overrides?.textRole || "body",
  };
  return {
    id: uuidv4(),
    type: "text",
    x: 100,
    y: 200,
    width: 400,
    height: 120,
    rotation: 0,
    zIndex: getNextZIndex(overrides?.zIndex),
    style: {},
    ...overrides,
    content,
  };
}

export function createShapeElement(
  shapeKind: ShapeKind = "rectangle",
  overrides?: Partial<SlideElement>
): SlideElement {
  const content: ElementShapeContent = {
    shapeKind,
  };
  const style: ElementStyle = {
    fill: "#e5e7eb",
    stroke: "#9ca3af",
    strokeWidth: 2,
    borderRadius: shapeKind === "rounded-rect" ? 12 : 0,
  };
  return {
    id: uuidv4(),
    type: "shape",
    x: 200,
    y: 150,
    width: shapeKind === "line" ? 300 : 200,
    height: shapeKind === "line" ? 4 : 200,
    rotation: 0,
    zIndex: getNextZIndex(overrides?.zIndex),
    style,
    content,
    ...overrides,
  };
}

export function createImageElement(
  imageUrl = "",
  overrides?: Partial<SlideElement>
): SlideElement {
  const content: ElementImageContent = {
    imageUrl,
    objectFit: "contain",
  };
  return {
    id: uuidv4(),
    type: "image",
    x: 250,
    y: 120,
    width: 400,
    height: 300,
    rotation: 0,
    zIndex: getNextZIndex(overrides?.zIndex),
    style: {},
    content,
    ...overrides,
  };
}

export function createCodeElement(
  overrides?: Partial<SlideElement>
): SlideElement {
  const content: ElementCodeContent = {
    code: "",
    language: "javascript",
  };
  return {
    id: uuidv4(),
    type: "code",
    x: 100,
    y: 100,
    width: 500,
    height: 300,
    rotation: 0,
    zIndex: getNextZIndex(overrides?.zIndex),
    style: {
      fill: "#1e1e2e",
      borderRadius: 8,
    },
    content,
    ...overrides,
  };
}

function getNextZIndex(override?: number): number {
  return override ?? 1;
}

export function getMaxZIndex(elements: SlideElement[]): number {
  if (elements.length === 0) return 0;
  return Math.max(...elements.map((e) => e.zIndex));
}

// ── Slot → Element migration ──

export function slotsToElements(
  slide: Slide,
  theme: PresentationTheme
): SlideElement[] {
  const layout = getLayout(slide.layoutId);
  const elements: SlideElement[] = [];
  let zIndex = 1;

  // Map grid areas to approximate positions
  const positions = computeSlotPositions(layout.gridAreas, layout.gridTemplate);

  for (const slotDef of layout.slots) {
    const content = slide.slots[slotDef.id];
    if (!content) continue;

    const pos = positions[slotDef.gridArea] || { x: 48, y: 48, w: 864, h: 444 };

    if (slotDef.type === "title" || slotDef.type === "subtitle" || slotDef.type === "body") {
      if (!content.text) continue;
      const isTitle = slotDef.type === "title";
      const roleMap: Record<string, TextRole> = {
        title: "title",
        subtitle: "subtitle",
        body: "body",
      };
      const textContent: ElementTextContent = {
        text: content.text,
        fontSize: content.fontSize || (isTitle ? 36 : slotDef.type === "subtitle" ? 20 : 18),
        fontWeight: content.fontWeight || (isTitle ? "bold" : "normal"),
        fontStyle: content.fontStyle,
        textDecoration: content.textDecoration,
        textAlign: content.textAlign || (isTitle ? "left" : "left"),
        verticalAlign: isTitle ? "middle" : "top",
        color: content.textColor || (isTitle ? theme.titleColor : theme.bodyColor),
        lineHeight: isTitle ? 1.2 : 1.6,
        textRole: roleMap[slotDef.type] || "body",
      };
      elements.push({
        id: uuidv4(),
        type: "text",
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        rotation: 0,
        zIndex: zIndex++,
        style: {},
        content: textContent,
      });
    } else if (slotDef.type === "image" && content.imageUrl) {
      elements.push({
        id: uuidv4(),
        type: "image",
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        rotation: 0,
        zIndex: zIndex++,
        style: {},
        content: {
          imageUrl: content.imageUrl,
          imageAlt: content.imageAlt,
          objectFit: "contain",
        } as ElementImageContent,
      });
    } else if (slotDef.type === "code" && content.code) {
      elements.push({
        id: uuidv4(),
        type: "code",
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        rotation: 0,
        zIndex: zIndex++,
        style: { fill: theme.codeBg, borderRadius: 8 },
        content: {
          code: content.code,
          language: content.language || "javascript",
        } as ElementCodeContent,
      });
    }
  }

  return elements;
}

function computeSlotPositions(
  gridAreas: string,
  gridTemplate: string
): Record<string, { x: number; y: number; w: number; h: number }> {
  const PAD = 48;
  const GAP = 24;
  const W = 960 - PAD * 2;
  const H = 540 - PAD * 2;

  // Parse rows from grid template
  const rows = gridTemplate.split(/\s+/).filter(Boolean);
  const rowCount = rows.length;

  // Parse area names from gridAreas
  const areaRows = gridAreas
    .split('"')
    .filter((s) => s.trim() && !s.match(/^\s*$/));
  const colCount = areaRows[0]?.trim().split(/\s+/).length || 1;

  // Build bounding boxes for each named area
  const areaMap: Record<string, { r1: number; c1: number; r2: number; c2: number }> = {};
  areaRows.forEach((row, ri) => {
    const cols = row.trim().split(/\s+/);
    cols.forEach((name, ci) => {
      if (name === ".") return;
      if (!areaMap[name]) {
        areaMap[name] = { r1: ri, c1: ci, r2: ri, c2: ci };
      } else {
        areaMap[name].r2 = Math.max(areaMap[name].r2, ri);
        areaMap[name].c2 = Math.max(areaMap[name].c2, ci);
      }
    });
  });

  const cellW = (W - GAP * (colCount - 1)) / colCount;
  const cellH = (H - GAP * (rowCount - 1)) / rowCount;

  const result: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const [name, box] of Object.entries(areaMap)) {
    result[name] = {
      x: PAD + box.c1 * (cellW + GAP),
      y: PAD + box.r1 * (cellH + GAP),
      w: (box.c2 - box.c1 + 1) * cellW + (box.c2 - box.c1) * GAP,
      h: (box.r2 - box.r1 + 1) * cellH + (box.r2 - box.r1) * GAP,
    };
  }

  return result;
}

// ── Alignment helpers ──

export type AlignAction =
  | "align-left"
  | "align-center-h"
  | "align-right"
  | "align-top"
  | "align-center-v"
  | "align-bottom"
  | "distribute-h"
  | "distribute-v";

export function alignElements(
  elements: SlideElement[],
  selectedIds: string[],
  action: AlignAction
): SlideElement[] {
  const selected = elements.filter((e) => selectedIds.includes(e.id));
  if (selected.length < 2) return elements;

  const bounds = {
    minX: Math.min(...selected.map((e) => e.x)),
    maxX: Math.max(...selected.map((e) => e.x + e.width)),
    minY: Math.min(...selected.map((e) => e.y)),
    maxY: Math.max(...selected.map((e) => e.y + e.height)),
  };

  const updates = new Map<string, Partial<SlideElement>>();

  switch (action) {
    case "align-left":
      selected.forEach((e) => updates.set(e.id, { x: bounds.minX }));
      break;
    case "align-center-h": {
      const centerX = (bounds.minX + bounds.maxX) / 2;
      selected.forEach((e) => updates.set(e.id, { x: centerX - e.width / 2 }));
      break;
    }
    case "align-right":
      selected.forEach((e) => updates.set(e.id, { x: bounds.maxX - e.width }));
      break;
    case "align-top":
      selected.forEach((e) => updates.set(e.id, { y: bounds.minY }));
      break;
    case "align-center-v": {
      const centerY = (bounds.minY + bounds.maxY) / 2;
      selected.forEach((e) => updates.set(e.id, { y: centerY - e.height / 2 }));
      break;
    }
    case "align-bottom":
      selected.forEach((e) => updates.set(e.id, { y: bounds.maxY - e.height }));
      break;
    case "distribute-h": {
      const sorted = [...selected].sort((a, b) => a.x - b.x);
      const totalW = sorted.reduce((s, e) => s + e.width, 0);
      const space = (bounds.maxX - bounds.minX - totalW) / (sorted.length - 1);
      let cx = bounds.minX;
      sorted.forEach((e) => {
        updates.set(e.id, { x: cx });
        cx += e.width + space;
      });
      break;
    }
    case "distribute-v": {
      const sorted = [...selected].sort((a, b) => a.y - b.y);
      const totalH = sorted.reduce((s, e) => s + e.height, 0);
      const space = (bounds.maxY - bounds.minY - totalH) / (sorted.length - 1);
      let cy = bounds.minY;
      sorted.forEach((e) => {
        updates.set(e.id, { y: cy });
        cy += e.height + space;
      });
      break;
    }
  }

  return elements.map((e) => {
    const upd = updates.get(e.id);
    return upd ? { ...e, ...upd } : e;
  });
}

// ── Z-order helpers ──

export function bringToFront(elements: SlideElement[], id: string): SlideElement[] {
  const max = getMaxZIndex(elements);
  return elements.map((e) => (e.id === id ? { ...e, zIndex: max + 1 } : e));
}

export function sendToBack(elements: SlideElement[], id: string): SlideElement[] {
  const min = Math.min(...elements.map((e) => e.zIndex));
  return elements.map((e) => (e.id === id ? { ...e, zIndex: min - 1 } : e));
}

export function bringForward(elements: SlideElement[], id: string): SlideElement[] {
  const el = elements.find((e) => e.id === id);
  if (!el) return elements;
  const above = elements
    .filter((e) => e.id !== id && e.zIndex > el.zIndex)
    .sort((a, b) => a.zIndex - b.zIndex);
  if (above.length === 0) return elements;
  const swapTarget = above[0];
  return elements.map((e) => {
    if (e.id === id) return { ...e, zIndex: swapTarget.zIndex };
    if (e.id === swapTarget.id) return { ...e, zIndex: el.zIndex };
    return e;
  });
}

export function sendBackward(elements: SlideElement[], id: string): SlideElement[] {
  const el = elements.find((e) => e.id === id);
  if (!el) return elements;
  const below = elements
    .filter((e) => e.id !== id && e.zIndex < el.zIndex)
    .sort((a, b) => b.zIndex - a.zIndex);
  if (below.length === 0) return elements;
  const swapTarget = below[0];
  return elements.map((e) => {
    if (e.id === id) return { ...e, zIndex: swapTarget.zIndex };
    if (e.id === swapTarget.id) return { ...e, zIndex: el.zIndex };
    return e;
  });
}

// ── TextRole inference ──

const CANVAS_W = 960;
const CANVAS_H = 540;

/**
 * 텍스트 요소의 역할을 복합적으로 추론
 * - PPTX placeholder 정보가 없을 때 사용하는 fallback
 * - 위치, 크기, 폰트 속성, 텍스트 내용을 종합 분석
 */
export function inferTextRole(element: SlideElement): TextRole {
  if (element.type !== "text") return "other";
  const content = element.content as ElementTextContent;

  // If textRole is already explicitly set, return it
  if (content.textRole) return content.textRole;

  const { fontSize, fontWeight, text } = content;
  const { x, y, width, height } = element;

  // ── Page number detection ──
  // Small text, short content, near edges (especially bottom)
  const isSmallFont = fontSize <= 14;
  const isShortText = text.trim().length <= 5;
  const isNumericish = /^\s*\d{1,4}\s*$/.test(text) || /^\s*[-–—]\s*\d{1,4}\s*[-–—]\s*$/.test(text);
  const isBottomEdge = y + height > CANVAS_H - 60;
  const isTopEdge = y < 40;
  const isCorner = (x < 80 || x + width > CANVAS_W - 80) && (isBottomEdge || isTopEdge);

  if (isNumericish && isSmallFont) return "pageNumber";
  if (isShortText && isSmallFont && isCorner) return "pageNumber";

  // ── Title detection ──
  // Large font, wide element, near top of slide
  const isLargeFont = fontSize >= 28;
  const isWide = width > CANVAS_W * 0.5;
  const isUpperArea = y < CANVAS_H * 0.35;
  const isBold = fontWeight === "bold";

  if (isLargeFont && isWide && isUpperArea) return "title";
  if (fontSize >= 32) return "title";
  if (isLargeFont && isBold) return "title";

  // ── Subtitle detection ──
  // Medium-large font, bold or upper area, below title zone
  const isMidUpperArea = y < CANVAS_H * 0.45;
  const isMediumFont = fontSize >= 18;

  if (isMediumFont && isBold && isMidUpperArea && isWide) return "subtitle";
  if (fontSize >= 22 && isBold) return "subtitle";
  if (isMediumFont && isUpperArea && !isBold && isWide && fontSize >= 20) return "subtitle";

  // ── Footer/other detection ──
  if (isSmallFont && isBottomEdge) return "other";

  // ── Default to body ──
  return "body";
}

/**
 * ElementTextContent만으로 간단히 역할을 추론 (element 정보 없을 때)
 */
export function inferTextRoleFromContent(content: ElementTextContent): TextRole {
  if (content.textRole) return content.textRole;
  if (content.fontSize >= 32) return "title";
  if (content.fontSize >= 22 && content.fontWeight === "bold") return "subtitle";
  if (content.fontSize <= 14 && (content.text?.trim().length || 0) <= 5) return "pageNumber";
  if (content.fontSize >= 28) return "title";
  return "body";
}
