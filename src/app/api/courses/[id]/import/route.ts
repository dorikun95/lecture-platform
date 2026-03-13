import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Module, Lesson } from "@/types/course";
import type { Block, TextBlock } from "@/types/block";
import type { Slide } from "@/types/slide";
import {
  parsePDF,
  parseDOCX,
  parsePPTX,
  parsePPTXToSlides,
  parseMarkdown,
  parsePlainText,
  parseHTML,
} from "@/lib/file-parser";
import { blocksToSlides, createDefaultPresentation } from "@/lib/slide-utils";
import { slotsToElements } from "@/lib/slide-element-utils";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/html": "html",
  "text/markdown": "md",
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/**
 * 파일을 모듈 단위로 가져오기
 * 내용에 따라 자동으로 모듈/레슨 분할
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const course = await db.courses.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: "코스 없음" }, { status: 404 });
  }

  const user = session.user as { id?: string };
  if (course.instructorId !== user.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // Determine file type
    let fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") fileType = "pdf";
      else if (ext === "md" || ext === "markdown") fileType = "md";
      else if (ext === "txt") fileType = "txt";
      else if (ext === "pptx") fileType = "pptx";
      else if (ext === "docx") fileType = "docx";
      else if (ext === "html" || ext === "htm") fileType = "html";
      else {
        return NextResponse.json(
          { error: "지원하지 않는 파일 형식입니다." },
          { status: 400 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let blocks: Block[] = [];
    let slides: Slide[] | undefined;

    switch (fileType) {
      case "pdf":
        blocks = await parsePDF(buffer);
        break;
      case "docx":
        blocks = await parseDOCX(buffer);
        break;
      case "pptx":
        blocks = await parsePPTX(buffer);
        slides = await parsePPTXToSlides(buffer);
        break;
      case "html":
        blocks = await parseHTML(buffer.toString("utf-8"));
        break;
      case "md":
        blocks = await parseMarkdown(buffer.toString("utf-8"));
        break;
      case "txt":
        blocks = parsePlainText(buffer.toString("utf-8"));
        break;
    }

    // Split blocks into sections by dividers
    const sections = splitBlocksIntoSections(blocks);

    // For PPTX, also split slides
    const slideSections = slides ? splitSlidesIntoSections(slides, sections.length) : undefined;

    // Determine module/lesson structure
    const structure = buildModuleStructure(sections, file.name);

    // Get existing modules count for ordering
    const existingModules = await db.modules.findMany((m) => m.courseId === courseId);
    let moduleOrderIndex = existingModules.length;

    const now = new Date().toISOString();
    const createdModules: Module[] = [];
    const createdLessons: Lesson[] = [];

    const theme = createDefaultPresentation().theme;

    for (const mod of structure) {
      // Create module
      const newModule: Module = {
        id: uuidv4(),
        courseId,
        title: mod.title,
        orderIndex: moduleOrderIndex++,
        createdAt: now,
      };
      await db.modules.create(newModule);
      createdModules.push(newModule);

      // Create lessons within this module
      for (let li = 0; li < mod.lessons.length; li++) {
        const lessonDef = mod.lessons[li];
        const lessonBlocks = lessonDef.blocks;

        // Build presentation from slides or blocks
        let presentation;
        if (slideSections && lessonDef.slideIndices) {
          // Use exact PPTX slides for this lesson
          const lessonSlides = lessonDef.slideIndices
            .map((idx) => slides![idx])
            .filter(Boolean)
            .map((s, i) => ({ ...s, order: i }));

          if (lessonSlides.length > 0) {
            presentation = { slides: lessonSlides, theme };
          }
        }

        if (!presentation && lessonBlocks.length > 0) {
          // Generate slides from blocks
          const genSlides = blocksToSlides(lessonBlocks);
          const freeformSlides = genSlides.map((s, i) => {
            const hasContent = Object.values(s.slots).some(
              (c) => c.text || c.imageUrl || c.code || c.question
            );
            return {
              ...s,
              order: i,
              elements: hasContent ? slotsToElements(s, theme) : [],
            };
          });
          presentation = { slides: freeformSlides, theme };
        }

        const lesson: Lesson = {
          id: uuidv4(),
          moduleId: newModule.id,
          courseId,
          title: lessonDef.title,
          orderIndex: li,
          blocks: lessonBlocks,
          presentation,
          createdAt: now,
          updatedAt: now,
        };
        await db.lessons.create(lesson);
        createdLessons.push(lesson);
      }
    }

    return NextResponse.json({
      modules: createdModules,
      lessons: createdLessons,
      moduleCount: createdModules.length,
      lessonCount: createdLessons.length,
    });
  } catch (err) {
    console.error("Module import error:", err);
    return NextResponse.json(
      { error: "파일 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/** Type guard: block is a TextBlock */
