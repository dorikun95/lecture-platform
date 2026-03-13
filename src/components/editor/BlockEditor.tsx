"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { BlockWrapper } from "./BlockWrapper";
import { BlockToolbar } from "./BlockToolbar";
import { TextBlockComponent } from "./blocks/TextBlock";
import { ImageBlockComponent } from "./blocks/ImageBlock";
import { CodeBlockComponent } from "./blocks/CodeBlock";
import { DividerBlockComponent } from "./blocks/DividerBlock";
import type { Block, BlockType } from "@/types/block";
import { Plus } from "lucide-react";

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [showToolbar, setShowToolbar] = useState<number | null>(null);

  const addBlock = (type: BlockType, afterIndex: number) => {
    const defaultContent: Record<string, unknown> = {
      text: { text: "", format: "markdown" },
      image: { url: "", alt: "", caption: "" },
      code: { code: "", language: "javascript", filename: "" },
      divider: {},
      video: { url: "", provider: "youtube" },
      quiz: { question: "", options: ["", ""], correctIndex: 0, explanation: "" },
      embed: { url: "", title: "" },
    };

    const newBlock: Block = {
      id: uuidv4(),
      type,
      content: defaultContent[type] || {},
      order: afterIndex + 1,
    } as Block;

    const updated = [...blocks];
    updated.splice(afterIndex + 1, 0, newBlock);
    // Re-index orders
    updated.forEach((b, i) => (b.order = i));
    onChange(updated);
    setShowToolbar(null);
  };

  const updateBlock = (id: string, content: Record<string, unknown>) => {
    onChange(
      blocks.map((b) =>
        b.id === id ? ({ ...b, content } as Block) : b
      )
    );
  };

  const removeBlock = (id: string) => {
    const updated = blocks.filter((b) => b.id !== id);
    updated.forEach((b, i) => (b.order = i));
    onChange(updated);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    )
      return;

    const updated = [...blocks];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    updated.forEach((b, i) => (b.order = i));
    onChange(updated);
  };

  const renderBlock = (block: Block) => {
    const props = {
      content: block.content as Record<string, unknown>,
      onChange: (content: Record<string, unknown>) =>
        updateBlock(block.id, content),
    };

    switch (block.type) {
      case "text":
        return <TextBlockComponent {...props} />;
      case "image":
        return <ImageBlockComponent {...props} />;
      case "code":
        return <CodeBlockComponent {...props} />;
      case "divider":
        return <DividerBlockComponent />;
      default:
        return (
          <div className="text-sm text-neutral-400 italic">
            미지원 블록 타입: {block.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {/* Add block at the beginning */}
      {blocks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-400 text-sm mb-4">
            블록을 추가하여 콘텐츠를 작성하세요
          </p>
          <div className="relative inline-block">
            <button
              onClick={() =>
                setShowToolbar(showToolbar === -1 ? null : -1)
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-500 hover:border-neutral-500 hover:text-neutral-900 transition"
            >
              <Plus className="w-4 h-4" />첫 블록 추가
            </button>
            {showToolbar === -1 && (
              <BlockToolbar
                onSelect={(type) => addBlock(type, -1)}
                onClose={() => setShowToolbar(null)}
              />
            )}
          </div>
        </div>
      )}

      {blocks.map((block, index) => (
        <div key={block.id}>
          <BlockWrapper
            onRemove={() => removeBlock(block.id)}
            onMoveUp={() => moveBlock(block.id, "up")}
            onMoveDown={() => moveBlock(block.id, "down")}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
          >
            {renderBlock(block)}
          </BlockWrapper>

          {/* Add block after this one */}
          <div className="flex justify-center py-1 group">
            <div className="relative">
              <button
                onClick={() =>
                  setShowToolbar(showToolbar === index ? null : index)
                }
                className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-neutral-500 hover:text-neutral-900 transition text-neutral-400"
              >
                <Plus className="w-3 h-3" />
              </button>
              {showToolbar === index && (
                <BlockToolbar
                  onSelect={(type) => addBlock(type, index)}
                  onClose={() => setShowToolbar(null)}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
