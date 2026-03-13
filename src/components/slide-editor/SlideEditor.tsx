"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Slide,
  SlotContent,
  PresentationTheme,
  Presentation,
  SlideElement,
  ElementContent,
  ElementTextContent,
  ShapeKind,
  TextRole,
} from "@/types/slide";
import { createSlide } from "@/lib/slide-utils";
import {
  createTextElement,
  createShapeElement,
  createImageElement,
  createCodeElement,
  getMaxZIndex,
  slotsToElements,
  alignElements,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  inferTextRole,
} from "@/lib/slide-element-utils";
import type { AlignAction } from "@/lib/slide-element-utils";
import { SlideCanvas } from "./SlideCanvas";
import { SlideThumbnails } from "./SlideThumbnails";
import { ThemePicker } from "./ThemePicker";
import { SlidePresenter } from "./SlidePresenter";
import { TemplatePicker } from "./TemplatePicker";
import { FreeformCanvas } from "./FreeformCanvas";
import { ElementToolbar } from "./ElementToolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";
import { FontSettingsPanel } from "./FontSettingsPanel";
import type { RoleFontSettings } from "./FontSettingsPanel";

interface SlideEditorProps {
  presentation: Presentation;
  onChange: (presentation: Presentation) => void;
  onImportFile?: (file: File) => void;
  importing?: boolean;
}

