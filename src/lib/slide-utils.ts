import { v4 as uuidv4 } from "uuid";
import type {
  Slide,
  SlideLayoutId,
  SlotContent,
  LayoutDefinition,
  PresentationTheme,
  Presentation,
} from "@/types/slide";
import type { Block } from "@/types/block";

// ── Layout Definitions ──

export const LAYOUTS: LayoutDefinition[] = [
  {
    id: "title",
    name: "제목",
    description: "중앙 제목만",
    gridTemplate: "1fr",
    gridAreas: '"title"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
    ],
  },
  {
    id: "title-subtitle",
    name: "제목 + 부제",
    description: "제목과 부제목",
    gridTemplate: "1fr auto",
    gridAreas: '"title" "subtitle"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "subtitle", type: "subtitle", label: "부제목", gridArea: "subtitle" },
    ],
  },
  {
    id: "title-body",
    name: "제목 + 본문",
    description: "제목과 본문 텍스트",
    gridTemplate: "auto 1fr",
    gridAreas: '"title" "body"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "body", type: "body", label: "본문", gridArea: "body" },
    ],
  },
  {
    id: "section-header",
    name: "섹션 헤더",
    description: "큰 섹션 구분 제목",
    gridTemplate: "1fr",
    gridAreas: '"title"',
    slots: [
      { id: "title", type: "title", label: "섹션 제목", gridArea: "title" },
    ],
  },
  {
    id: "two-column",
    name: "2단 레이아웃",
    description: "좌우 두 개의 본문",
    gridTemplate: "auto 1fr",
    gridAreas: '"title title" "left right"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "left", type: "body", label: "왼쪽", gridArea: "left" },
      { id: "right", type: "body", label: "오른쪽", gridArea: "right" },
    ],
  },
  {
    id: "image-text",
    name: "이미지 + 텍스트",
    description: "왼쪽 이미지, 오른쪽 텍스트",
    gridTemplate: "auto 1fr",
    gridAreas: '"title title" "image body"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "image", type: "image", label: "이미지", gridArea: "image" },
      { id: "body", type: "body", label: "본문", gridArea: "body" },
    ],
  },
  {
    id: "text-image",
    name: "텍스트 + 이미지",
    description: "왼쪽 텍스트, 오른쪽 이미지",
    gridTemplate: "auto 1fr",
    gridAreas: '"title title" "body image"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "body", type: "body", label: "본문", gridArea: "body" },
      { id: "image", type: "image", label: "이미지", gridArea: "image" },
    ],
  },
  {
    id: "full-image",
    name: "전체 이미지",
    description: "이미지가 슬라이드 전체를 차지",
    gridTemplate: "1fr",
    gridAreas: '"image"',
    slots: [
      { id: "image", type: "image", label: "이미지", gridArea: "image" },
    ],
  },
  {
    id: "full-code",
    name: "전체 코드",
    description: "코드가 슬라이드 전체를 차지",
    gridTemplate: "auto 1fr",
    gridAreas: '"title" "code"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "code", type: "code", label: "코드", gridArea: "code" },
    ],
  },
  {
    id: "code-explain",
    name: "코드 + 설명",
    description: "왼쪽 코드, 오른쪽 설명",
    gridTemplate: "auto 1fr",
    gridAreas: '"title title" "code body"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "code", type: "code", label: "코드", gridArea: "code" },
      { id: "body", type: "body", label: "설명", gridArea: "body" },
    ],
  },
  {
    id: "quiz-slide",
    name: "퀴즈",
    description: "퀴즈 문제 슬라이드",
    gridTemplate: "auto 1fr",
    gridAreas: '"title" "quiz"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "quiz", type: "quiz", label: "퀴즈", gridArea: "quiz" },
    ],
  },
  {
    id: "blank",
    name: "빈 슬라이드",
    description: "자유 본문",
    gridTemplate: "1fr",
    gridAreas: '"body"',
    slots: [
      { id: "body", type: "body", label: "내용", gridArea: "body" },
    ],
  },
  // ── 모던 디자인 레이아웃 ──
  {
    id: "hero",
    name: "히어로",
    description: "대형 제목 + 부제 + 액센트 바",
    gridTemplate: "1fr auto auto",
    gridAreas: '"title" "subtitle" "body"',
    slots: [
      { id: "title", type: "title", label: "메인 타이틀", gridArea: "title" },
      { id: "subtitle", type: "subtitle", label: "서브 카피", gridArea: "subtitle" },
      { id: "body", type: "body", label: "부가 정보", gridArea: "body" },
    ],
  },
  {
    id: "big-number",
    name: "빅 넘버",
    description: "강조 숫자 + 설명 텍스트",
    gridTemplate: "auto 1fr auto",
    gridAreas: '"title" "body" "subtitle"',
    slots: [
      { id: "title", type: "title", label: "핵심 수치", gridArea: "title" },
      { id: "body", type: "body", label: "설명", gridArea: "body" },
      { id: "subtitle", type: "subtitle", label: "출처/부연", gridArea: "subtitle" },
    ],
  },
  {
    id: "quote",
    name: "인용구",
    description: "인용문 + 출처",
    gridTemplate: "1fr auto",
    gridAreas: '"body" "subtitle"',
    slots: [
      { id: "body", type: "body", label: "인용문", gridArea: "body" },
      { id: "subtitle", type: "subtitle", label: "출처", gridArea: "subtitle" },
    ],
  },
  {
    id: "three-column",
    name: "3단 레이아웃",
    description: "제목 + 세 개의 컬럼",
    gridTemplate: "auto 1fr",
    gridAreas: '"title title title" "left center right"',
    slots: [
      { id: "title", type: "title", label: "제목", gridArea: "title" },
      { id: "left", type: "body", label: "항목 1", gridArea: "left" },
      { id: "center", type: "body", label: "항목 2", gridArea: "center" },
      { id: "right", type: "body", label: "항목 3", gridArea: "right" },
    ],
  },
  {
    id: "agenda",
    name: "아젠다",
    description: "제목 + 목차 리스트",
    gridTemplate: "auto 1fr",
    gridAreas: '"title title" "body image"',
    slots: [
      { id: "title", type: "title", label: "아젠다", gridArea: "title" },
      { id: "body", type: "body", label: "목차", gridArea: "body" },
      { id: "image", type: "image", label: "이미지", gridArea: "image" },
    ],
  },
];

