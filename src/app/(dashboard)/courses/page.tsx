"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Trash2 } from "lucide-react";
import type { Course } from "@/types/course";
import {
  formatRelativeTime,
  getCategoryLabel,
  getDifficultyLabel,
  getDifficultyColor,
} from "@/lib/utils";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("이 코스를 삭제하시겠습니까?")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    setCourses(courses.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">내 코스</h1>
        <Link href="/courses/new">
          <Button>새 코스</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-neutral-50 rounded-xl h-44" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-neutral-400 mb-2">아직 코스가 없습니다</p>
          <p className="text-[13px] text-neutral-300 mb-6">
            첫 코스를 만들어 강의 자료를 구성해보세요
          </p>
          <Link href="/courses/new">
            <Button>첫 코스 만들기</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} hover>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getDifficultyColor(course.difficulty)}`}
                >
                  {getDifficultyLabel(course.difficulty)}
                </span>
                <Badge>{getCategoryLabel(course.category)}</Badge>
              </div>

              <Link href={`/courses/${course.slug}/edit`}>
                <h3 className="font-medium text-[14px] text-neutral-900 mb-1 hover:text-neutral-600 transition">
                  {course.title}
                </h3>
              </Link>
              <p className="text-[13px] text-neutral-400 line-clamp-2 mb-4">
                {course.description || "설명 없음"}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
                <span className="text-[11px] text-neutral-300">
                  {formatRelativeTime(course.updatedAt)}
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/courses/${course.slug}/settings`}
                    className="text-[11px] text-neutral-400 hover:text-neutral-600 transition px-2 py-1"
                  >
                    설정
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-1 hover:bg-red-50 rounded-md transition"
                  >
                    <Trash2 className="w-3 h-3 text-neutral-300 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