function isTextBlock(block: Block): block is TextBlock {
  return block.type === "text";
}

/** Safely get text from a block (returns "" for non-text blocks) */
function blockText(block: Block): string {
  return isTextBlock(block) ? (block.content.text || "") : "";
}

/**
 * 블록을 divider 기준으로 섹션 분할
 */
function splitBlocksIntoSections(blocks: Block[]): Block[][] {
  const sections: Block[][] = [];
  let current: Block[] = [];

  for (const block of blocks) {
    if (block.type === "divider") {
      if (current.length > 0) {
        sections.push(current);
        current = [];
      }
    } else {
      current.push(block);
    }
  }
  if (current.length > 0) {
    sections.push(current);
  }

  return sections.length > 0 ? sections : [blocks];
}

/**
 * PPTX 슬라이드를 섹션 수에 맞게 분할
 */
function splitSlidesIntoSections(
  slides: Slide[],
  sectionCount: number
): number[][] {
  if (sectionCount <= 1) {
    return [slides.map((_, i) => i)];
  }

  // Distribute slides evenly across sections
  const result: number[][] = [];
  const slidesPerSection = Math.ceil(slides.length / sectionCount);

  for (let i = 0; i < sectionCount; i++) {
    const start = i * slidesPerSection;
    const end = Math.min(start + slidesPerSection, slides.length);
    const indices: number[] = [];
    for (let j = start; j < end; j++) {
      indices.push(j);
    }
    if (indices.length > 0) {
      result.push(indices);
    }
  }

  return result;
}

interface LessonDefinition {
  title: string;
  blocks: Block[];
  slideIndices?: number[];
}

interface ModuleDefinition {
  title: string;
  lessons: LessonDefinition[];
}

/**
 * 섹션들을 모듈/레슨 구조로 변환
 * 1) 목차(TOC)가 있으면 목차 기반으로 구조화
 * 2) 목차가 없으면 큰 개념(헤딩 계층) 기반으로 구조화
 */
function buildModuleStructure(
  sections: Block[][],
  fileName: string
): ModuleDefinition[] {
  if (sections.length === 0) {
    return [
      {
        title: cleanFileName(fileName),
        lessons: [{ title: "레슨 1", blocks: [] }],
      },
    ];
  }

  // Flatten all blocks for TOC detection
  const allBlocks = sections.flat();

  // Strategy 1: TOC-based
  const toc = detectTOC(allBlocks);
  if (toc && toc.length > 0) {
    return buildFromTOC(toc, sections, fileName);
  }

  // Strategy 2: Concept-based (heading hierarchy)
  return buildFromConcepts(sections, fileName);
}

// ── TOC detection & parsing ──

interface TOCEntry {
  level: number; // 1 = top-level (module), 2 = sub-item (lesson)
  title: string;
  number?: string; // e.g. "1", "1.1", "제1장"
}

/**
 * 블록에서 목차(TOC)를 감지하고 파싱
 * "목차", "Table of Contents", "차례" 등의 헤딩 뒤에 오는
 * 번호/불릿 리스트를 목차로 인식
 */