export function getLayout(id: SlideLayoutId): LayoutDefinition {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// ── Theme Presets ──

export const THEMES: PresentationTheme[] = [
  {
    id: "light",
    name: "라이트",
    bgColor: "#ffffff",
    titleColor: "#171717",
    bodyColor: "#404040",
    accentColor: "#6366f1",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    codeBg: "#1e1e2e",
  },
  {
    id: "dark",
    name: "다크",
    bgColor: "#18181b",
    titleColor: "#fafafa",
    bodyColor: "#a1a1aa",
    accentColor: "#818cf8",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    codeBg: "#09090b",
  },
  {
    id: "blue",
    name: "블루",
    bgColor: "#eff6ff",
    bgGradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    titleColor: "#1e3a5f",
    bodyColor: "#334155",
    accentColor: "#3b82f6",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    codeBg: "#1e293b",
  },
  {
    id: "warm",
    name: "웜톤",
    bgColor: "#fefce8",
    bgGradient: "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)",
    titleColor: "#78350f",
    bodyColor: "#44403c",
    accentColor: "#f59e0b",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    codeBg: "#292524",
  },
  {
    id: "green",
    name: "그린",
    bgColor: "#f0fdf4",
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    titleColor: "#14532d",
    bodyColor: "#374151",
    accentColor: "#22c55e",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    codeBg: "#1a2e1a",
  },
  {
    id: "midnight",
    name: "미드나이트",
    bgColor: "#0f172a",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    titleColor: "#e2e8f0",
    bodyColor: "#94a3b8",
    accentColor: "#a78bfa",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    codeBg: "#020617",
  },
];

export function getTheme(id: string): PresentationTheme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

// ── Slide Creation ──

export function createSlide(
  layoutId: SlideLayoutId = "blank",
  order: number = 0
): Slide {
  const layout = getLayout(layoutId);
  const slots: Record<string, SlotContent> = {};
  for (const slot of layout.slots) {
    slots[slot.id] = {};
  }
  return {
    id: uuidv4(),
    layoutId,
    slots,
    order,
    elements: [],
  };
}

export function createDefaultPresentation(): Presentation {
  return {
    slides: [createSlide("blank", 0)],
    theme: THEMES[0],
  };
}

// ── Block ↔ Slide Migration ──

export function blocksToSlides(blocks: Block[]): Slide[] {
  if (!blocks || blocks.length === 0) {
    return [createSlide("title", 0)];
  }

  const slides: Slide[] = [];
  let currentBlocks: Block[] = [];

  const flush = () => {
    if (currentBlocks.length === 0) return;
    const newSlides = blocksToMultipleSlides(currentBlocks, slides.length);
    slides.push(...newSlides);
    currentBlocks = [];
  };

  for (const block of blocks) {
    if (block.type === "divider") {
      flush();
      continue;
    }
    currentBlocks.push(block);
  }
  flush();

  return slides.length > 0 ? slides : [createSlide("title", 0)];
}

/**
 * 블록 그룹을 1개 이상의 슬라이드로 변환
 * 복수 코드/이미지 블록이 있으면 각각 별도 슬라이드로 분리
 */
function blocksToMultipleSlides(blocks: Block[], startOrder: number): Slide[] {
  if (blocks.length === 0) return [];

  const slides: Slide[] = [];
  let order = startOrder;

  // Single block: direct conversion
  if (blocks.length === 1) {
    const slide = blockToSlide(blocks[0], order);
    if (slide) return [slide];
    return [];
  }

  // Check for heading as first block
  const first = blocks[0];
  const firstText = first.type === "text" ? first : null;
  const headingMatch = firstText?.content.text?.match(/^#{1,6}\s+(.+)/m);
  const heading = headingMatch?.[1] || null;

  // Separate blocks by type
  const textBlocks: Extract<Block, { type: "text" }>[] = [];
  const codeBlocks: Extract<Block, { type: "code" }>[] = [];
  const imageBlocks: Extract<Block, { type: "image" }>[] = [];
  const quizBlocks: Extract<Block, { type: "quiz" }>[] = [];

  const startIdx = heading ? 1 : 0;
  for (let i = startIdx; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "text") textBlocks.push(b as Extract<Block, { type: "text" }>);
    else if (b.type === "code") codeBlocks.push(b as Extract<Block, { type: "code" }>);
    else if (b.type === "image") imageBlocks.push(b as Extract<Block, { type: "image" }>);
    else if (b.type === "quiz") quizBlocks.push(b as Extract<Block, { type: "quiz" }>);
  }

  const bodyText = textBlocks.map((b) => b.content.text).join("\n\n");

  // Strategy: If only one code or one image, combine with heading+text on one slide
  if (codeBlocks.length <= 1 && imageBlocks.length <= 1 && quizBlocks.length === 0) {
    const hasCode = codeBlocks[0];
    const hasImage = imageBlocks[0];

    if (heading && hasCode) {
      slides.push({
        id: uuidv4(),
        layoutId: "code-explain",
        slots: {
          title: { text: heading },
          code: { code: hasCode.content.code, language: hasCode.content.language },
          body: { text: bodyText },
        },
        order: order++,
      });
      if (hasImage) {
        slides.push({
          id: uuidv4(),
          layoutId: "full-image",
          slots: {
            image: { imageUrl: hasImage.content.url, imageAlt: hasImage.content.alt || "" },
          },
          order: order++,
        });
      }
      return slides;
    }

    if (heading && hasImage) {
      slides.push({
        id: uuidv4(),
        layoutId: "image-text",
        slots: {
          title: { text: heading },
          image: { imageUrl: hasImage.content.url, imageAlt: hasImage.content.alt || "" },
          body: { text: bodyText },
        },
        order: order++,
      });
      return slides;
    }

    if (heading) {
      if (bodyText) {
        slides.push({
          id: uuidv4(),
          layoutId: "title-body",
          slots: { title: { text: heading }, body: { text: bodyText } },
          order: order++,
        });
      } else {
        slides.push({
          id: uuidv4(),
          layoutId: "title",
          slots: { title: { text: heading } },
          order: order++,
        });
      }
      return slides;
    }
  }

  // Strategy: Multiple media blocks — create one slide per block sequentially
  // First: heading + body text slide (if any)
  if (heading || bodyText) {
    if (heading && bodyText) {
      slides.push({
        id: uuidv4(),
        layoutId: "title-body",
        slots: { title: { text: heading }, body: { text: bodyText } },
        order: order++,
      });
    } else if (heading) {
      slides.push({
        id: uuidv4(),
        layoutId: "title",
        slots: { title: { text: heading } },
        order: order++,
      });
    } else {
      slides.push({
        id: uuidv4(),
        layoutId: "blank",
        slots: { body: { text: bodyText } },
        order: order++,
      });
    }
  }

  // Each code block → own slide
  for (const cb of codeBlocks) {
    slides.push({
      id: uuidv4(),
      layoutId: "full-code",
      slots: {
        title: { text: cb.content.filename || cb.content.language || "" },
        code: { code: cb.content.code, language: cb.content.language },
      },
      order: order++,
    });
  }

  // Each image → own slide
  for (const ib of imageBlocks) {
    slides.push({
      id: uuidv4(),
      layoutId: "full-image",
      slots: {
        image: { imageUrl: ib.content.url, imageAlt: ib.content.alt || "" },
      },
      order: order++,
    });
  }

  // Each quiz → own slide
  for (const qb of quizBlocks) {
    slides.push({
      id: uuidv4(),
      layoutId: "quiz-slide",
      slots: {
        title: { text: "퀴즈" },
        quiz: {
          question: qb.content.question,
          options: qb.content.options,
          correctIndex: qb.content.correctIndex,
        },
      },
      order: order++,
    });
  }

  // Fallback: if nothing was added
  if (slides.length === 0) {
    const allText = blocks
      .filter((b): b is Extract<Block, { type: "text" }> => b.type === "text")
      .map((b) => b.content.text)
      .join("\n\n");
    slides.push({
      id: uuidv4(),
      layoutId: "blank",
      slots: { body: { text: allText || "" } },
      order: order++,
    });
  }

  return slides;
}

/**
 * 단일 블록을 슬라이드로 변환
 */
function blockToSlide(block: Block, order: number): Slide | null {
  if (block.type === "code") {
    return {
      id: uuidv4(),
      layoutId: "full-code",
      slots: {
        title: { text: block.content.filename || "" },
        code: { code: block.content.code, language: block.content.language },
      },
      order,
    };
  }

  if (block.type === "image") {
    return {
      id: uuidv4(),
      layoutId: "full-image",
      slots: {
        image: { imageUrl: block.content.url, imageAlt: block.content.alt || "" },
      },
      order,
    };
  }

  if (block.type === "quiz") {
    return {
      id: uuidv4(),
      layoutId: "quiz-slide",
      slots: {
        title: { text: "퀴즈" },
        quiz: {
          question: block.content.question,
          options: block.content.options,
          correctIndex: block.content.correctIndex,
        },
      },
      order,
    };
  }

  if (block.type === "text") {
    const text = block.content.text || "";
    const lines = text.split("\n");

    // Find first heading (title)
    const titleMatch = text.match(/^(#{1,2})\s+(.+)/m);
    // Find subtitle (### heading after the title)
    const subtitleMatch = text.match(/^###\s+(.+)/m);

    if (titleMatch) {
      const titleText = titleMatch[2].trim();
      // Remove both title and subtitle headings from body
      let bodyText = text
        .replace(/^#{1,3}\s+.+/gm, "")
        .trim();

      if (subtitleMatch && bodyText) {
        // Has title + subtitle + body → use hero layout if available, else title-body with subtitle in body
        return {
          id: uuidv4(),
          layoutId: "hero",
          slots: {
            title: { text: titleText },
            subtitle: { text: subtitleMatch[1].trim() },
            body: { text: bodyText },
          },
          order,
        };
      }
      if (subtitleMatch) {
        // Title + subtitle only
        return {
          id: uuidv4(),
          layoutId: "title-subtitle",
          slots: {
            title: { text: titleText },
            subtitle: { text: subtitleMatch[1].trim() },
          },
          order,
        };
      }
      if (bodyText) {
        return {
          id: uuidv4(),
          layoutId: "title-body",
          slots: {
            title: { text: titleText },
            body: { text: bodyText },
          },
          order,
        };
      }
      return {
        id: uuidv4(),
        layoutId: "title",
        slots: { title: { text: titleText } },
        order,
      };
    }

    return {
      id: uuidv4(),
      layoutId: "blank",
      slots: { body: { text: block.content.text } },
      order,
    };
  }

  return null;
}

export function slidesToBlocks(slides: Slide[]): Block[] {
  const blocks: Block[] = [];
  let order = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const layout = getLayout(slide.layoutId);

    for (const slotDef of layout.slots) {
      const content = slide.slots[slotDef.id];
      if (!content) continue;

      if (slotDef.type === "title" && content.text) {
        blocks.push({
          id: uuidv4(),
          type: "text",
          content: { text: `## ${content.text}`, format: "markdown" },
          order: order++,
        });
      } else if (slotDef.type === "subtitle" && content.text) {
        blocks.push({
          id: uuidv4(),
          type: "text",
          content: { text: content.text, format: "markdown" },
          order: order++,
        });
      } else if (slotDef.type === "body" && content.text) {
        blocks.push({
          id: uuidv4(),
          type: "text",
          content: { text: content.text, format: "markdown" },
          order: order++,
        });
      } else if (slotDef.type === "image" && content.imageUrl) {
        blocks.push({
          id: uuidv4(),
          type: "image",
          content: { url: content.imageUrl, alt: content.imageAlt || "" },
          order: order++,
        });
      } else if (slotDef.type === "code" && content.code) {
        blocks.push({
          id: uuidv4(),
          type: "code",
          content: { code: content.code, language: content.language || "text" },
          order: order++,
        });
      } else if (slotDef.type === "quiz" && content.question) {
        blocks.push({
          id: uuidv4(),
          type: "quiz",
          content: {
            question: content.question,
            options: content.options || [],
            correctIndex: content.correctIndex || 0,
          },
          order: order++,
        });
      }
    }

    // Add divider between slides (except last)
    if (i < slides.length - 1) {
      blocks.push({
        id: uuidv4(),
        type: "divider",
        content: {} as Record<string, never>,
        order: order++,
      });
    }
  }

  return blocks;
}
