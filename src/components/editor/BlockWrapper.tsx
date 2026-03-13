"use client";

import { Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface BlockWrapperProps {
  children: React.ReactNode;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function BlockWrapper({
  children,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockWrapperProps) {
  return (
    <div className="group relative flex gap-1">
      {/* Controls */}
      <div className="flex flex-col items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {!isFirst && (
          <button
            onClick={onMoveUp}
            className="p-0.5 hover:bg-neutral-50 rounded"
            title="위로 이동"
          >
            <ChevronUp className="w-3 h-3 text-neutral-300" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={onMoveDown}
            className="p-0.5 hover:bg-neutral-50 rounded"
            title="아래로 이동"
          >
            <ChevronDown className="w-3 h-3 text-neutral-300" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-0.5 hover:bg-red-50 rounded"
          title="삭제"
        >
          <Trash2 className="w-3 h-3 text-neutral-300 hover:text-red-400" />
        </button>
      </div>

      {/* Block content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