function detectTOC(blocks: Block[]): TOCEntry[] | null {
  // Find TOC heading
  let tocStartIdx = -1;
  const tocPatterns = [
    /^#{1,3}\s*(목차|차례|table\s+of\s+contents|contents|toc)\s*$/im,
    /^(목차|차례|table\s+of\s+contents|contents)\s*$/im,
  ];

  for (let i = 0; i < blocks.length; i++) {
    if (!isTextBlock(blocks[i])) continue;
    const text = blockText(blocks[i]).trim();
    if (!text) continue;
    if (tocPatterns.some((p) => p.test(text))) {
      tocStartIdx = i;
      break;
    }
  }

  if (tocStartIdx === -1) return null;

  // Collect TOC entries from lines following the TOC heading
  const entries: TOCEntry[] = [];

  // The TOC heading block itself may contain entries after the heading line
  const tocBlock = blocks[tocStartIdx];
  const tocText = blockText(tocBlock);
  const tocLines = tocText.split("\n");
  const headingLine = tocLines.findIndex((l: string) =>
    tocPatterns.some((p) => p.test(l.trim()))
  );

  // Parse lines after the heading in the same block
  const linesAfterHeading = tocLines.slice(headingLine + 1);
  for (const line of linesAfterHeading) {
    const entry = parseTOCLine(line);
    if (entry) entries.push(entry);
  }

  // Parse subsequent blocks until we hit non-TOC content
  for (let i = tocStartIdx + 1; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === "divider") break;
    if (!isTextBlock(block)) break;

    const text = blockText(block).trim();
    if (!text) continue;

    const lines = text.split("\n");
    let nonTocLineCount = 0;

    for (const line of lines) {
      const entry = parseTOCLine(line);
      if (entry) {
        entries.push(entry);
      } else if (line.trim().length > 0) {
        nonTocLineCount++;
        // If we see too many non-TOC lines, we've left the TOC
        if (nonTocLineCount >= 2) break;
      }
    }

    if (nonTocLineCount >= 2) break;
  }

  // Need at least 2 entries for a valid TOC
  return entries.length >= 2 ? entries : null;
}

/**
 * 한 줄을 TOC 항목으로 파싱
 * 지원 패턴:
 *   "1. 제목", "1.1 제목", "제1장 제목", "Chapter 1: 제목"
 *   "- 제목", "• 제목" (bullet items → level 2)
 *   "  1.1 제목" (들여쓰기 → level 2)
 */
function parseTOCLine(line: string): TOCEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // Skip page numbers only (e.g. "... 42")
  if (/^[.\s…]+\d+\s*$/.test(trimmed)) return null;

  const indent = line.length - line.trimStart().length;

  // Pattern: "제N장 제목" or "제N부 제목"
  const chapterKo = trimmed.match(/^(제\s*(\d+)\s*(장|부|편|절|과))\s*[.:：\s]\s*(.+)/);
  if (chapterKo) {
    const unit = chapterKo[3];
    const level = unit === "부" || unit === "편" ? 1 : indent >= 4 ? 2 : 1;
    return { level, title: chapterKo[4].replace(/[.\s…]+\d+\s*$/, "").trim(), number: chapterKo[1] };
  }

  // Pattern: "Chapter N: Title" or "Part N: Title"
  const chapterEn = trimmed.match(/^((?:chapter|part|section|unit)\s+(\d+))\s*[.:：\s]\s*(.+)/i);
  if (chapterEn) {
    const unit = chapterEn[1].toLowerCase();
    const level = unit.startsWith("part") ? 1 : indent >= 4 ? 2 : 1;
    return { level, title: chapterEn[3].replace(/[.\s…]+\d+\s*$/, "").trim(), number: chapterEn[1] };
  }

  // Pattern: "1.1. Title" or "1.1 Title" (sub-numbered → level 2)
  const subNumbered = trimmed.match(/^(\d+\.\d+\.?)\s+(.+)/);
  if (subNumbered) {
    return { level: 2, title: subNumbered[2].replace(/[.\s…]+\d+\s*$/, "").trim(), number: subNumbered[1] };
  }

  // Pattern: "1. Title" or "1) Title" (top-level numbered)
  const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)/);
  if (numbered) {
    const level = indent >= 4 ? 2 : 1;
    return { level, title: numbered[2].replace(/[.\s…]+\d+\s*$/, "").trim(), number: numbered[1] };
  }

  // Pattern: bullet items "- Title", "• Title", "* Title"
  const bullet = trimmed.match(/^[-•*]\s+(.+)/);
  if (bullet) {
    return { level: 2, title: bullet[1].replace(/[.\s…]+\d+\s*$/, "").trim() };
  }

  // Pattern: Roman numerals "I. Title", "II. Title"
  const roman = trimmed.match(/^((?:I{1,3}|IV|V|VI{0,3}|IX|X{0,3}))[.)]\s+(.+)/);
  if (roman) {
    return { level: 1, title: roman[2].replace(/[.\s…]+\d+\s*$/, "").trim(), number: roman[1] };
  }

  return null;
}

