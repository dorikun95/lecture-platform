"use client";

import { useState, useRef } from "react";
import type { Block } from "@/types/block";

interface FileImporterProps {
  onImport: (blocks: Block[]) => void;
}

export function FileImporter({ onImport }: FileImporterProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setImporting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "파일 파싱 실패");
        setImporting(false);
        return;
      }

      onImport(data.blocks);
    } catch {
      setError("파일 처리 중 오류가 발생했습니다.");
    }

    setImporting(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.pptx,.docx,.html,.htm,.md,.txt,.markdown"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="border border-dashed border-neutral-200 rounded-lg p-6 text-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50/50 transition-all duration-200"
      >
        {importing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
            <span className="text-[13px] text-neutral-500">파싱 중...</span>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-neutral-500 font-medium">
              파일에서 가져오기
            </p>
            <p className="text-[11px] text-neutral-300 mt-1">
              PDF, PPTX, DOCX, MD, TXT
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
