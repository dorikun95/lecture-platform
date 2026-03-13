"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import type { Category, Difficulty, Visibility } from "@/types/course";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other" as Category,
    difficulty: "beginner" as Difficulty,
    visibility: "private" as Visibility,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push(`/courses/${data.course.slug}/edit`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link
          href="/courses"
          className="text-[12px] text-neutral-400 hover:text-neutral-600 transition"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">새 코스 만들기</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="코스 제목"
            placeholder="예: AI 기초 과정"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <Textarea
            label="설명"
            placeholder="코스에 대한 간단한 설명을 작성하세요"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                카테고리
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Category })
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
                value={form.difficulty}
                onChange={(e) =>
                  setForm({
                    ...form,
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
              value={form.visibility}
              onChange={(e) =>
                setForm({
                  ...form,
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

          <div className="flex justify-end gap-2 pt-2">
            <Link href="/courses">
              <Button type="button" variant="secondary">
                취소
              </Button>
            </Link>
            <Button type="submit" loading={loading}>
              코스 생성
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
