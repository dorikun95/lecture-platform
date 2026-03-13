"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import type { Course } from "@/types/course";
import { formatRelativeTime, getCategoryLabel, getDifficultyColor, getDifficultyLabel } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string | null; role?: string; id?: string };
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

  if (user?.role === "instructor" || user?.role === "admin") {
    return <InstructorDashboard courses={courses} loading={loading} />;
  }

  return <StudentDashboard courses={courses} loading={loading} />;
}

function InstructorDashboard({
  courses,
  loading,
}: {
  courses: Course[];
  loading: boolean;
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">대시보드</h1>
          <p className="text-[13px] text-neutral-400 mt-0.5">코스 현황을 한눈에 확인하세요</p>
        </div>
        <Link
          href="/courses/new"
          className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] px-4 py-2 rounded-lg transition shadow-sm"
        >
          새 코스
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "총 코스", value: courses.length },
          { label: "수강생", value: 0 },
          { label: "조회수", value: 0 },
          { label: "증가율", value: "0%" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">
              {kpi.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Recent Courses */}
      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-3">최근 코스</h2>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-neutral-50 rounded-xl h-36" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="text-center py-14">
            <p className="text-neutral-400 text-sm mb-3">아직 생성한 코스가 없습니다</p>
            <Link
              href="/courses/new"
              className="text-[13px] text-neutral-900 hover:text-neutral-700 font-medium underline underline-offset-4 decoration-neutral-300"
            >
              첫 코스 만들기
            </Link>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}/edit`}>
                <Card hover>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getDifficultyColor(course.difficulty)}`}>
                      {getDifficultyLabel(course.difficulty)}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {getCategoryLabel(course.category)}
                    </span>
                  </div>
                  <h3 className="font-medium text-[14px] text-neutral-900 mb-1 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-[13px] text-neutral-400 line-clamp-2 mb-3">
                    {course.description || "설명 없음"}
                  </p>
                  <p className="text-[11px] text-neutral-300">
                    {formatRelativeTime(course.updatedAt)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentDashboard({
  courses,
  loading,
}: {
  courses: Course[];
  loading: boolean;
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">내 학습</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">수강 중인 코스</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">0</p>
        </Card>
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">완료한 레슨</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">0</p>
        </Card>
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-3">
          추천 코스
        </h2>
        {loading ? (
          <div className="animate-pulse bg-neutral-50 rounded-xl h-36" />
        ) : (
          <Card className="text-center py-14">
            <p className="text-neutral-400 text-sm mb-3">
              라이브러리에서 관심 있는 코스를 탐색해보세요
            </p>
            <Link
              href="/library"
              className="text-[13px] text-neutral-900 hover:text-neutral-700 font-medium underline underline-offset-4 decoration-neutral-300"
            >
              라이브러리 탐색하기
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
