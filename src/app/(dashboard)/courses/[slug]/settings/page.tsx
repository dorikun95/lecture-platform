"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Check } from "lucide-react";
import Link from "next/link";
import type { Course, Category, Difficulty, Visibility } from "@/types/course";

export default function CourseSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data.course);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!course) return;
    setSaving(true);
    await fetch(`/api/courses/${course.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        visibility: course.visibility,
      }),
    });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!course) return;
    if (!confirm("이 코스를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
      return;
    await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    router.push("/courses");
  };

  const copyShareLink = () => {
    if (!course) return;
    const url = `${window.location.origin}/course/${course.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="animate-pulse bg-neutral-50 rounded-xl h-64" />;
  }

  if (!course) {
    return <p className="text-neutral-400 text-sm">코스를 찾을 수 없습니다</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link
          href={`/courses/${slug}/edit`}
          className="text-[12px] text-neutral-400 hover:text-neutral-600 transition"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">코스 설정</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <Input
            label="코스 제목"
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
          />

          <Textarea
            label="설명"
            value={course.description}
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
            rows={4}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                카테고리
              </label>
              <select
                value={course.category}
                onChange={(e) =>
                  setCourse({
                    ...course,
                    category: e.target.value as Category,
                  })
                }
                className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 outline-none transition-all duration-200 focus:border-neutral-400 cursor-pointer"
              >
                <option value="ai-ml">AI/ML</option>
                <option value="web-dev">웹개발</option>
                <option value="data-science">데이터사이언스</option>
                <option value="mobile">모바일</option>
                <option value="devops">DevOps</option>
                <option value="security">보안</option>
                <option value="design">디자인</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                난이도
              </label>
              <select
                value={course.difficulty}
                onChange={(e) =>
                  setCourse({
                    ...course,
                    difficulty: e.target.value as Difficulty,
                  })
                }
                className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 outline-none transition-all duration-200 focus:border-neutral-400 cursor-pointer"
              >
                <option value="beginner">입문</option>
                <option value="intermediate">중급</option>
                <option value="advanced">고급</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
              공개 범위
            </label>
            <select
              value={course.visibility}
              onChange={(e) =>
                setCourse({
                  ...course,
                  visibility: e.target.value as Visibility,
                })
              }
              className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 outline-none transition-all duration-200 focus:border-neutral-400 cursor-pointer"
            >
              <option value="private">비공개</option>
              <option value="public">공개</option>
              <option value="password">비밀번호 보호</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button loading={saving} onClick={handleSave}>
              설정 저장
            </Button>
          </div>
        </div>
      </Card>

      {/* Share Link */}
      <Card>
        <h3 className="text-[14px] font-medium text-neutral-900 mb-3">공유 링크</h3>
        <div className="flex gap-2">
          <input
            readOnly
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/course/${course.slug}`}
            className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-100 rounded-lg text-[13px] text-neutral-500"
          />
          <Button variant="secondary" onClick={copyShareLink}>
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                복사됨
              </>
            ) : (
              "복사"
            )}
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-100">
        <h3 className="text-[14px] font-medium text-red-600 mb-1">위험 영역</h3>
        <p className="text-[13px] text-neutral-400 mb-4">
          코스를 삭제하면 모든 모듈, 레슨, 자료가 영구적으로 삭제됩니다.
        </p>
        <Button variant="danger" onClick={handleDelete}>
          코스 삭제
        </Button>
      </Card>
    </div>
  );
}
