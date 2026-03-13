"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import type { LibraryItem, Category, Difficulty } from "@/types/course";
import { getCategoryLabel, getDifficultyLabel } from "@/lib/utils";

export default function AdminLibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other" as Category,
    difficulty: "beginner" as Difficulty,
  });

  useEffect(() => {
    fetch("/api/library")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.item) {
      setItems([data.item, ...items]);
      setShowCreate(false);
      setForm({
        title: "",
        description: "",
        category: "other",
        difficulty: "beginner",
      });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-[12px] text-neutral-400 hover:text-neutral-600 transition">
            &larr;
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">라이브러리 관리</h1>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          아이템 추가
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-50 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-neutral-400">라이브러리가 비어있습니다</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} hover>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-[14px] text-neutral-900">{item.title}</h3>
                    <Badge>{getCategoryLabel(item.category)}</Badge>
                    <Badge variant="info">
                      {getDifficultyLabel(item.difficulty)}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-neutral-400">{item.description}</p>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    {item.blocks.length}개 블록 · 사용 {item.usageCount}회
                  </p>
                </div>
                <button className="p-1.5 hover:bg-red-50 rounded-md transition">
                  <Trash2 className="w-3.5 h-3.5 text-neutral-300 hover:text-red-500" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="라이브러리 아이템 추가"
      >
        <div className="space-y-4">
          <Input
            label="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="예: Python 기초 실습 코드"
          />
          <Textarea
            label="설명"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="아이템에 대한 설명"
            rows={3}
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
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>추가</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
