"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Copy, Check, Link, Globe, Lock, Key } from "lucide-react";
import type { Course, Visibility } from "@/types/course";

interface ShareDialogProps {
  course: Course;
  open: boolean;
  onClose: () => void;
  onVisibilityChange: (visibility: Visibility) => void;
}

export function ShareDialog({
  course,
  open,
  onClose,
  onVisibilityChange,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/course/${course.slug}`
      : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visibilityOptions = [
    {
      value: "public" as Visibility,
      label: "공개",
      desc: "누구나 접근 가능",
      icon: Globe,
    },
    {
      value: "private" as Visibility,
      label: "비밀 링크",
      desc: "URL을 아는 사람만 접근",
      icon: Link,
    },
    {
      value: "password" as Visibility,
      label: "비밀번호 보호",
      desc: "비밀번호 입력 필요",
      icon: Key,
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="공유 설정">
      <div className="space-y-5">
        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            공개 범위
          </label>
          <div className="space-y-2">
            {visibilityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onVisibilityChange(opt.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                  course.visibility === opt.value
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <opt.icon
                  className={`w-4 h-4 ${
                    course.visibility === opt.value
                      ? "text-neutral-900"
                      : "text-neutral-400"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-neutral-700">
                    {opt.label}
                  </p>
                  <p className="text-xs text-neutral-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Share Link */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            공유 링크
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-600"
            />
            <Button variant="secondary" onClick={copyLink}>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
