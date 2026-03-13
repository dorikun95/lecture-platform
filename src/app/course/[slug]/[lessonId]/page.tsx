"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LessonViewer } from "@/components/viewer/LessonViewer";
import type { Course, Module, Lesson } from "@/types/course";

export default function LessonPublicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${slug}`).then((r) => r.json()),
      fetch(`/api/lessons/${lessonId}`).then((r) => r.json()),
    ])
      .then(([courseData, lessonData]) => {
        setCourse(courseData.course);
        setModules(courseData.modules || []);
        setAllLessons(courseData.lessons || []);
        setLesson(lessonData.lesson);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400 text-sm">레슨을 찾을 수 없습니다</p>
      </div>
    );
  }

  // Navigation
  const sortedLessons = allLessons.sort((a, b) => a.orderIndex - b.orderIndex);
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < sortedLessons.length - 1
      ? sortedLessons[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/course/${slug}`}
              className="text-[12px] text-neutral-400 hover:text-neutral-600 transition flex-shrink-0"
            >
              &larr; 목록
            </Link>
            <span className="text-neutral-200 flex-shrink-0">·</span>
            <span className="text-[13px] text-neutral-600 truncate">
              {lesson.title}
            </span>
          </div>
          <span className="text-[11px] text-neutral-300 flex-shrink-0">
            {currentIndex + 1} / {sortedLessons.length}
          </span>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 mb-8">
          {lesson.title}
        </h1>

        <LessonViewer blocks={lesson.blocks} />
      </div>

      {/* Navigation */}
      <div className="border-t border-neutral-50">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          {prevLesson ? (
            <Link
              href={`/course/${slug}/${prevLesson.id}`}
              className="text-[13px] text-neutral-400 hover:text-neutral-600 transition"
            >
              &larr; {prevLesson.title}
            </Link>
          ) : (
            <div />
          )}
          {nextLesson ? (
            <Link
              href={`/course/${slug}/${nextLesson.id}`}
              className="text-[13px] text-neutral-900 hover:text-neutral-700 font-medium transition"
            >
              {nextLesson.title} &rarr;
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
