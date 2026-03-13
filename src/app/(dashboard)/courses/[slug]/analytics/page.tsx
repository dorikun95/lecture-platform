"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Star } from "lucide-react";
import Link from "next/link";

interface Analytics {
  totalStudents: number;
  totalLessons: number;
  avgRating: number;
  avgCompletion: number;
  reviews: { rating: number; comment: string; createdAt: string }[];
  enrollmentsByDate: { date: string; count: number }[];
}

export default function CourseAnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<Analytics | null>(null);
  const [courseId, setCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.course) {
          setCourseId(d.course.id);
          return fetch(`/api/analytics/${d.course.id}`);
        }
        throw new Error("not found");
      })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-neutral-400 text-sm">데이터를 불러올 수 없습니다</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link
          href={`/courses/${slug}/edit`}
          className="text-[12px] text-neutral-400 hover:text-neutral-600 transition"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">코스 분석</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">수강생</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">{data.totalStudents}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">레슨 수</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">{data.totalLessons}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">평균 평점</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">{data.avgRating || "-"}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">완료율</p>
          <p className="text-2xl font-semibold tracking-tight text-neutral-900 mt-1">{data.avgCompletion}%</p>
        </Card>
      </div>

      {/* Enrollment Chart (simple bar) */}
      {data.enrollmentsByDate.length > 0 && (
        <Card>
          <h3 className="text-[14px] font-medium text-neutral-900 mb-4">수강 등록 추이</h3>
          <div className="flex items-end gap-1 h-32">
            {data.enrollmentsByDate.map((d) => {
              const max = Math.max(
                ...data.enrollmentsByDate.map((x) => x.count)
              );
              const height = max > 0 ? (d.count / max) * 100 : 0;
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-neutral-800 rounded-sm"
                    style={{ height: `${height}%`, minHeight: "2px" }}
                  />
                  <span className="text-[10px] text-neutral-300">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Reviews */}
      <Card>
        <h3 className="text-[14px] font-medium text-neutral-900 mb-4">최근 리뷰</h3>
        {data.reviews.length === 0 ? (
          <p className="text-[13px] text-neutral-400">아직 리뷰가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {data.reviews.map((r, i) => (
              <div key={i} className="border-b border-neutral-50 pb-3 last:border-0">
                <div className="flex items-center gap-0.5 mb-1">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      className={`w-3 h-3 ${
                        si < r.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-neutral-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[13px] text-neutral-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