/**
 * TOC 기반으로 모듈/레슨 구조 생성
 * TOC의 상위 항목 → 모듈, 하위 항목 → 레슨
 * 각 항목의 제목을 본문에서 찾아 해당 블록들을 배정
 */
function buildFromTOC(
  toc: TOCEntry[],
  sections: Block[][],
  fileName: string
): ModuleDefinition[] {
  // Normalize TOC levels: ensure we have both level 1 and 2
  const hasLevel1 = toc.some((e) => e.level === 1);
  const hasLevel2 = toc.some((e) => e.level === 2);

  // If all entries are the same level, treat them differently
  if (!hasLevel1 && hasLevel2) {
    // All level 2 → promote to level 1 (each becomes a module with single lesson)
    toc = toc.map((e) => ({ ...e, level: 1 }));
  } else if (hasLevel1 && !hasLevel2) {
    // All level 1 → each is a module, we'll split content into lessons per module
  }

  // Flatten all blocks (excluding TOC itself) and split by matching TOC titles
  const allBlocks = sections.flat();
  const tocEndIdx = findTOCEndIndex(allBlocks);
  const contentBlocks = allBlocks.slice(tocEndIdx);

  // Match TOC entries to positions in content
  const matched = matchTOCToContent(toc, contentBlocks);

  // Build modules from matched structure
  const modules: ModuleDefinition[] = [];
  let currentModule: ModuleDefinition | null = null;

  for (const item of matched) {
    if (item.tocEntry.level === 1) {
      if (currentModule) {
        if (currentModule.lessons.length === 0) {
          currentModule.lessons.push({ title: "개요", blocks: item.blocks });
        }
        modules.push(currentModule);
      }
      currentModule = { title: item.tocEntry.title, lessons: [] };

      // If this is a level-1 only TOC, add content as single lesson
      if (!hasLevel2 && item.blocks.length > 0) {
        currentModule.lessons.push({
          title: item.tocEntry.title,
          blocks: item.blocks,
        });
      }
    } else {
      // Level 2 → lesson
      if (!currentModule) {
        currentModule = { title: cleanFileName(fileName), lessons: [] };
      }
      currentModule.lessons.push({
        title: item.tocEntry.title,
        blocks: item.blocks,
      });
    }
  }

  if (currentModule) {
    if (currentModule.lessons.length === 0) {
      currentModule.lessons.push({ title: "레슨 1", blocks: [] });
    }
    modules.push(currentModule);
  }

  return modules.length > 0
    ? modules
    : [{ title: cleanFileName(fileName), lessons: [{ title: "레슨 1", blocks: [] }] }];
}

/**
 * TOC 영역이 끝나는 블록 인덱스를 찾는다
 */
