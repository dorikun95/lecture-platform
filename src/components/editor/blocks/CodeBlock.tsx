"use client";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "rust",
  "html",
  "css",
  "sql",
  "bash",
  "json",
  "yaml",
  "markdown",
];

interface CodeBlockProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export function CodeBlockComponent({ content, onChange }: CodeBlockProps) {
  const code = (content.code as string) || "";
  const language = (content.language as string) || "javascript";
  const filename = (content.filename as string) || "";

  return (
    <div className="rounded-lg overflow-hidden border border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-900">
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) =>
              onChange({ ...content, language: e.target.value })
            }
            className="bg-neutral-800 text-neutral-400 text-xs border-none outline-none rounded px-2 py-0.5"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <input
            value={filename}
            onChange={(e) =>
              onChange({ ...content, filename: e.target.value })
            }
            placeholder="파일명 (선택)"
            className="bg-transparent text-neutral-500 text-xs border-none outline-none placeholder:text-neutral-600 w-32"
          />
        </div>
      </div>

      {/* Code area */}
      <textarea
        value={code}
        onChange={(e) => onChange({ ...content, code: e.target.value })}
        placeholder="코드를 입력하세요..."
        className="w-full min-h-[120px] p-4 bg-[#1e1e2e] text-[#cdd6f4] text-sm font-mono outline-none resize-y leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}
