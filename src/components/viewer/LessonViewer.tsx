"use client";

import type { Block } from "@/types/block";

interface LessonViewerProps {
  blocks: Block[];
}

export function LessonViewer({ blocks }: LessonViewerProps) {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400 text-sm">
        이 레슨에는 아직 콘텐츠가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <div key={block.id}>{renderViewBlock(block)}</div>
      ))}
    </div>
  );
}

function renderViewBlock(block: Block) {
  switch (block.type) {
    case "text":
      return <TextViewer text={block.content.text} />;
    case "image":
      return <ImageViewer url={block.content.url} alt={block.content.alt} caption={block.content.caption} />;
    case "code":
      return <CodeViewer code={block.content.code} language={block.content.language} filename={block.content.filename} />;
    case "divider":
      return <hr className="border-neutral-200" />;
    case "video":
      return <VideoViewer url={block.content.url} />;
    case "quiz":
      return <QuizViewer question={block.content.question} options={block.content.options} correctIndex={block.content.correctIndex} explanation={block.content.explanation} />;
    case "embed":
      return <EmbedViewer url={block.content.url} />;
    default:
      return null;
  }
}

function TextViewer({ text }: { text: string }) {
  // Simple markdown rendering
  const html = text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-neutral-900 mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-neutral-900 mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-neutral-900 mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono text-neutral-800">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-neutral-600">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-neutral-600">$2</li>')
    .replace(/\n\n/g, '</p><p class="text-neutral-600 leading-relaxed mb-3">')
    .replace(/\n/g, "<br/>");

  return (
    <div
      className="prose prose-sm max-w-none text-neutral-600 leading-relaxed"
      dangerouslySetInnerHTML={{
        __html: `<p class="text-neutral-600 leading-relaxed mb-3">${html}</p>`,
      }}
    />
  );
}

function ImageViewer({ url, alt, caption }: { url: string; alt?: string; caption?: string }) {
  if (!url) return null;
  return (
    <figure className="space-y-2">
      <img
        src={url}
        alt={alt || ""}
        className="rounded-lg max-w-full mx-auto"
      />
      {caption && (
        <figcaption className="text-center text-xs text-neutral-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function CodeViewer({
  code,
  language,
  filename,
}: {
  code: string;
  language: string;
  filename?: string;
}) {
  return (
    <div className="rounded-lg overflow-hidden border border-neutral-800">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900">
        <span className="text-xs text-neutral-500 font-mono">
          {filename || language}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition"
        >
          복사
        </button>
      </div>
      <pre className="p-4 bg-[#1e1e2e] overflow-x-auto">
        <code className="text-sm text-[#cdd6f4] font-mono whitespace-pre leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
}

function VideoViewer({ url }: { url: string }) {
  if (!url) return null;
  const youtubeId = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?/]+)/
  )?.[1];

  if (youtubeId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          className="w-full h-full"
          allowFullScreen
          title="Video"
        />
      </div>
    );
  }

  return (
    <div className="text-sm text-neutral-500 border border-neutral-200 rounded-lg p-4">
      비디오 링크: {url}
    </div>
  );
}

function QuizViewer({
  question,
  options,
  correctIndex,
  explanation,
}: {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}) {
  return <QuizInteractive question={question} options={options} correctIndex={correctIndex} explanation={explanation} />;
}

function EmbedViewer({ url }: { url: string }) {
  if (!url) return null;
  return (
    <div className="aspect-video rounded-lg overflow-hidden border border-neutral-200">
      <iframe src={url} className="w-full h-full" title="Embed" />
    </div>
  );
}

// Interactive quiz component
import { useState } from "react";

function QuizInteractive({
  question,
  options,
  correctIndex,
  explanation,
}: {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (i: number) => {
    if (revealed) return;
    setSelected(i);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setRevealed(true);
  };

  return (
    <div className="border border-neutral-200 rounded-xl p-5 space-y-4">
      <p className="font-semibold text-neutral-900">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition ${
              revealed
                ? i === correctIndex
                  ? "border-green-500 bg-green-50 text-green-700"
                  : i === selected
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-neutral-200 text-neutral-500"
                : selected === i
                  ? "border-neutral-900 bg-neutral-50 text-neutral-900"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {!revealed && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition disabled:opacity-50"
        >
          정답 확인
        </button>
      )}
      {revealed && explanation && (
        <div className="bg-blue-50 border-l-3 border-blue-500 p-3 rounded-r-lg text-sm text-blue-700">
          {explanation}
        </div>
      )}
    </div>
  );
}
