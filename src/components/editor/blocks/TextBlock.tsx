"use client";

interface TextBlockProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export function TextBlockComponent({ content, onChange }: TextBlockProps) {
  const text = (content.text as string) || "";

  return (
    <textarea
      value={text}
      onChange={(e) => onChange({ ...content, text: e.target.value })}
      placeholder="마크다운 텍스트를 입력하세요... (## 제목, **굵게**, *기울임*, - 목록)"
      className="w-full min-h-[80px] px-4 py-3 text-sm text-neutral-700 bg-transparent border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 outline-none resize-y font-sans leading-relaxed"
      style={{ fontFamily: "var(--font-sans)" }}
    />
  );
}
