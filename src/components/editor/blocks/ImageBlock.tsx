"use client";

import { useState, useRef } from "react";
import { Upload, Image, Loader2 } from "lucide-react";

interface ImageBlockProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export function ImageBlockComponent({ content, onChange }: ImageBlockProps) {
  const url = (content.url as string) || "";
  const caption = (content.caption as string) || "";
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        onChange({ ...content, url: data.url, alt: file.name });
      }
    } catch {
      // ignore
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  if (!url) {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-neutral-500 transition"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-neutral-900 mx-auto" />
        ) : (
          <>
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border border-neutral-200">
        <img
          src={url}
          alt={(content.alt as string) || ""}
          className="w-full max-h-96 object-contain bg-neutral-50"
        />
        <button
          onClick={() => onChange({ ...content, url: "" })}
          className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70 transition"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>
      <input
        value={caption}
        onChange={(e) => onChange({ ...content, caption: e.target.value })}
        placeholder="이미지 설명 (선택)"
        className="w-full px-3 py-1.5 text-xs text-neutral-500 border border-neutral-200 rounded-lg outline-none focus:ring-1 focus:ring-neutral-300"
      />
    </div>
  );
}