export function SlideEditor({ presentation, onChange, onImportFile, importing }: SlideEditorProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Freeform element selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Legacy slot selection
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  // UI state
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [thumbnailsCollapsed, setThumbnailsCollapsed] = useState(false);
  const copiedSlideRef = useRef<Slide | null>(null);
  // Zoom & pan state
  const [zoomLevel, setZoomLevel] = useState<number | null>(null); // null = auto-fit
  const [autoZoomLevel, setAutoZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const currentZoom = zoomLevel ?? autoZoomLevel;

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(Math.min(3, Math.max(0.25, zoom)));
  }, []);

  const handleZoomFit = useCallback(() => {
    setZoomLevel(null);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const themeRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const fontSettingsRef = useRef<HTMLDivElement>(null);

  const slides = presentation.slides;
  const theme = presentation.theme;
  const activeSlide = slides[activeIndex] || slides[0];
  // Freeform mode: true when slide has elements array (even if empty — new default)
  const isFreeform = !!(activeSlide?.elements);

  // Close pickers on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node))
        setShowThemePicker(false);
      if (templateRef.current && !templateRef.current.contains(e.target as Node))
        setShowTemplatePicker(false);
      if (fontSettingsRef.current && !fontSettingsRef.current.contains(e.target as Node))
        setShowFontSettings(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── State updaters ──

  const updateSlides = useCallback(
    (newSlides: Slide[]) => {
      onChange({ ...presentation, slides: newSlides });
    },
    [presentation, onChange]
  );

  const updateTheme = useCallback(
    (newTheme: PresentationTheme) => {
      onChange({ ...presentation, theme: newTheme });
    },
    [presentation, onChange]
  );

  const updateActiveSlideElements = useCallback(
    (newElements: SlideElement[]) => {
      const newSlides = slides.map((s, i) =>
        i === activeIndex ? { ...s, elements: newElements } : s
      );
      updateSlides(newSlides);
    },
    [slides, activeIndex, updateSlides]
  );

  const handleSlotChange = useCallback(
    (slotId: string, content: SlotContent) => {
      const newSlides = slides.map((s, i) =>
        i === activeIndex ? { ...s, slots: { ...s.slots, [slotId]: content } } : s
      );
      updateSlides(newSlides);
    },
    [slides, activeIndex, updateSlides]
  );

  const handleSlideChange = useCallback(
    (updatedSlide: Slide) => {
      const newSlides = slides.map((s, i) =>
        i === activeIndex ? updatedSlide : s
      );
      updateSlides(newSlides);
    },
    [slides, activeIndex, updateSlides]
  );

  // ── Slide operations ──

  const handleAddSlide = useCallback(() => {
    // New slides start in freeform mode with empty elements
    const newSlide: Slide = {
      id: uuidv4(),
      layoutId: "blank",
      slots: {},
      order: slides.length,
      elements: [],
    };
    const newSlides = [...slides, newSlide];
    updateSlides(newSlides);
    setActiveIndex(newSlides.length - 1);
    setSelectedIds([]);
    setEditingId(null);
  }, [slides, updateSlides]);

  const handleDeleteSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) return;
      const newSlides = slides.filter((_, i) => i !== index);
      newSlides.forEach((s, i) => (s.order = i));
      updateSlides(newSlides);
      if (activeIndex >= newSlides.length) {
        setActiveIndex(newSlides.length - 1);
      }
      setSelectedIds([]);
      setEditingId(null);
    },
    [slides, activeIndex, updateSlides]
  );

  const handleDuplicateSlide = useCallback(
    (index: number) => {
      const original = slides[index];
      const duplicate: Slide = {
        ...original,
        id: uuidv4(),
        order: index + 1,
        slots: { ...original.slots },
        elements: original.elements?.map((e) => ({ ...e, id: uuidv4() })),
      };
      const newSlides = [...slides];
      newSlides.splice(index + 1, 0, duplicate);
      newSlides.forEach((s, i) => (s.order = i));
      updateSlides(newSlides);
      setActiveIndex(index + 1);
    },
    [slides, updateSlides]
  );

  const handleReorder = useCallback(
    (from: number, to: number) => {
      const newSlides = [...slides];
      const [moved] = newSlides.splice(from, 1);
      newSlides.splice(to, 0, moved);
      newSlides.forEach((s, i) => (s.order = i));
      updateSlides(newSlides);
      setActiveIndex(to);
    },
    [slides, updateSlides]
  );

  // ── Element operations ──

  // Stacking offset based on existing element count
  const stackOffset = useCallback(
    (baseX: number, baseY: number) => {
      const count = (activeSlide?.elements || []).length;
      return { x: baseX + (count % 8) * 15, y: baseY + (count % 8) * 15 };
    },
    [activeSlide]
  );

  const handleInsertText = useCallback(() => {
    if (!activeSlide) return;
    const elements = activeSlide.elements || [];
    const pos = stackOffset(280, 210);
    const el = createTextElement({
      zIndex: getMaxZIndex(elements) + 1,
      ...pos,
    });
    updateActiveSlideElements([...elements, el]);
    setSelectedIds([el.id]);
    setEditingId(el.id); // Auto-edit for immediate typing
  }, [activeSlide, updateActiveSlideElements, stackOffset]);

  const handleInsertTextAt = useCallback(
    (x: number, y: number) => {
      if (!activeSlide) return;
      const elements = activeSlide.elements || [];
      const el = createTextElement({
        zIndex: getMaxZIndex(elements) + 1,
        x: Math.max(0, x),
        y: Math.max(0, y),
      });
      updateActiveSlideElements([...elements, el]);
      setSelectedIds([el.id]);
      setEditingId(el.id);
    },
    [activeSlide, updateActiveSlideElements]
  );

  const handleInsertShape = useCallback(
    (kind: ShapeKind) => {
      if (!activeSlide) return;
      const elements = activeSlide.elements || [];
      const pos = stackOffset(380, 170);
      const el = createShapeElement(kind, {
        zIndex: getMaxZIndex(elements) + 1,
        ...pos,
      });
      updateActiveSlideElements([...elements, el]);
      setSelectedIds([el.id]);
    },
    [activeSlide, updateActiveSlideElements, stackOffset]
  );

  const handleInsertShapeAt = useCallback(
    (kind: ShapeKind, x: number, y: number) => {
      if (!activeSlide) return;
      const elements = activeSlide.elements || [];
      const el = createShapeElement(kind, {
        zIndex: getMaxZIndex(elements) + 1,
        x: Math.max(0, x),
        y: Math.max(0, y),
      });
      updateActiveSlideElements([...elements, el]);
      setSelectedIds([el.id]);
    },
    [activeSlide, updateActiveSlideElements]
  );

  const handleInsertImage = useCallback(() => {
    if (!activeSlide) return;
    const elements = activeSlide.elements || [];
    const pos = stackOffset(280, 120);
    const el = createImageElement("", {
      zIndex: getMaxZIndex(elements) + 1,
      ...pos,
    });
    updateActiveSlideElements([...elements, el]);
    setSelectedIds([el.id]);
    setEditingId(el.id);
  }, [activeSlide, updateActiveSlideElements, stackOffset]);

  const handleInsertImageAt = useCallback(
    (x: number, y: number) => {
      if (!activeSlide) return;
      const elements = activeSlide.elements || [];
      const el = createImageElement("", {
        zIndex: getMaxZIndex(elements) + 1,
        x: Math.max(0, x),
        y: Math.max(0, y),
      });
      updateActiveSlideElements([...elements, el]);
      setSelectedIds([el.id]);
      setEditingId(el.id);
    },
    [activeSlide, updateActiveSlideElements]
  );

  const handleInsertCode = useCallback(() => {
    if (!activeSlide) return;
    const elements = activeSlide.elements || [];
    const pos = stackOffset(230, 120);
    const el = createCodeElement({
      zIndex: getMaxZIndex(elements) + 1,
      ...pos,
    });
    updateActiveSlideElements([...elements, el]);
    setSelectedIds([el.id]);
    setEditingId(el.id);
  }, [activeSlide, updateActiveSlideElements, stackOffset]);

  const handleInsertCodeAt = useCallback(
    (x: number, y: number) => {
      if (!activeSlide) return;
      const elements = activeSlide.elements || [];
      const el = createCodeElement({
        zIndex: getMaxZIndex(elements) + 1,
        x: Math.max(0, x),
        y: Math.max(0, y),
      });
      updateActiveSlideElements([...elements, el]);
      setSelectedIds([el.id]);
      setEditingId(el.id);
    },
    [activeSlide, updateActiveSlideElements]
  );

  const handleElementUpdate = useCallback(
    (id: string, changes: Partial<SlideElement>) => {
      const elements = activeSlide?.elements || [];
      const updated = elements.map((e) =>
        e.id === id ? { ...e, ...changes } : e
      );
      updateActiveSlideElements(updated);
    },
    [activeSlide, updateActiveSlideElements]
  );

  const handleContentChange = useCallback(
    (id: string, content: ElementContent) => {
      const elements = activeSlide?.elements || [];
      const updated = elements.map((e) =>
        e.id === id ? { ...e, content } : e
      );
      updateActiveSlideElements(updated);
    },
    [activeSlide, updateActiveSlideElements]
  );

  const handleDeleteElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    const elements = activeSlide?.elements || [];
    updateActiveSlideElements(elements.filter((e) => !selectedIds.includes(e.id)));
    setSelectedIds([]);
    setEditingId(null);
  }, [selectedIds, activeSlide, updateActiveSlideElements]);

  const handleDuplicateElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    const elements = activeSlide?.elements || [];
    const maxZ = getMaxZIndex(elements);
    const copies = elements
      .filter((e) => selectedIds.includes(e.id))
      .map((e, i) => ({
        ...e,
        id: uuidv4(),
        x: e.x + 20,
        y: e.y + 20,
        zIndex: maxZ + i + 1,
      }));
    updateActiveSlideElements([...elements, ...copies]);
    setSelectedIds(copies.map((c) => c.id));
  }, [selectedIds, activeSlide, updateActiveSlideElements]);

  const handleLockToggle = useCallback(() => {
    if (selectedIds.length === 0) return;
    const elements = activeSlide?.elements || [];
    const firstSelected = elements.find((e) => selectedIds.includes(e.id));
    const newLocked = !firstSelected?.locked;
    const updated = elements.map((e) =>
      selectedIds.includes(e.id) ? { ...e, locked: newLocked } : e
    );
    updateActiveSlideElements(updated);
  }, [selectedIds, activeSlide, updateActiveSlideElements]);

  const handleAlign = useCallback(
    (action: AlignAction) => {
      const elements = activeSlide?.elements || [];
      updateActiveSlideElements(alignElements(elements, selectedIds, action));
    },
    [selectedIds, activeSlide, updateActiveSlideElements]
  );

  // ── Canvas click ──
  const handleCanvasClick = useCallback(() => {
    setSelectedIds([]);
    setEditingId(null);
    setActiveSlot(null);
    setEditingSlot(null);
  }, []);

  // ── Keyboard shortcuts ──

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (presenting) return;
      const isInput =
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement;

      // Zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        const PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
        const next = PRESETS.find((p) => p > currentZoom + 0.01);
        handleZoomChange(next ?? 3);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        const PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
        const prev = [...PRESETS].reverse().find((p) => p < currentZoom - 0.01);
        handleZoomChange(prev ?? 0.25);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        handleZoomFit();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (isFreeform && selectedIds.length > 0) {
          handleDuplicateElements();
        } else {
          handleDuplicateSlide(activeIndex);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "c" && !isInput && !isFreeform) {
        copiedSlideRef.current = activeSlide;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "v" && !isInput && !isFreeform) {
        if (copiedSlideRef.current) {
          const paste: Slide = {
            ...copiedSlideRef.current,
            id: uuidv4(),
            order: activeIndex + 1,
            slots: { ...copiedSlideRef.current.slots },
          };
          const newSlides = [...slides];
          newSlides.splice(activeIndex + 1, 0, paste);
          newSlides.forEach((s, i) => (s.order = i));
          updateSlides(newSlides);
          setActiveIndex(activeIndex + 1);
        }
      }

      if (isInput) return;

      if (e.key === "ArrowUp" && !isFreeform && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
        setSelectedIds([]);
        setEditingId(null);
      }
      if (e.key === "ArrowDown" && !isFreeform && activeIndex < slides.length - 1) {
        setActiveIndex(activeIndex + 1);
        setSelectedIds([]);
        setEditingId(null);
      }
      if (e.key === "Escape") {
        if (editingId) {
          setEditingId(null);
        } else if (selectedIds.length > 0) {
          setSelectedIds([]);
        } else if (editingSlot) {
          setEditingSlot(null);
        } else {
          setActiveSlot(null);
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (isFreeform && selectedIds.length > 0 && !editingId) {
          handleDeleteElements();
        } else if (!activeSlot && !isFreeform && slides.length > 1) {
          handleDeleteSlide(activeIndex);
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [
    activeIndex, slides, presenting, activeSlot, editingSlot,
    activeSlide, selectedIds, editingId, isFreeform,
    handleDuplicateSlide, handleDeleteSlide, handleDeleteElements,
    handleDuplicateElements, updateSlides, currentZoom, handleZoomChange, handleZoomFit,
  ]);

  // ── Notes ──

  const handleNotesChange = useCallback(
    (notes: string) => {
      const newSlides = slides.map((s, i) =>
        i === activeIndex ? { ...s, notes } : s
      );
      updateSlides(newSlides);
    },
    [slides, activeIndex, updateSlides]
  );

  // ── Batch font change by role ──
  const handleBatchFontChange = useCallback(
    (role: TextRole | "all", fontFamily: string) => {
      const newSlides = slides.map((slide) => {
        if (!slide.elements) return slide;
        const newElements = slide.elements.map((el) => {
          if (el.type !== "text") return el;
          const elRole = inferTextRole(el);

          if (role === "all" || elRole === role) {
            return {
              ...el,
              content: { ...el.content, fontFamily },
            };
          }
          return el;
        });
        return { ...slide, elements: newElements };
      });
      updateSlides(newSlides);
    },
    [slides, updateSlides]
  );

  // Detect current fonts by role across all slides
  const currentRoleFonts: RoleFontSettings = (() => {
    const roleFonts: Record<string, string | undefined> = {};
    for (const slide of slides) {
      for (const el of slide.elements || []) {
        if (el.type !== "text") continue;
        const content = el.content as ElementTextContent;
        const role = inferTextRole(el);
        if (content.fontFamily && !roleFonts[role]) {
          roleFonts[role] = content.fontFamily;
        }
      }
    }
    return roleFonts;
  })();

  // ── Selected elements for toolbar ──
  const selectedElements = (activeSlide?.elements || []).filter((e) =>
    selectedIds.includes(e.id)
  );

  // ── Presentation ──

  if (presenting) {
    return (
      <SlidePresenter
        slides={slides}
        theme={theme}
        startIndex={activeIndex}
        onClose={() => setPresenting(false)}
      />
    );
  }

  const triggerImport = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  return (
    <div className="flex h-full">
      {/* Hidden file input for import */}
      {onImportFile && (
        <input
          ref={importInputRef}
          type="file"
          accept=".pdf,.pptx,.docx,.html,.htm,.md,.txt,.markdown"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportFile(file);
            e.target.value = "";
          }}
        />
      )}

      {/* Thumbnails sidebar — collapsible */}
      <div
        className={`flex-shrink-0 transition-all duration-200 border-r border-neutral-200 bg-neutral-50 ${
          thumbnailsCollapsed ? "w-10" : "w-44"
        }`}
      >
        {thumbnailsCollapsed ? (
          <div className="h-full flex flex-col items-center pt-2">
            <button
              onClick={() => setThumbnailsCollapsed(false)}
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition text-xs"
              title="썸네일 펼치기"
            >
              ▶
            </button>
            <span className="text-[9px] text-neutral-400 mt-2 writing-mode-vertical">
              {activeIndex + 1}/{slides.length}
            </span>
          </div>
        ) : (
          <div className="h-full flex flex-col p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-neutral-500">슬라이드</span>
              <button
                onClick={() => setThumbnailsCollapsed(true)}
                className="w-5 h-5 flex items-center justify-center text-neutral-300 hover:text-neutral-500 rounded transition text-[9px]"
                title="썸네일 접기"
              >
                ◀
              </button>
            </div>
            <SlideThumbnails
              slides={slides}
              activeIndex={activeIndex}
              theme={theme}
              onSelect={(i) => {
                setActiveIndex(i);
                setSelectedIds([]);
                setEditingId(null);
                setActiveSlot(null);
                setEditingSlot(null);
                setPanOffset({ x: 0, y: 0 });
              }}
              onAdd={handleAddSlide}
              onDelete={handleDeleteSlide}
              onDuplicate={handleDuplicateSlide}
              onReorder={handleReorder}
            />
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1 bg-white border-b border-neutral-200 flex-wrap min-h-[38px]">
          {/* Element toolbar */}
          {isFreeform && (
            <ElementToolbar
              onInsertText={handleInsertText}
              onInsertShape={handleInsertShape}
              onInsertImage={handleInsertImage}
              onInsertCode={handleInsertCode}
              onImport={onImportFile ? triggerImport : undefined}
              importing={importing}
              selectedElements={selectedElements}
              onAlign={handleAlign}
              onBringToFront={() => {
                if (!selectedIds[0]) return;
                updateActiveSlideElements(bringToFront(activeSlide?.elements || [], selectedIds[0]));
              }}
              onSendToBack={() => {
                if (!selectedIds[0]) return;
                updateActiveSlideElements(sendToBack(activeSlide?.elements || [], selectedIds[0]));
              }}
              onBringForward={() => {
                if (!selectedIds[0]) return;
                updateActiveSlideElements(bringForward(activeSlide?.elements || [], selectedIds[0]));
              }}
              onSendBackward={() => {
                if (!selectedIds[0]) return;
                updateActiveSlideElements(sendBackward(activeSlide?.elements || [], selectedIds[0]));
              }}
              onDelete={handleDeleteElements}
              onDuplicate={handleDuplicateElements}
              onLock={handleLockToggle}
              onStyleChange={(id, changes) => handleElementUpdate(id, changes)}
            />
          )}

          <div className="flex-1" />

          {/* Theme picker */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => {
                setShowThemePicker(!showThemePicker);
                setShowTemplatePicker(false);
                setShowFontSettings(false);
              }}
              className="px-2 py-1 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 rounded-md transition flex items-center gap-1"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-neutral-200"
                style={{ backgroundColor: theme.accentColor }}
              />
              테마
            </button>
            {showThemePicker && (
              <ThemePicker
                currentTheme={theme}
                onSelect={updateTheme}
                onClose={() => setShowThemePicker(false)}
              />
            )}
          </div>

          {/* Template picker */}
          <div className="relative" ref={templateRef}>
            <button
              onClick={() => {
                setShowTemplatePicker(!showTemplatePicker);
                setShowThemePicker(false);
                setShowFontSettings(false);
              }}
              className="px-2 py-1 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 rounded-md transition"
            >
              템플릿
            </button>
            {showTemplatePicker && (
              <TemplatePicker
                onApply={(p) => {
                  // Auto-convert template slides to freeform
                  const converted: Presentation = {
                    ...p,
                    slides: p.slides.map((s) => {
                      if (s.elements && s.elements.length > 0) return s;
                      const hasContent = Object.values(s.slots).some(
                        (c) => c.text || c.imageUrl || c.code || c.question
                      );
                      return {
                        ...s,
                        elements: hasContent ? slotsToElements(s, p.theme) : [],
                      };
                    }),
                  };
                  onChange(converted);
                  setActiveIndex(0);
                  setSelectedIds([]);
                  setEditingId(null);
                }}
                onClose={() => setShowTemplatePicker(false)}
              />
            )}
          </div>

          {/* Font settings */}
          <div className="relative" ref={fontSettingsRef}>
            <button
              onClick={() => {
                setShowFontSettings(!showFontSettings);
                setShowThemePicker(false);
                setShowTemplatePicker(false);
              }}
              className="px-2 py-1 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 rounded-md transition"
            >
              글꼴
            </button>
            {showFontSettings && (
              <FontSettingsPanel
                currentFonts={currentRoleFonts}
                onApply={handleBatchFontChange}
                onClose={() => setShowFontSettings(false)}
              />
            )}
          </div>

          <div className="w-px h-5 bg-neutral-200" />

          {/* Notes toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition ${
              showNotes
                ? "bg-neutral-200 text-neutral-700"
                : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
            }`}
          >
            노트
          </button>

          {/* Shortcut help */}
          <div className="relative">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`w-6 h-6 flex items-center justify-center text-[11px] font-medium rounded-full transition ${
                showShortcuts
                  ? "bg-neutral-200 text-neutral-700"
                  : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
              }`}
              title="단축키 안내"
            >
              ?
            </button>
            {showShortcuts && (
              <div className="absolute top-full right-0 mt-1 p-3 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 w-56 animate-slide-up">
                <p className="text-[11px] font-medium text-neutral-700 mb-2">단축키</p>
                <div className="space-y-1.5 text-[11px] text-neutral-500">
                  <ShortcutRow keys="더블클릭" desc="텍스트 추가/편집" />
                  <ShortcutRow keys="우클릭" desc="컨텍스트 메뉴" />
                  <ShortcutRow keys="Ctrl+D" desc="복제" />
                  <ShortcutRow keys="Del" desc="선택 요소 삭제" />
                  <ShortcutRow keys="Esc" desc="선택 해제" />
                  <ShortcutRow keys="Shift+클릭" desc="다중 선택" />
                  <ShortcutRow keys="Shift+리사이즈" desc="비율 유지" />
                  <ShortcutRow keys="Shift+회전" desc="15도 스냅" />
                  <ShortcutRow keys="Ctrl+스크롤" desc="확대/축소" />
                  <ShortcutRow keys="Ctrl+0" desc="화면에 맞춤" />
                  <ShortcutRow keys="Space+드래그" desc="캔버스 이동" />
                </div>
              </div>
            )}
          </div>

          {/* Presentation button */}
          <button
            onClick={() => setPresenting(true)}
            className="px-3 py-1 text-[11px] font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition"
          >
            발표
          </button>
        </div>

        {/* Canvas area — maximized */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#e5e5e5" }}>
            {activeSlide && isFreeform ? (
              <FreeformCanvas
                slide={activeSlide}
                theme={theme}
                selectedIds={selectedIds}
                editingId={editingId}
                onSelect={(ids) => {
                  setSelectedIds(ids);
                  setEditingId(null);
                }}
                onEditStart={(id) => {
                  setSelectedIds([id]);
                  setEditingId(id);
                }}
                onElementUpdate={handleElementUpdate}
                onContentChange={handleContentChange}
                onCanvasClick={handleCanvasClick}
                onInsertTextAt={handleInsertTextAt}
                onInsertShapeAt={handleInsertShapeAt}
                onInsertImageAt={handleInsertImageAt}
                onInsertCodeAt={handleInsertCodeAt}
                onDuplicateElement={handleDuplicateElements}
                onDeleteElement={handleDeleteElements}
                onBringToFront={() => {
                  if (!selectedIds[0]) return;
                  updateActiveSlideElements(bringToFront(activeSlide?.elements || [], selectedIds[0]));
                }}
                onSendToBack={() => {
                  if (!selectedIds[0]) return;
                  updateActiveSlideElements(sendToBack(activeSlide?.elements || [], selectedIds[0]));
                }}
                onImportFile={onImportFile}
                importing={importing}
                externalScale={zoomLevel ?? undefined}
                onZoomChange={handleZoomChange}
                onAutoZoom={setAutoZoomLevel}
                panOffset={panOffset}
                onPanChange={setPanOffset}
              />
            ) : activeSlide ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <SlideCanvas
                  slide={activeSlide}
                  theme={theme}
                  scale={0.85}
                  interactive
                  activeSlot={activeSlot}
                  editingSlot={editingSlot}
                  onSlotClick={(id) => {
                    setActiveSlot(id);
                    setEditingSlot(null);
                  }}
                  onSlotDoubleClick={(id) => {
                    setActiveSlot(id);
                    setEditingSlot(id);
                  }}
                  onSlotChange={handleSlotChange}
                />
              </div>
            ) : null}
          </div>

          {/* Notes panel */}
          {showNotes && (
            <div className="border-t border-neutral-200 px-3 py-1.5 bg-white">
              <textarea
                value={activeSlide?.notes || ""}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="발표자 노트를 입력하세요..."
                className="w-full text-xs text-neutral-500 bg-transparent outline-none resize-none leading-relaxed"
                rows={3}
              />
            </div>
          )}

          {/* Status bar */}
          <StatusBar
            slideIndex={activeIndex}
            totalSlides={slides.length}
            selectedElements={selectedElements}
            zoom={currentZoom}
            onZoomChange={handleZoomChange}
            onZoomFit={handleZoomFit}
          />
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-400">{desc}</span>
      <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-600">
        {keys}
      </kbd>
    </div>
  );
}
