export type BlockType = "text" | "image" | "code" | "divider" | "video" | "quiz" | "embed";

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: {
    text: string;
    format?: "markdown" | "plain";
  };
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  content: {
    url: string;
    alt?: string;
    caption?: string;
  };
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  content: {
    code: string;
    language: string;
    filename?: string;
  };
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
  content: Record<string, never>;
}

export interface VideoBlock extends BaseBlock {
  type: "video";
  content: {
    url: string;
    provider?: "youtube" | "vimeo" | "other";
  };
}

export interface QuizBlock extends BaseBlock {
  type: "quiz";
  content: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  };
}

export interface EmbedBlock extends BaseBlock {
  type: "embed";
  content: {
    url: string;
    title?: string;
  };
}

export type Block =
  | TextBlock
  | ImageBlock
  | CodeBlock
  | DividerBlock
  | VideoBlock
  | QuizBlock
  | EmbedBlock;