function findTOCEndIndex(blocks: Block[]): number {
  const tocPatterns = [
    /^#{1,3}\s*(목차|차례|table\s+of\s+contents|contents|toc)\s*$/im,
    /^(목차|차례|table\s+of\s+contents|contents)\s*$/im,
  ];

  let tocBlockIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (!isTextBlock(blocks[i])) continue;
    const text = blockText(blocks[i]).trim();
    if (!text) continue;
    if (tocPatterns.some((p) => p.test(text))) {
      tocBlockIdx = i;
      break;
    }
  }

  if (tocBlockIdx === -1) return 0;

  // Skip forward past consecutive TOC-like blocks
  for (let i = tocBlockIdx + 1; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === "divider") return i + 1;
    if (!isTextBlock(block)) return i;

    const text = blockText(block).trim();
    const lines = text.split("\n");
    const tocLineCount = lines.filter((l) => parseTOCLine(l) !== null).length;
    const totalNonEmpty = lines.filter((l) => l.trim().length > 0).length;

    // If less than half the lines look like TOC entries, we've left the TOC
    if (totalNonEmpty > 0 && tocLineCount / totalNonEmpty < 0.5) {
      return i;
    }
  }

  return tocBlockIdx + 1;
}

interface MatchedTOCItem {
  tocEntry: TOCEntry;
  blocks: Block[];
}

/**
 * TOC 항목들을 본문 블록에서 매칭하여 각 항목에 해당하는 블록 범위를 배정
 */
function matchTOCToContent(toc: TOCEntry[], blocks: Block[]): MatchedTOCItem[] {
  // For each TOC entry, find the block index where its title appears as a heading
  const positions: { tocIdx: number; blockIdx: number }[] = [];

  for (let ti = 0; ti < toc.length; ti++) {
    const entry = toc[ti];
    const normalizedTitle = normalizeForMatch(entry.title);

    for (let bi = 0; bi < blocks.length; bi++) {
      if (!isTextBlock(blocks[bi])) continue;
      const text = blockText(blocks[bi]).trim();
      const lines = text.split("\n");

      for (const line of lines) {
        // Strip markdown heading markers
        const clean = line.replace(/^#{1,6}\s+/, "").trim();
        if (normalizeForMatch(clean) === normalizedTitle) {
          positions.push({ tocIdx: ti, blockIdx: bi });
          break;
        }
        // Also try matching with number prefix stripped
        const withoutNum = clean.replace(/^\d+[.)]\s*/, "").replace(/^제\s*\d+\s*(장|부|편|절|과)\s*[.:：]?\s*/, "").trim();
        if (withoutNum && normalizeForMatch(withoutNum) === normalizedTitle) {
          positions.push({ tocIdx: ti, blockIdx: bi });
          break;
        }
      }
      if (positions.length > ti && positions[positions.length - 1].tocIdx === ti) break;
    }
  }

  // Build result: each TOC entry gets blocks from its position to the next
  const result: MatchedTOCItem[] = [];

  // Sort positions by block index
  positions.sort((a, b) => a.blockIdx - b.blockIdx);

  // Create a map from tocIdx to blockIdx for quick lookup
  const tocToBlock = new Map<number, number>();
  for (const p of positions) {
    if (!tocToBlock.has(p.tocIdx)) {
      tocToBlock.set(p.tocIdx, p.blockIdx);
    }
  }

  // Assign blocks to each TOC entry
  for (let ti = 0; ti < toc.length; ti++) {
    const startBlock = tocToBlock.get(ti);

    if (startBlock === undefined) {
      // TOC entry not found in content — create empty lesson
      result.push({ tocEntry: toc[ti], blocks: [] });
      continue;
    }

    // Find the next matched TOC entry's block index
    let endBlock = blocks.length;
    for (let nextTi = ti + 1; nextTi < toc.length; nextTi++) {
      const nextStart = tocToBlock.get(nextTi);
      if (nextStart !== undefined) {
        endBlock = nextStart;
        break;
      }
    }

    result.push({
      tocEntry: toc[ti],
      blocks: blocks.slice(startBlock, endBlock),
    });
  }

  // If no positions matched at all, distribute blocks evenly
  if (positions.length === 0) {
    const blocksPerEntry = Math.max(1, Math.ceil(blocks.length / toc.length));
    for (let ti = 0; ti < toc.length; ti++) {
      const start = ti * blocksPerEntry;
      const end = Math.min(start + blocksPerEntry, blocks.length);
      result.push({ tocEntry: toc[ti], blocks: blocks.slice(start, end) });
    }
  }

  return result;
}

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[\s.,;:!?·…\-—–_'"'"()[\]{}]/g, "").trim();
}

