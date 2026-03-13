"use client";

import type { Presentation } from "@/types/slide";
import { SLIDE_TEMPLATES, applyTemplate } from "@/lib/slide-templates";

interface TemplatePickerProps {
  onApply: (presentation: Presentation) => void;
  onClose: () => void;
}

export function TemplatePicker({ onApply, onClose }: TemplatePickerProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-100 rounded-xl shadow-xl p-4 z-30 w-96 animate-slide-up">
      <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-3 px-1">
        디자인 템플릿
      </p>
      <div className="grid grid-cols-2 gap-3">
        {SLIDE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => {
              onApply(applyTemplate(template));
              onClose();
            }}
            className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-neutral-50 transition text-left"
          >
            {/* Theme color preview */}
            <div
              className="w-full aspect-[16/9] rounded-lg flex flex-col items-center justify-center gap-1 p-3 shadow-sm"
              style={{
                background:
                  template.theme.bgGradient || template.theme.bgColor,
                border:
                  template.theme.bgColor === "#ffffff"
                    ? "1px solid #e5e5e5"
                    : "none",
              }}
            >
              <div
                className="w-3/4 h-2 rounded-sm font-bold"
                style={{ backgroundColor: template.theme.titleColor }}
              />
              <div
                className="w-1/2 h-1 rounded-sm opacity-40"
                style={{ backgroundColor: template.theme.bodyColor }}
              />
              <div className="flex gap-1 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: template.theme.accentColor }}
                />
                <div
                  className="w-3 h-3 rounded-full opacity-30"
                  style={{ backgroundColor: template.theme.titleColor }}
                />
              </div>
            </div>

            <div>
              <p className="text-[13px] font-medium text-neutral-700 group-hover:text-neutral-900">
                {template.name}
              </p>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                {template.description} · {template.slides.length}장
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
