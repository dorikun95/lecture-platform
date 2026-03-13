"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2 } from "lucide-react";
import type { LibraryItem } from "@/types/course";
import {
  getCategoryLabel,
  getDifficultyLabel,
  getDifficultyColor,
} from "@/lib/utils";
import { LessonViewer } from "@/components/viewer/LessonViewer";
import { Modal } from "@/components/ui/Modal";

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [preview, setPreview] = useState<LibraryItem | null>(null);

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);

    fetch(`/api/library?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [category, difficulty]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleFork = async (itemId: string) => {
    const res = await fetch(`/api/library/${itemId}/fork`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      alert("라이브러리에서 가져왔습니다! 코스 에디터에서 레슨에 추가하세요.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">콘텐츠 라이브러리</h1>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm placeholder:text-neutral-300 focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 outline-none transition-all duration-200"
          />
        </form>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 outline-none transition-all duration-200 focus:border-neutral-400 cursor-pointer"
        >
          <option value="">전체 카테고리</option>
          <option value="ai-ml">AI/ML</option>
          <option value="web-dev">웹개발</option>
          <option value="data-science">데이터사이언스</option>
          <option value="mobile">모바일</option>
          <option value="devops">DevOps</option>
          <option value="security">보안</option>
          <option value="design">디자인</option>
          <option value="other">기타</option>
        </select>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 outline-none transition-all duration-200 focus:border-neutral-400 cursor-pointer"
        >
          <option value="">전체 난이도</option>
          <option value="beginner">입문</option>
          <option value="intermediate">중급</option>
          <option value="advanced">고급</option>
        </select>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-neutral-400 mb-1">라이브러리가 비어있습니다</p>
          <p className="text-[13px] text-neutral-300">
            관리자가 콘텐츠를 추가하면 여기에 표시됩니다
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} hover>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getDifficultyColor(item.difficulty)}`}
                >
                  {getDifficultyLabel(item.difficulty)}
                </span>
                <Badge>{getCategoryLabel(item.category)}</Badge>
              </div>
              <h3 className="font-medium text-[14px] text-neutral-900 mb-1">
                {item.title}
              </h3>
              <p className="text-[13px] text-neutral-400 line-clamp-2 mb-3">
                {item.description}
              </p>
              <div className="flex items-center justify-between text-[11px] text-neutral-300 mb-3">
                <span>{item.blocks.length}개 블록</span>
                <span>사용 {item.usageCount}회</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setPreview(item)}
                >
                  미리보기
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleFork(item.id)}
                >
                  가져오기
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <Modal
          open={!!preview}
          onClose={() => setPreview(null)}
          title={preview.title}
        >
          <div className="max-h-[60vh] overflow-y-auto">
            <LessonViewer blocks={preview.blocks} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => handleFork(preview.id)}>
              내 자료로 가져오기
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
