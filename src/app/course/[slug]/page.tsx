"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Course, Module, Lesson } from "@/types/course";
import { getCategoryLabel, getDifficultyLabel, getDifficultyColor } from "@/lib/utils";

export default function CoursePublicPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data.course);
        setModules(data.modules || []);
        setLessons(data.lessons || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400 text-sm">코스를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      {/* Header */}
      <nav className="bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center gap-2">
          <Link href="/" className="text-[13px] font-semibold text-neutral-900 tracking-tight">
            Lecture
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-300" />
          <span className="text-[13px] text-neutral-400 truncate">{course.title}</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getDifficultyColor(course.difficulty)}`}
            >
              {getDifficultyLabel(course.difficulty)}
            </span>
            <Badge>{getCategoryLabel(course.category)}</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 mb-3">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-[15px] text-neutral-400 max-w-2xl">{course.description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
          코스 구조
        </h2>

        {modules.length === 0 ? (
          <Card className="text-center py-14">
            <p className="text-neutral-400 text-sm">아직 콘텐츠가 준비되지 않았습니다</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((mod, mi) => {
              const modLessons = lessons
                .filter((l) => l.moduleId === mod.id)
                .sort((a, b) => a.orderIndex - b.orderIndex);

              return (
                <Card key={mod.id}>
                  <h3 className="font-medium text-[14px] text-neutral-900 mb-3">
                    {mi + 1}. {mod.title}
                  </h3>
                  <div className="space-y-0.5">
                    {modLessons.map((lesson, li) => (
                      <Link
                        key={lesson.id}
                        href={`/course/${slug}/${lesson.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-50 transition group"
                      >
                        <span className="text-[12px] font-medium text-neutral-300 w-5 text-center group-hover:text-neutral-500 transition">
                          {li + 1}
                        </span>
                        <span className="text-[13px] text-neutral-600 group-hover:text-neutral-900 transition">
                          {lesson.title}
                        </span>
                      </Link>
                    ))}
                    {modLessons.length === 0 && (
                      <p className="text-[13px] text-neutral-300 px-3">
                        레슨 준비 중...
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
