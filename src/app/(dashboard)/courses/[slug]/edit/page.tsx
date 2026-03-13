"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { SlideEditor } from "@/components/slide-editor/SlideEditor";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Timer,
  Check,
  FolderOpen,
  Upload,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { Course, Module, Lesson } from "@/types/course";
import type { Block } from "@/types/block";
import type { Presentation } from "@/types/slide";
import {
  blocksToSlides,
  slidesToBlocks,
  createDefaultPresentation,
} from "@/lib/slide-utils";
import { slotsToElements } from "@/lib/slide-element-utils";

// Auto-save interval options (in seconds, 0 = off)
const AUTO_SAVE_OPTIONS = [
  { label: "끄기", value: 0 },
  { label: "10초", value: 10 },
  { label: "30초", value: 30 },
  { label: "1분", value: 60 },
  { label: "3분", value: 180 },
  { label: "5분", value: 300 },
] as const;

const AUTO_SAVE_STORAGE_KEY = "lecture-platform-autosave-interval";

type EditorMode = "block" | "slide";

export default function CourseEditPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAutoSaveMenu, setShowAutoSaveMenu] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("slide");
  const [autoSaveInterval, setAutoSaveInterval] = useState(0);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);
  const [moduleImporting, setModuleImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const moduleImportRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const autoSaveMenuRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeLessonRef = useRef(activeLesson);
  const editorModeRef = useRef(editorMode);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data.course);
        setModules(data.modules || []);
        setLessons(data.lessons || []);
        if (data.modules?.length > 0) {
          setExpandedModules(new Set([data.modules[0].id]));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // Close export menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExportMenu]);

  // Close auto-save menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (autoSaveMenuRef.current && !autoSaveMenuRef.current.contains(e.target as Node)) {
        setShowAutoSaveMenu(false);
      }
    };
    if (showAutoSaveMenu) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAutoSaveMenu]);

  // Load auto-save preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTO_SAVE_STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored);
        if (AUTO_SAVE_OPTIONS.some((o) => o.value === val)) {
          setAutoSaveInterval(val);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Keep refs in sync
  useEffect(() => { activeLessonRef.current = activeLesson; }, [activeLesson]);
  useEffect(() => { editorModeRef.current = editorMode; }, [editorMode]);

  const saveLesson = useCallback(
    async (lessonId: string, blocks: Block[], presentation?: Presentation) => {
      setSaving(true);
      await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, presentation }),
      });
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId ? { ...l, blocks, presentation } : l
        )
      );
      setSaving(false);
    },
    []
  );

  // Auto-save timer
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (autoSaveInterval <= 0) return;

    autoSaveTimerRef.current = setInterval(() => {
      const lesson = activeLessonRef.current;
      if (!lesson) return;

      let blocksToSave = lesson.blocks;
      if (editorModeRef.current === "slide" && lesson.presentation) {
        blocksToSave = slidesToBlocks(lesson.presentation.slides);
      }
      saveLesson(lesson.id, blocksToSave, lesson.presentation).then(() => {
        setLastAutoSaved(new Date());
      });
    }, autoSaveInterval * 1000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [autoSaveInterval, saveLesson]);

  const handleAutoSaveChange = (value: number) => {
    setAutoSaveInterval(value);
    setShowAutoSaveMenu(false);
    try {
      localStorage.setItem(AUTO_SAVE_STORAGE_KEY, String(value));
    } catch { /* ignore */ }
  };

  const addModule = async () => {
    if (!course) return;
    const res = await fetch(`/api/courses/${course.id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `모듈 ${modules.length + 1}` }),
    });
    const data = await res.json();
    if (data.module) {
      setModules([...modules, data.module]);
      setExpandedModules(new Set([...expandedModules, data.module.id]));
    }
  };

  const addLesson = async (moduleId: string) => {
    const moduleLessons = lessons.filter((l) => l.moduleId === moduleId);
    const res = await fetch(`/api/lessons/${moduleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `레슨 ${moduleLessons.length + 1}`,
      }),
    });
    const data = await res.json();
    if (data.lesson) {
      setLessons([...lessons, data.lesson]);
      setActiveLesson(data.lesson);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" });
    setLessons(lessons.filter((l) => l.id !== lessonId));
    if (activeLesson?.id === lessonId) setActiveLesson(null);
  };

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedModules(next);
  };

  // Auto-convert slots to freeform elements
  const ensureFreeform = useCallback(
    (presentation: Presentation): Presentation => {
      const theme = presentation.theme;
      const slides = presentation.slides.map((slide) => {
        if (slide.elements && slide.elements.length > 0) return slide;
        // Has slot content → migrate to elements
        const hasContent = Object.values(slide.slots).some(
          (s) => s.text || s.imageUrl || s.code || s.question
        );
        if (hasContent) {
          return { ...slide, elements: slotsToElements(slide, theme) };
        }
        // Empty slide → empty freeform
        return { ...slide, elements: [] };
      });
      return { ...presentation, slides };
    },
    []
  );

  // Auto-create presentation when switching to slide mode or selecting a lesson
  useEffect(() => {
    if (editorMode === "slide" && activeLesson && !activeLesson.presentation) {
      const slides = blocksToSlides(activeLesson.blocks || []);
      const base = createDefaultPresentation();
      const presentation = ensureFreeform({ ...base, slides });
      setActiveLesson({ ...activeLesson, presentation });
    } else if (editorMode === "slide" && activeLesson?.presentation) {
      // Ensure existing presentations are freeform
      const current = activeLesson.presentation;
      const hasLegacy = current.slides.some(
        (s) => !s.elements || (s.elements.length === 0 && Object.values(s.slots).some(
          (c) => c.text || c.imageUrl || c.code || c.question
        ))
      );
      if (hasLegacy) {
        setActiveLesson({
          ...activeLesson,
          presentation: ensureFreeform(current),
        });
      }
    }
  }, [activeLesson?.id, editorMode]);

  // ── 에디터 모드 전환 ──
  const switchToSlideMode = () => {
    if (!activeLesson) return;
    if (!activeLesson.presentation) {
      const slides = blocksToSlides(activeLesson.blocks || []);
      const base = createDefaultPresentation();
      const presentation = ensureFreeform({ ...base, slides });
      setActiveLesson({ ...activeLesson, presentation });
    }
    setEditorMode("slide");
  };

  const switchToBlockMode = () => {
    if (!activeLesson) return;
    // Sync slides back to blocks if in slide mode
    if (activeLesson.presentation) {
      const blocks = slidesToBlocks(activeLesson.presentation.slides);
      setActiveLesson({ ...activeLesson, blocks });
    }
    setEditorMode("block");
  };

  // ── 파일 가져오기 ──
  const handleImportFile = async (file: File) => {
    if (!activeLesson) return;
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && (data.blocks || data.slides)) {
        const existingBlocks = activeLesson.blocks || [];
        const newBlocks = (data.blocks || []).map((b: Block, i: number) => ({
          ...b,
          order: existingBlocks.length + i,
        }));
        const merged = [...existingBlocks, ...newBlocks];

        if (editorMode === "slide") {
          const currentPresentation = activeLesson.presentation || createDefaultPresentation();
          const startOrder = currentPresentation.slides.length;

          // If PPTX with slides data (full styling), use directly
          if (data.slides && data.slides.length > 0) {
            const importedSlides = data.slides.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (s: any, i: number) => ({
                ...s,
                order: startOrder + i,
              })
            );
            const updatedPresentation = {
              ...currentPresentation,
              slides: [...currentPresentation.slides, ...importedSlides],
            };
            setActiveLesson({
              ...activeLesson,
              blocks: merged,
              presentation: updatedPresentation,
            });
          } else {
            // Fallback: convert blocks to slides
            const importedSlides = blocksToSlides(newBlocks);
            const theme = currentPresentation.theme;
            const freeformSlides = importedSlides.map((s, i) => {
              const hasContent = Object.values(s.slots).some(
                (c) => c.text || c.imageUrl || c.code || c.question
              );
              return {
                ...s,
                order: startOrder + i,
                elements: hasContent ? slotsToElements(s, theme) : [],
              };
            });
            const updatedPresentation = {
              ...currentPresentation,
              slides: [...currentPresentation.slides, ...freeformSlides],
            };
            setActiveLesson({
              ...activeLesson,
              blocks: merged,
              presentation: updatedPresentation,
            });
          }
        } else {
          setActiveLesson({ ...activeLesson, blocks: merged });
        }
      } else {
        alert(data.error || "파일 가져오기 실패");
      }
    } catch {
      alert("파일 처리 중 오류가 발생했습니다.");
    }

    setImporting(false);
  };

  // ── 내보내기 ──
  const handleExport = (format: "md" | "html" | "pdf" | "pptx" | "json") => {
    if (!activeLesson) return;
    setShowExportMenu(false);
    window.open(`/api/export/${activeLesson.id}?format=${format}`, "_blank");
  };

  // ── 저장 핸들러 ──
  const handleSave = () => {
    if (!activeLesson) return;
    let blocksToSave = activeLesson.blocks;
    // If in slide mode, sync slides to blocks before saving
    if (editorMode === "slide" && activeLesson.presentation) {
      blocksToSave = slidesToBlocks(activeLesson.presentation.slides);
    }
    saveLesson(activeLesson.id, blocksToSave, activeLesson.presentation);
  };

  // ── 모듈로 가져오기 ──
  const handleModuleImport = async (file: File) => {
    if (!course) return;
    setModuleImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/courses/${course.id}/import`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.modules && data.lessons) {
        // Add new modules and lessons to state
        setModules((prev) => [...prev, ...data.modules]);
        setLessons((prev) => [...prev, ...data.lessons]);

        // Expand newly created modules
        const newModuleIds = data.modules.map((m: Module) => m.id);
        setExpandedModules((prev) => new Set([...prev, ...newModuleIds]));

        // Select first lesson of first new module
        if (data.lessons.length > 0) {
          setActiveLesson(data.lessons[0]);
          setEditorMode("slide");
        }

        alert(
          `${data.moduleCount}개 모듈, ${data.lessonCount}개 레슨이 생성되었습니다.`
        );
      } else {
        alert(data.error || "모듈 가져오기 실패");
      }
    } catch {
      alert("파일 처리 중 오류가 발생했습니다.");
    }

    setModuleImporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-400 text-sm">코스를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 h-[calc(100vh-5rem)] animate-fade-in">
      {/* Hidden file inputs for import */}
      <input
        ref={importRef}
        type="file"
        accept=".pdf,.pptx,.docx,.html,.htm,.md,.txt,.markdown"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={moduleImportRef}
        type="file"
        accept=".pdf,.pptx,.docx,.html,.htm,.md,.txt,.markdown"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleModuleImport(file);
          e.target.value = "";
        }}
      />

      {/* Sidebar — Course Structure */}
      <div className="w-52 flex-shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/courses"
            className="text-[12px] text-neutral-400 hover:text-neutral-600 transition"
          >
            &larr;
          </Link>
          <h2 className="text-[12px] font-medium text-neutral-900 truncate">
            {course.title}
          </h2>
        </div>

        <div className="space-y-0.5">
          {modules.map((mod) => {
            const modLessons = lessons.filter((l) => l.moduleId === mod.id);
            const isExpanded = expandedModules.has(mod.id);

            return (
              <div key={mod.id}>
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 rounded-md transition"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-neutral-400" />
                  )}
                  <span className="truncate">{mod.title}</span>
                </button>

                {isExpanded && (
                  <div className="ml-3 space-y-0.5 mt-0.5">
                    {modLessons
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`group flex items-center gap-1 px-2.5 py-1.5 rounded-md cursor-pointer text-[13px] transition ${
                            activeLesson?.id === lesson.id
                              ? "bg-neutral-100 text-neutral-900 font-medium"
                              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                          }`}
                          onClick={() => {
                            setActiveLesson(lesson);
                            setEditorMode("slide");
                          }}
                        >
                          <span className="truncate flex-1">
                            {lesson.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLesson(lesson.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-neutral-300 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => addLesson(mod.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-neutral-400 hover:text-neutral-600 transition"
                    >
                      <Plus className="w-3 h-3" />
                      레슨 추가
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={addModule}
          >
            <Plus className="w-3 h-3" />
            모듈 추가
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => moduleImportRef.current?.click()}
            disabled={moduleImporting}
          >
            {moduleImporting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                가져오는 중...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                파일로 모듈 생성
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {activeLesson ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <input
                  value={activeLesson.title}
                  onChange={(e) => {
                    const updated = { ...activeLesson, title: e.target.value };
                    setActiveLesson(updated);
                    setLessons(
                      lessons.map((l) => (l.id === updated.id ? updated : l))
                    );
                  }}
                  className="text-lg font-semibold tracking-tight text-neutral-900 bg-transparent outline-none border-b border-transparent focus:border-neutral-200 transition px-0.5 py-0.5"
                />

                {/* Editor mode toggle */}
                <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
                  <button
                    onClick={switchToBlockMode}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                      editorMode === "block"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    블록
                  </button>
                  <button
                    onClick={switchToSlideMode}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                      editorMode === "slide"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    슬라이드
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 가져오기 — 블록/슬라이드 양쪽 모드 지원 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => importRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
                      가져오는 중
                    </>
                  ) : (
                    "가져오기"
                  )}
                </Button>

                {/* 내보내기 */}
                <div className="relative" ref={exportMenuRef}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    내보내기
                  </Button>
                  {showExportMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-100 rounded-lg shadow-lg p-1 z-20 w-36 animate-slide-up">
                      <button
                        onClick={() => handleExport("pdf")}
                        className="w-full text-left px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-50 rounded-md transition"
                      >
                        PDF (.pdf)
                      </button>
                      <button
                        onClick={() => handleExport("pptx")}
                        className="w-full text-left px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-50 rounded-md transition"
                      >
                        PowerPoint (.pptx)
                      </button>
                      <button
                        onClick={() => handleExport("md")}
                        className="w-full text-left px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-50 rounded-md transition"
                      >
                        Markdown (.md)
                      </button>
                      <button
                        onClick={() => handleExport("html")}
                        className="w-full text-left px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-50 rounded-md transition"
                      >
                        HTML (.html)
                      </button>
                      <button
                        onClick={() => handleExport("json")}
                        className="w-full text-left px-3 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-50 rounded-md transition"
                      >
                        JSON (.json)
                      </button>
                    </div>
                  )}
                </div>

                {/* 자동 저장 설정 */}
                <div className="relative" ref={autoSaveMenuRef}>
                  <button
                    onClick={() => setShowAutoSaveMenu(!showAutoSaveMenu)}
                    className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition ${
                      autoSaveInterval > 0
                        ? "text-green-600 bg-green-50 hover:bg-green-100"
                        : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                    }`}
                    title="자동 저장 설정"
                  >
                    <Timer className="w-3.5 h-3.5" />
                    {autoSaveInterval > 0
                      ? AUTO_SAVE_OPTIONS.find((o) => o.value === autoSaveInterval)?.label
                      : "자동 저장"}
                  </button>
                  {showAutoSaveMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-100 rounded-lg shadow-lg p-1 z-20 w-40 animate-slide-up">
                      <div className="px-3 py-1.5 text-[11px] text-neutral-400 font-medium">
                        자동 저장 주기
                      </div>
                      {AUTO_SAVE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleAutoSaveChange(opt.value)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] rounded-md transition ${
                            autoSaveInterval === opt.value
                              ? "bg-neutral-100 text-neutral-900 font-medium"
                              : "text-neutral-600 hover:bg-neutral-50"
                          }`}
                        >
                          {opt.label}
                          {autoSaveInterval === opt.value && (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          )}
                        </button>
                      ))}
                      {lastAutoSaved && autoSaveInterval > 0 && (
                        <div className="px-3 py-1.5 text-[10px] text-neutral-400 border-t border-neutral-100 mt-1">
                          마지막 저장: {lastAutoSaved.toLocaleTimeString("ko-KR")}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 저장 */}
                <Button size="sm" loading={saving} onClick={handleSave}>
                  저장
                </Button>
              </div>
            </div>

            {/* Editor content */}
            {editorMode === "block" ? (
              <Card className="min-h-[60vh]">
                <BlockEditor
                  blocks={activeLesson.blocks}
                  onChange={(blocks) =>
                    setActiveLesson({ ...activeLesson, blocks })
                  }
                />
              </Card>
            ) : (
              <div className="flex-1 min-h-[60vh]">
                <SlideEditor
                  presentation={
                    activeLesson.presentation || createDefaultPresentation()
                  }
                  onChange={(presentation) =>
                    setActiveLesson({ ...activeLesson, presentation })
                  }
                  onImportFile={handleImportFile}
                  importing={importing}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-neutral-400 text-sm mb-1">레슨을 선택하세요</p>
              <p className="text-[13px] text-neutral-300">
                왼쪽에서 레슨을 클릭하거나 새 레슨을 추가하세요
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
