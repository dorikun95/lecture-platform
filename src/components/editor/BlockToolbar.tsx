"use client";

import { useEffect, useRef } from "react";
import type { BlockType } from "@/types/block";

interface BlockToolbarProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const blockTypes: { type: BlockType; label: string; shortcut: string }[] = [
  { type: "text", label: "텍스트", shortcut: "Md" },
  { type: "image", label: "이미지", shortcut: "Img" },
  { type: "code", label: "코드", shortcut: "</>" },
  { type: "divider", label: "구분선", shortcut: "—" },
  { type: "video", label: "비디오", shortcut: "Vid" },
  { type: "quiz", label: "퀴즈", shortcut: "Q" },
  { type: "embed", label: "임베드", shortcut: "Em" },
];

export function BlockToolbar({ onSelect, onClose }: BlockToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-neutral-100 rounded-xl shadow-lg p-1.5 z-20 w-48 animate-slide-up"
    >
      <p className="text-[11px] text-neutral-400 px-2 pb-1 font-medium uppercase tracking-wider">
        블록 추가
      </p>
      {blockTypes.map((bt) => (
        <button
          key={bt.type}
          onClick={() => onSelect(bt.type)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-50 rounded-md transition"
        >
          <span className="font-medium">{bt.label}</span>
          <span className="text-[11px] text-neutral-300 font-mono">{bt.shortcut}</span>
        </button>
      ))}
    </div>
  );
}