// ── Concept-based structure (no TOC) ──

/**
 * 큰 개념 기반으로 모듈/레슨 구조 생성
 * 헤딩 계층이 있으면 활용, 없으면 내용의 의미 단위로 그룹핑
 */
function buildFromConcepts(
  sections: Block[][],
  fileName: string
): ModuleDefinition[] {
  // Re-split all blocks by headings instead of dividers for better semantic grouping
  const allBlocks = sections.flat();
  const headings = extractAllHeadings(allBlocks);

  // If there are clear heading levels, use heading-based grouping
  const h1Count = headings.filter((h) => h.level === 1).length;
  const h2Count = headings.filter((h) => h.level === 2).length;

  if (h1Count >= 2) {
    // H1 headings define modules, H2+ define lessons
    return groupByHeadingHierarchy(allBlocks, fileName);
  }

  if (h2Count >= 2) {
    // Only H2 headings: each H2 is a concept → group into modules
    return groupByH2Concepts(allBlocks, fileName);
  }

  // No clear heading hierarchy: use paragraph-based concept detection
  return groupByContentConcepts(sections, fileName);
}

interface HeadingInfo {
  level: number; // 1-6
  title: string;
  blockIndex: number;
  lineIndex: number;
}

function extractAllHeadings(blocks: Block[]): HeadingInfo[] {
  const headings: HeadingInfo[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    if (!isTextBlock(blocks[bi])) continue;
    const text = blockText(blocks[bi]);
    const lines = text.split("\n");

    for (let li = 0; li < lines.length; li++) {
      const match = lines[li].match(/^(#{1,6})\s+(.+)/);
      if (match) {
        headings.push({
          level: match[1].length,
          title: match[2].trim(),
          blockIndex: bi,
          lineIndex: li,
        });
      }
    }
  }

  return headings;
}

/**
 * H1 → 모듈, H2+ → 레슨으로 그룹핑
 */
function groupByHeadingHierarchy(
  blocks: Block[],
  fileName: string
): ModuleDefinition[] {
  const headings = extractAllHeadings(blocks);
  const h1Headings = headings.filter((h) => h.level === 1);
  const modules: ModuleDefinition[] = [];

  for (let mi = 0; mi < h1Headings.length; mi++) {
    const h1 = h1Headings[mi];
    const nextH1 = h1Headings[mi + 1];

    // Find all sub-headings (H2+) between this H1 and the next
    const subHeadings = headings.filter((h) => {
      if (h.level <= 1) return false;
      if (h.blockIndex < h1.blockIndex) return false;
      if (h.blockIndex === h1.blockIndex && h.lineIndex <= h1.lineIndex) return false;
      if (nextH1) {
        if (h.blockIndex > nextH1.blockIndex) return false;
        if (h.blockIndex === nextH1.blockIndex && h.lineIndex >= nextH1.lineIndex) return false;
      }
      return true;
    });

    // Determine block range for this module
    const startBlockIdx = h1.blockIndex;
    const endBlockIdx = nextH1 ? nextH1.blockIndex : blocks.length;
    const moduleBlocks = blocks.slice(startBlockIdx, endBlockIdx);

    const lessons: LessonDefinition[] = [];

    if (subHeadings.length > 0) {
      // Each sub-heading defines a lesson
      for (let si = 0; si < subHeadings.length; si++) {
        const sub = subHeadings[si];
        const nextSub = subHeadings[si + 1];

        const lessonStart = sub.blockIndex;
        const lessonEnd = nextSub
          ? nextSub.blockIndex
          : endBlockIdx;

        lessons.push({
          title: sub.title,
          blocks: blocks.slice(lessonStart, lessonEnd),
        });
      }

      // Content between H1 and first H2 → "개요" lesson
      const firstSub = subHeadings[0];
      if (firstSub.blockIndex > startBlockIdx + 1 ||
        (firstSub.blockIndex === startBlockIdx && firstSub.lineIndex > 0)) {
        const introBlocks = blocks.slice(startBlockIdx, firstSub.blockIndex);
        const cleanedIntro = removeLeadingHeading(introBlocks);
        if (cleanedIntro.length > 0) {
          lessons.unshift({ title: "개요", blocks: cleanedIntro });
        }
      }
    } else {
      // No sub-headings: the whole section is one lesson
      const cleanedBlocks = removeLeadingHeading(moduleBlocks);
      lessons.push({
        title: h1.title,
        blocks: cleanedBlocks.length > 0 ? cleanedBlocks : moduleBlocks,
      });
    }

    modules.push({ title: h1.title, lessons });
  }

  // Handle content before the first H1
  if (h1Headings.length > 0 && h1Headings[0].blockIndex > 0) {
    const preBlocks = blocks.slice(0, h1Headings[0].blockIndex);
    if (preBlocks.length > 0) {
      const preTitle = extractSectionTitle(preBlocks, 0) || "서론";
      modules.unshift({
        title: preTitle,
        lessons: [{ title: preTitle, blocks: preBlocks }],
      });
    }
  }

  return modules.length > 0
    ? modules
    : [{ title: cleanFileName(fileName), lessons: [{ title: "레슨 1", blocks: [] }] }];
}

/**
 * H2 헤딩 기반으로 큰 개념 단위 그룹핑
 * H2 → 레슨, 3~5개의 레슨을 하나의 모듈로 묶음
 */
function groupByH2Concepts(
  blocks: Block[],
  fileName: string
): ModuleDefinition[] {
  const headings = extractAllHeadings(blocks).filter((h) => h.level === 2);
  const lessons: LessonDefinition[] = [];

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const next = headings[i + 1];
    const startIdx = h.blockIndex;
    const endIdx = next ? next.blockIndex : blocks.length;

    lessons.push({
      title: h.title,
      blocks: blocks.slice(startIdx, endIdx),
    });
  }

  // Content before the first H2
  if (headings.length > 0 && headings[0].blockIndex > 0) {
    const preBlocks = blocks.slice(0, headings[0].blockIndex);
    if (preBlocks.length > 0) {
      const preTitle = extractSectionTitle(preBlocks, 0) || "서론";
      lessons.unshift({ title: preTitle, blocks: preBlocks });
    }
  }

  if (lessons.length === 0) {
    return [{ title: cleanFileName(fileName), lessons: [{ title: "레슨 1", blocks: [] }] }];
  }

  // Group lessons into modules of 3-5
  return groupLessonsIntoModules(lessons, fileName);
}

/**
 * 헤딩이 없을 때 내용 기반으로 개념 단위 그룹핑
 * - 빈 줄/divider로 구분된 섹션을 레슨으로
 * - 내용 길이와 주제 전환을 기준으로 모듈 경계 설정
 */
function groupByContentConcepts(
  sections: Block[][],
  fileName: string
): ModuleDefinition[] {
  // Each section becomes a lesson
  const lessons: LessonDefinition[] = sections.map((blocks, idx) => ({
    title: extractSectionTitle(blocks, idx + 1),
    blocks,
  }));

  if (lessons.length <= 1) {
    // Single section: try to split by paragraph groups
    const allBlocks = sections.flat();
    const splitLessons = splitByParagraphGroups(allBlocks);
    if (splitLessons.length > 1) {
      return groupLessonsIntoModules(splitLessons, fileName);
    }
    return [{
      title: cleanFileName(fileName),
      lessons: lessons.length > 0 ? lessons : [{ title: "레슨 1", blocks: [] }],
    }];
  }

  return groupLessonsIntoModules(lessons, fileName);
}

/**
 * 긴 텍스트를 단락 그룹으로 나누어 레슨 생성
 * 빈 줄이 2개 이상이거나 주제 전환이 감지되면 분할
 */
function splitByParagraphGroups(blocks: Block[]): LessonDefinition[] {
  if (blocks.length <= 3) {
    return [{ title: extractSectionTitle(blocks, 1), blocks }];
  }

  const lessons: LessonDefinition[] = [];
  let current: Block[] = [];
  let totalTextLength = 0;

  for (const block of blocks) {
    if (isTextBlock(block)) {
      totalTextLength += blockText(block).length;
    }
  }

  // Target ~500-1000 chars per lesson for meaningful splits
  const targetCharsPerLesson = Math.max(500, Math.min(1500, totalTextLength / 5));
  let currentChars = 0;

  for (const block of blocks) {
    current.push(block);

    if (isTextBlock(block)) {
      currentChars += blockText(block).length;
    }

    // Split when we reach target size at a natural boundary
    if (currentChars >= targetCharsPerLesson && current.length >= 2) {
      lessons.push({
        title: extractSectionTitle(current, lessons.length + 1),
        blocks: [...current],
      });
      current = [];
      currentChars = 0;
    }
  }

  if (current.length > 0) {
    lessons.push({
      title: extractSectionTitle(current, lessons.length + 1),
      blocks: current,
    });
  }

  return lessons;
}

/**
 * 레슨 목록을 3~5개씩 모듈로 묶기
 * 모듈 제목은 첫 번째 레슨의 상위 개념으로 생성
 */
function groupLessonsIntoModules(
  lessons: LessonDefinition[],
  fileName: string
): ModuleDefinition[] {
  if (lessons.length <= 5) {
    return [{
      title: cleanFileName(fileName),
      lessons,
    }];
  }

  const modules: ModuleDefinition[] = [];
  const targetModules = Math.ceil(lessons.length / 4);
  const lessonsPerModule = Math.ceil(lessons.length / targetModules);

  for (let i = 0; i < lessons.length; i += lessonsPerModule) {
    const chunk = lessons.slice(i, i + lessonsPerModule);
    const moduleIdx = modules.length + 1;

    // Use the first lesson's title as a hint for the module name
    const firstTitle = chunk[0].title;
    const moduleTitle = lessons.length > 8
      ? `${cleanFileName(fileName)} - ${moduleIdx}부`
      : firstTitle;

    modules.push({ title: moduleTitle, lessons: chunk });
  }

  return modules;
}

/**
 * 섹션에서 제목 추출
 */
function extractSectionTitle(blocks: Block[], fallbackIndex: number): string {
  for (const block of blocks) {
    if (!isTextBlock(block)) continue;
    const text = blockText(block).trim();
    if (!text) continue;

    // Check for markdown headings
    const headingMatch = text.match(/^#{1,6}\s+(.+)/m);
    if (headingMatch) {
      return headingMatch[1].trim().slice(0, 50);
    }

    // Use first non-empty line as title
    const firstLine = text.split("\n")[0]?.trim();
    if (firstLine && firstLine.length <= 60) {
      return firstLine;
    }
    if (firstLine) {
      return firstLine.slice(0, 50) + "…";
    }
  }

  return `레슨 ${fallbackIndex}`;
}

/**
 * 블록 배열에서 첫 번째 헤딩 라인 제거
 */
function removeLeadingHeading(blocks: Block[]): Block[] {
  if (blocks.length === 0) return [];

  const first = blocks[0];
  if (!isTextBlock(first)) return blocks;

  const text = blockText(first).trim();
  if (!text) return blocks.slice(1);

  const lines = text.split("\n");
  if (/^#{1,6}\s+/.test(lines[0])) {
    const remaining = lines.slice(1).join("\n").trim();
    if (!remaining) return blocks.slice(1);
    return [
      { ...first, content: { ...first.content, text: remaining } } as Block,
      ...blocks.slice(1),
    ];
  }

  return blocks;
}

/**
 * 파일명에서 확장자 제거하고 제목으로 사용
 */
function cleanFileName(name: string): string {
  return name.replace(/\.[^.]+$/, "").trim() || "가져온 내용";
}
