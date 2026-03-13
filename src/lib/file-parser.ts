import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import type { Block } from "@/types/block";
import type {
  Slide,
  SlideElement,
  ElementTextContent,
  ElementImageContent,
  ElementCodeContent,
  TextRole,
} from "@/types/slide";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * PDF → Block[] 변환
 * 페이지 단위로 블록 분리, 페이지 경계를 divider로 활용
 */
export async function parsePDF(buffer: Buffer): Promise<Block[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (
    buf: Buffer,
    opts?: { pagerender?: (pageData: { getTextContent: () => Promise<{ items: { str: string; transform: number[] }[] }> }) => Promise<string> }
  ) => Promise<{ text: string; numpages: number }>;

  // Custom page renderer that adds page markers
  const PAGE_MARKER = "\n\n===PAGE_BREAK===\n\n";
  const data = await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent();
      const strings = textContent.items.map((item) => item.str);
      return strings.join("") + PAGE_MARKER;
    },
  });
  const text = data.text.trim();

  if (!text) {
    return [
      {
        id: uuidv4(),
        type: "text",
        content: { text: "(PDF에서 텍스트를 추출할 수 없습니다)", format: "plain" },
        order: 0,
      },
    ];
  }

  // Split by page markers
  const pages = text
    .split("===PAGE_BREAK===")
    .map((p) => p.trim())
    .filter(Boolean);

  if (pages.length <= 1) {
    // Single page or no page markers: use text-based splitting
    return splitTextToBlocks(text.replace(/===PAGE_BREAK===/g, "\n\n"));
  }

  // Multi-page: one block per page with dividers between
  const blocks: Block[] = [];
  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i];
    if (!pageText) continue;

    // Try to detect a heading-like first line
    const lines = pageText.split("\n").filter(Boolean);
    const firstLine = lines[0]?.trim() || "";
    const isShortTitle = firstLine.length < 80 && lines.length > 1;

    if (isShortTitle) {
      blocks.push({
        id: uuidv4(),
        type: "text",
        content: {
          text: `## ${firstLine}\n\n${lines.slice(1).join("\n")}`,
          format: "markdown",
        },
        order: blocks.length,
      });
    } else {
      blocks.push({
        id: uuidv4(),
        type: "text",
        content: { text: pageText, format: "markdown" },
        order: blocks.length,
      });
    }

    // Add divider between pages
    if (i < pages.length - 1) {
      blocks.push({
        id: uuidv4(),
        type: "divider",
        content: {} as Record<string, never>,
        order: blocks.length,
      });
    }
  }

  return blocks.length > 0
    ? blocks
    : [
        {
          id: uuidv4(),
          type: "text",
          content: { text, format: "plain" },
          order: 0,
        },
      ];
}

/**
 * DOCX → Block[] 변환
 * mammoth의 convertToHtml을 사용하여 서식 보존 후 마크다운으로 변환
 */
export async function parseDOCX(buffer: Buffer): Promise<Block[]> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value.trim();

  if (!html) {
    return [
      {
        id: uuidv4(),
        type: "text",
        content: { text: "(DOCX에서 텍스트를 추출할 수 없습니다)", format: "plain" },
        order: 0,
      },
    ];
  }

  // Convert HTML to markdown-like text
  const markdown = htmlToMarkdown(html);
  return splitMarkdownToBlocks(markdown);
}

/**
 * Simple HTML → Markdown converter for mammoth output
 */
function htmlToMarkdown(html: string): string {
  let md = html;

  // Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `# ${stripTags(c).trim()}\n\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `## ${stripTags(c).trim()}\n\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `### ${stripTags(c).trim()}\n\n`);
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `#### ${stripTags(c).trim()}\n\n`);
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, c) => `##### ${stripTags(c).trim()}\n\n`);
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, c) => `###### ${stripTags(c).trim()}\n\n`);

  // Bold and italic
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");
  md = md.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, "$1");

  // Links
  md = md.replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Images
  md = md.replace(/<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)");
  md = md.replace(/<img[^>]+src="([^"]*)"[^>]*\/?>/gi, "![]($1)");

  // Lists: process before removing other tags
  // Ordered lists
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    let idx = 0;
    return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, li: string) => {
      idx++;
      return `${idx}. ${stripTags(li).trim()}\n`;
    }) + "\n";
  });
  // Unordered lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, li: string) => {
      return `- ${stripTags(li).trim()}\n`;
    }) + "\n";
  });

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => {
    return stripTags(c)
      .trim()
      .split("\n")
      .map((l: string) => `> ${l}`)
      .join("\n") + "\n\n";
  });

  // Code blocks
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, c) => {
    return "```\n" + decodeHtmlEntities(c).trim() + "\n```\n\n";
  });
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // Tables → markdown tables
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows: string[][] = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(tableContent)) !== null) {
      const cells: string[] = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
        cells.push(stripTags(cellMatch[1]).trim());
      }
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length === 0) return "";
    const maxCols = Math.max(...rows.map((r) => r.length));
    const normalized = rows.map((r) => {
      while (r.length < maxCols) r.push("");
      return r;
    });
    let table = "| " + normalized[0].join(" | ") + " |\n";
    table += "| " + normalized[0].map(() => "---").join(" | ") + " |\n";
    for (let i = 1; i < normalized.length; i++) {
      table += "| " + normalized[i].join(" | ") + " |\n";
    }
    return table + "\n";
  });

  // Paragraphs and line breaks
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<\/p>/gi, "\n\n");
  md = md.replace(/<p[^>]*>/gi, "");

  // Horizontal rules
  md = md.replace(/<hr\s*\/?>/gi, "\n---\n\n");

  // Strip remaining tags
  md = stripTags(md);

  // Decode HTML entities
  md = decodeHtmlEntities(md);

  // Clean up excessive whitespace
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

/**
 * PPTX → Block[] 변환
 * 슬라이드별 구조화: 제목/본문 분리, 이미지 추출, 노트 추출
 */
export async function parsePPTX(buffer: Buffer): Promise<Block[]> {
  const blocks: Block[] = [];

  try {
    const entries = await extractZipEntries(buffer);

    // Build media map: path → buffer (for image extraction)
    const mediaMap = new Map<string, Buffer>();
    for (const entry of entries) {
      if (entry.name.startsWith("ppt/media/")) {
        mediaMap.set(entry.name, entry.data);
      }
    }

    // Extract slide entries sorted by number
    const slideEntries = entries
      .filter(
        (e) =>
          e.name.startsWith("ppt/slides/slide") &&
          e.name.endsWith(".xml") &&
          !e.name.includes("Layout") &&
          !e.name.includes("Master")
      )
      .sort((a, b) => {
        const numA = parseInt(a.name.match(/slide(\d+)/)?.[1] || "0");
        const numB = parseInt(b.name.match(/slide(\d+)/)?.[1] || "0");
        return numA - numB;
      });

    // Build rels map per slide
    const relsMap = new Map<string, Map<string, string>>();
    for (const entry of entries) {
      const relsMatch = entry.name.match(
        /ppt\/slides\/_rels\/(slide\d+)\.xml\.rels$/
      );
      if (relsMatch) {
        const slideName = relsMatch[1];
        const rels = parseRelationships(entry.data.toString("utf-8"));
        relsMap.set(slideName, rels);
      }
    }

    // Build notes map
    const notesMap = new Map<number, string>();
    const noteEntries = entries.filter(
      (e) =>
        e.name.startsWith("ppt/notesSlides/notesSlide") &&
        e.name.endsWith(".xml")
    );
    for (const note of noteEntries) {
      const noteNum = parseInt(note.name.match(/notesSlide(\d+)/)?.[1] || "0");
      if (noteNum > 0) {
        const noteXml = note.data.toString("utf-8");
        const noteTexts = extractTextFromXML(noteXml);
        const noteContent = noteTexts
          .filter((t) => t && !/^\d+$/.test(t.trim()))
          .join("\n")
          .trim();
        if (noteContent) {
          notesMap.set(noteNum, noteContent);
        }
      }
    }

    // Ensure uploads dir exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    for (let i = 0; i < slideEntries.length; i++) {
      const slideName =
        slideEntries[i].name.match(/(slide\d+)/)?.[1] || `slide${i + 1}`;
      const slideNum = parseInt(slideName.replace("slide", ""));
      const xml = slideEntries[i].data.toString("utf-8");

      // Extract structured text
      const { title, bodyTexts } = extractSlideStructure(xml);
      const notes = notesMap.get(slideNum);

      // Extract and save images for this slide
      const slideRels = relsMap.get(slideName);
      const imageUrls = await extractAndSaveSlideImages(
        xml,
        slideRels,
        mediaMap
      );

      const hasContent =
        title || bodyTexts.length > 0 || imageUrls.length > 0;
      if (!hasContent) continue;

      // Build text content
      let md = "";
      if (title) {
        md = `## ${title}`;
      }
      if (bodyTexts.length > 0) {
        const body = bodyTexts.join("\n\n");
        md = md ? `${md}\n\n${body}` : body;
      }
      if (notes) {
        md += `\n\n> 노트: ${notes}`;
      }

      // Add text block if there's text
      if (md) {
        blocks.push({
          id: uuidv4(),
          type: "text",
          content: { text: md, format: "markdown" },
          order: blocks.length,
        });
      }

      // Add image blocks
      for (const imgUrl of imageUrls) {
        blocks.push({
          id: uuidv4(),
          type: "image",
          content: {
            url: imgUrl.url,
            alt: imgUrl.alt || `슬라이드 ${slideNum} 이미지`,
          },
          order: blocks.length,
        });
      }

      // Add divider between slides
      if (i < slideEntries.length - 1) {
        blocks.push({
          id: uuidv4(),
          type: "divider",
          content: {} as Record<string, never>,
          order: blocks.length,
        });
      }
    }

    if (blocks.length === 0) {
      blocks.push({
        id: uuidv4(),
        type: "text",
        content: {
          text: "(PPTX에서 콘텐츠를 추출할 수 없습니다)",
          format: "plain",
        },
        order: 0,
      });
    }
  } catch (err) {
    console.error("PPTX parse error:", err);
    blocks.push({
      id: uuidv4(),
      type: "text",
      content: { text: "(PPTX 파싱 중 오류가 발생했습니다)", format: "plain" },
      order: 0,
    });
  }

  return blocks;
}

/**
 * PPTX → Slide[] 변환 (위치, 크기, 폰트, 색상 등 모든 서식 보존)
 * SlideElement를 직접 생성하여 원본 레이아웃을 최대한 유지
 */
export async function parsePPTXToSlides(buffer: Buffer): Promise<Slide[]> {
  const slides: Slide[] = [];

  try {
    const entries = await extractZipEntries(buffer);

    // Read slide dimensions from presentation.xml
    let slideWidthEmu = 12192000; // default 16:9
    let slideHeightEmu = 6858000;
    const presEntry = entries.find((e) => e.name === "ppt/presentation.xml");
    if (presEntry) {
      const presXml = presEntry.data.toString("utf-8");
      const sldSzMatch = presXml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
      if (sldSzMatch) {
        slideWidthEmu = parseInt(sldSzMatch[1]);
        slideHeightEmu = parseInt(sldSzMatch[2]);
      }
    }

    // Build media map
    const mediaMap = new Map<string, Buffer>();
    for (const entry of entries) {
      if (entry.name.startsWith("ppt/media/")) {
        mediaMap.set(entry.name, entry.data);
      }
    }

    // Build rels map per slide
    const relsMap = new Map<string, Map<string, string>>();
    for (const entry of entries) {
      const relsMatch = entry.name.match(/ppt\/slides\/_rels\/(slide\d+)\.xml\.rels$/);
      if (relsMatch) {
        relsMap.set(relsMatch[1], parseRelationships(entry.data.toString("utf-8")));
      }
    }

    // Build notes map
    const notesMap = new Map<number, string>();
    for (const entry of entries) {
      const noteMatch = entry.name.match(/ppt\/notesSlides\/notesSlide(\d+)\.xml$/);
      if (noteMatch) {
        const noteNum = parseInt(noteMatch[1]);
        const noteXml = entry.data.toString("utf-8");
        const noteTexts = extractTextFromXML(noteXml);
        const noteContent = noteTexts
          .filter((t) => t && !/^\d+$/.test(t.trim()))
          .join("\n")
          .trim();
        if (noteContent) notesMap.set(noteNum, noteContent);
      }
    }

    // Extract slide entries sorted by number
    const slideEntries = entries
      .filter(
        (e) =>
          e.name.startsWith("ppt/slides/slide") &&
          e.name.endsWith(".xml") &&
          !e.name.includes("Layout") &&
          !e.name.includes("Master")
      )
      .sort((a, b) => {
        const numA = parseInt(a.name.match(/slide(\d+)/)?.[1] || "0");
        const numB = parseInt(b.name.match(/slide(\d+)/)?.[1] || "0");
        return numA - numB;
      });

    await mkdir(UPLOAD_DIR, { recursive: true });

    // Helper: EMU → canvas coordinates (960×540)
    const emuToX = (emu: number) => Math.round((emu / slideWidthEmu) * 960);
    const emuToY = (emu: number) => Math.round((emu / slideHeightEmu) * 540);
    // Font: hundredths of pt → px (1pt = 4/3 px, exact fraction)
    const szToPx = (sz: number) => Math.round((sz / 100) * (4 / 3));

    for (let i = 0; i < slideEntries.length; i++) {
      const slideName = slideEntries[i].name.match(/(slide\d+)/)?.[1] || `slide${i + 1}`;
      const slideNum = parseInt(slideName.replace("slide", ""));
      const xml = slideEntries[i].data.toString("utf-8");
      const slideRels = relsMap.get(slideName);
      const notes = notesMap.get(slideNum);

      const elements: SlideElement[] = [];
      let zIndex = 1;

      // Extract each shape <p:sp>
      const shapeRegex = /<p:sp\b[\s\S]*?<\/p:sp>/g;
      let shapeMatch;

      while ((shapeMatch = shapeRegex.exec(xml)) !== null) {
        const shape = shapeMatch[0];

        // Extract transform (position + size)
        const xfrmMatch = shape.match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
        if (!xfrmMatch) continue;

        const xfrm = xfrmMatch[0];
        const offMatch = xfrm.match(/<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"/);
        const extMatch = xfrm.match(/<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
        if (!offMatch || !extMatch) continue;

        const x = emuToX(parseInt(offMatch[1]));
        const y = emuToY(parseInt(offMatch[2]));
        const width = emuToX(parseInt(extMatch[1]));
        const height = emuToY(parseInt(extMatch[2]));

        // Skip tiny or zero-size shapes
        if (width < 10 || height < 10) continue;

        // Extract rotation (in 60000ths of a degree)
        const rotMatch = xfrm.match(/rot="(-?\d+)"/);
        const rotation = rotMatch ? Math.round(parseInt(rotMatch[1]) / 60000) : 0;

        // Extract placeholder role (title/subtitle/body/pageNumber/other)
        const placeholderRole = extractPlaceholderRole(shape);

        // Extract text runs from shape
        const paragraphs = extractShapeParagraphs(shape);

        // Check if this shape has an image (blip)
        const blipMatch = shape.match(/<a:blip[^>]*r:embed="([^"]+)"/);

        if (blipMatch && slideRels) {
          // Image element
          const rId = blipMatch[1];
          const mediaPath = slideRels.get(rId);
          if (mediaPath) {
            const mediaBuffer = mediaMap.get(mediaPath);
            if (mediaBuffer) {
              const ext = path.extname(mediaPath).toLowerCase();
              if (ext !== ".emf" && ext !== ".wmf") {
                const filename = `${uuidv4()}${ext}`;
                const filepath = path.join(UPLOAD_DIR, filename);
                try {
                  await writeFile(filepath, mediaBuffer);
                  elements.push({
                    id: uuidv4(),
                    type: "image",
                    x, y, width, height, rotation,
                    zIndex: zIndex++,
                    style: {},
                    content: {
                      imageUrl: `/api/upload/${filename}`,
                      imageAlt: path.basename(mediaPath, ext),
                    } as ElementImageContent,
                  });
                } catch { /* skip */ }
              }
            }
          }
        } else if (paragraphs.length > 0) {
          // Text element — combine all paragraphs
          const allText = paragraphs.map((p) => p.text).join("\n");
          if (!allText.trim()) continue;

          // Use first paragraph's formatting as the element's formatting
          const firstPara = paragraphs[0];
          const fontSize = firstPara.fontSize || 24;

          // Ensure height is large enough for text content + padding (8px * 2)
          const lineCount = allText.split("\n").length;
          const lineHeight = 1.4;
          const padding = 16; // 8px top + 8px bottom padding in TextElement
          const minTextHeight = Math.ceil(fontSize * lineHeight * lineCount) + padding;
          const finalHeight = Math.max(height, minTextHeight);

          const textElement: SlideElement = {
            id: uuidv4(),
            type: "text",
            x, y, width, height: finalHeight, rotation,
            zIndex: zIndex++,
            style: {},
            content: {
              text: allText,
              fontSize,
              fontFamily: firstPara.fontFamily || undefined,
              fontWeight: firstPara.bold ? "bold" : "normal",
              fontStyle: firstPara.italic ? "italic" : "normal",
              textDecoration: firstPara.underline ? "underline" : "none",
              textAlign: firstPara.align || "left",
              verticalAlign: "top",
              color: firstPara.color || "#171717",
              lineHeight: lineHeight,
              textRole: placeholderRole,
            } as ElementTextContent,
          };

          // If no explicit placeholder role, infer from position/size/font
          if (!placeholderRole) {
            (textElement.content as ElementTextContent).textRole =
              inferPlaceholderFromHeuristics(textElement);
          }

          elements.push(textElement);
        }
      }

      // Also extract picture frames <p:pic>
      const picRegex = /<p:pic\b[\s\S]*?<\/p:pic>/g;
      let picMatch;

      while ((picMatch = picRegex.exec(xml)) !== null) {
        const pic = picMatch[0];

        const xfrmMatch = pic.match(/<a:xfrm[^>]*>([\s\S]*?)<\/a:xfrm>/);
        if (!xfrmMatch) continue;
        const xfrm = xfrmMatch[0];
        const offMatch = xfrm.match(/<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"/);
        const extMatch = xfrm.match(/<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
        if (!offMatch || !extMatch) continue;

        const x = emuToX(parseInt(offMatch[1]));
        const y = emuToY(parseInt(offMatch[2]));
        const width = emuToX(parseInt(extMatch[1]));
        const height = emuToY(parseInt(extMatch[2]));
        const rotMatch = xfrm.match(/rot="(-?\d+)"/);
        const rotation = rotMatch ? Math.round(parseInt(rotMatch[1]) / 60000) : 0;

        const blipMatch = pic.match(/<a:blip[^>]*r:embed="([^"]+)"/);
        if (blipMatch && slideRels) {
          const rId = blipMatch[1];
          const mediaPath = slideRels.get(rId);
          if (mediaPath) {
            const mediaBuffer = mediaMap.get(mediaPath);
            if (mediaBuffer) {
              const ext = path.extname(mediaPath).toLowerCase();
              if (ext !== ".emf" && ext !== ".wmf") {
                const filename = `${uuidv4()}${ext}`;
                const filepath = path.join(UPLOAD_DIR, filename);
                try {
                  await writeFile(filepath, mediaBuffer);
                  elements.push({
                    id: uuidv4(),
                    type: "image",
                    x, y, width, height, rotation,
                    zIndex: zIndex++,
                    style: {},
                    content: {
                      imageUrl: `/api/upload/${filename}`,
                      imageAlt: path.basename(mediaPath, ext),
                    } as ElementImageContent,
                  });
                } catch { /* skip */ }
              }
            }
          }
        }
      }

      // Extract slide background color
      // (theme-level bg will be handled separately)

      slides.push({
        id: uuidv4(),
        layoutId: "blank",
        slots: {},
        order: i,
        notes,
        elements,
      });
    }
  } catch (err) {
    console.error("PPTX slide parse error:", err);
  }

  return slides;
}

/**
 * 셰이프 XML에서 단락별 텍스트와 서식 추출
 */
interface ParsedParagraph {
  text: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  align: "left" | "center" | "right";
}

/**
 * PPTX shape XML에서 placeholder type을 추출하여 TextRole로 매핑
 * <p:nvSpPr>/<p:nvPr>/<p:ph type="title|subTitle|body|sldNum|...">
 */
function extractPlaceholderRole(shapeXml: string): TextRole | undefined {
  // Look for <p:ph> element within the shape
  const phMatch = shapeXml.match(/<p:ph\b([^>]*)\/?>/);
  if (!phMatch) return undefined;

  const phAttrs = phMatch[1];

  // Extract type attribute
  const typeMatch = phAttrs.match(/type="([^"]+)"/);
  const phType = typeMatch ? typeMatch[1] : null;

  // Extract idx attribute as fallback
  const idxMatch = phAttrs.match(/idx="(\d+)"/);
  const phIdx = idxMatch ? parseInt(idxMatch[1]) : null;

  if (phType) {
    switch (phType) {
      case "title":
      case "ctrTitle":
        return "title";
      case "subTitle":
        return "subtitle";
      case "body":
      case "obj":
      case "tbl":
      case "chart":
      case "dgm":
      case "clipArt":
        return "body";
      case "sldNum":
        return "pageNumber";
      case "dt":
      case "ftr":
      case "hdr":
        return "other";
      default:
        return "other";
    }
  }

  // No explicit type — use idx convention
  if (phIdx === 0) return "title";
  if (phIdx === 1) return "body";

  return undefined;
}

/**
 * placeholder 정보가 없을 때 위치/크기/폰트로 텍스트 역할 추론
 */
function inferPlaceholderFromHeuristics(el: SlideElement): TextRole {
  const content = el.content as ElementTextContent;
  const { fontSize, fontWeight, text } = content;
  const { x, y, width, height } = el;

  // Page number: small font, short numeric text, edge position
  const isSmall = fontSize <= 14;
  const isShort = text.trim().length <= 5;
  const isNumeric = /^\s*\d{1,4}\s*$/.test(text);
  const isBottom = y + height > 480;
  const isEdge = (x < 80 || x + width > 880) && (isBottom || y < 40);

  if (isNumeric && isSmall) return "pageNumber";
  if (isShort && isSmall && isEdge) return "pageNumber";

  // Title: large font, wide, upper area
  const isLarge = fontSize >= 28;
  const isWide = width > 480;
  const isUpper = y < 190;
  const isBold = fontWeight === "bold";

  if (isLarge && isWide && isUpper) return "title";
  if (fontSize >= 32) return "title";
  if (isLarge && isBold) return "title";

  // Subtitle: medium font, bold, upper-mid area
  const isMedium = fontSize >= 18;
  if (isMedium && isBold && y < 240 && isWide) return "subtitle";
  if (fontSize >= 22 && isBold) return "subtitle";
  if (fontSize >= 20 && isUpper && isWide) return "subtitle";

  // Footer/other: small at bottom
  if (isSmall && isBottom) return "other";

  return "body";
}

function extractShapeParagraphs(shapeXml: string): ParsedParagraph[] {
  const paragraphs: ParsedParagraph[] = [];
  const paraRegex = /<a:p\b[\s\S]*?<\/a:p>/g;
  let paraMatch;

  while ((paraMatch = paraRegex.exec(shapeXml)) !== null) {
    const para = paraMatch[0];

    // Paragraph alignment
    const alignMatch = para.match(/<a:pPr[^>]*algn="([^"]+)"/);
    const alignMap: Record<string, "left" | "center" | "right"> = {
      l: "left", ctr: "center", r: "right", just: "left",
    };
    const align = alignMap[alignMatch?.[1] || "l"] || "left";

    // Extract text runs
    const runTexts: string[] = [];
    let fontSize = 0;
    let fontFamily = "";
    let bold = false;
    let italic = false;
    let underline = false;
    let color = "";

    // Default run properties from paragraph
    const defRprMatch = para.match(/<a:defRPr[^>]*([^/]*)(?:\/>|>([\s\S]*?)<\/a:defRPr>)/);
    if (defRprMatch) {
      const attrs = defRprMatch[0];
      const szM = attrs.match(/sz="(\d+)"/);
      if (szM) fontSize = Math.round((parseInt(szM[1]) / 100) * (4 / 3));
      if (/\bb="1"/.test(attrs)) bold = true;
      if (/\bi="1"/.test(attrs)) italic = true;
      if (/\bu="sng"/.test(attrs)) underline = true;
      const colorM = attrs.match(/<a:srgbClr val="([^"]+)"/);
      if (colorM) color = `#${colorM[1]}`;
      const fontM = attrs.match(/<a:latin[^>]*typeface="([^"]+)"/);
      if (fontM) fontFamily = fontM[1];
    }

    // Each <a:r> run
    const runRegex = /<a:r>([\s\S]*?)<\/a:r>/g;
    let runMatch;
    while ((runMatch = runRegex.exec(para)) !== null) {
      const run = runMatch[1];

      // Run properties
      const rprMatch = run.match(/<a:rPr[^>]*([^/]*)(?:\/>|>([\s\S]*?)<\/a:rPr>)/);
      if (rprMatch) {
        const rpr = rprMatch[0];
        const szM = rpr.match(/sz="(\d+)"/);
        if (szM && !fontSize) fontSize = Math.round((parseInt(szM[1]) / 100) * (4 / 3));
        if (/\bb="1"/.test(rpr)) bold = true;
        if (/\bi="1"/.test(rpr)) italic = true;
        if (/\bu="sng"/.test(rpr)) underline = true;
        const colorM = rpr.match(/<a:srgbClr val="([^"]+)"/);
        if (colorM && !color) color = `#${colorM[1]}`;
        const fontM = rpr.match(/<a:latin[^>]*typeface="([^"]+)"/);
        if (fontM && !fontFamily) fontFamily = fontM[1];
      }

      // Text content
      const textMatch = run.match(/<a:t>([\s\S]*?)<\/a:t>/);
      if (textMatch) {
        runTexts.push(decodeHtmlEntities(textMatch[1]));
      }
    }

    const text = runTexts.join("");
    if (text.trim()) {
      paragraphs.push({
        text,
        fontSize: fontSize || 24,
        fontFamily,
        bold,
        italic,
        underline,
        color: color || "#171717",
        align,
      });
    }
  }

  return paragraphs;
}

/**
 * _rels XML에서 관계 맵 추출 (rId → media path)
 */
function parseRelationships(relsXml: string): Map<string, string> {
  const map = new Map<string, string>();
  const relRegex =
    /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*>/g;
  let match;
  while ((match = relRegex.exec(relsXml)) !== null) {
    const rId = match[1];
    const target = match[2];
    // Resolve relative paths: ../media/image1.png → ppt/media/image1.png
    if (target.startsWith("../media/")) {
      map.set(rId, `ppt/media/${target.slice(9)}`);
    } else if (target.startsWith("../")) {
      map.set(rId, `ppt/${target.slice(3)}`);
    }
  }
  return map;
}

/**
 * 슬라이드 XML에서 이미지 참조 추출 후 파일로 저장
 */
async function extractAndSaveSlideImages(
  slideXml: string,
  slideRels: Map<string, string> | undefined,
  mediaMap: Map<string, Buffer>
): Promise<{ url: string; alt: string }[]> {
  if (!slideRels) return [];

  const results: { url: string; alt: string }[] = [];

  // Find <a:blip r:embed="rIdN"/> patterns in the slide XML
  const blipRegex = /<a:blip[^>]*r:embed="([^"]+)"[^>]*\/?>/g;
  let match;
  const processedRids = new Set<string>();

  while ((match = blipRegex.exec(slideXml)) !== null) {
    const rId = match[1];
    if (processedRids.has(rId)) continue;
    processedRids.add(rId);

    const mediaPath = slideRels.get(rId);
    if (!mediaPath) continue;

    const mediaBuffer = mediaMap.get(mediaPath);
    if (!mediaBuffer) continue;

    // Determine extension
    const ext = path.extname(mediaPath).toLowerCase();
    // Skip non-web formats (EMF, WMF)
    if (ext === ".emf" || ext === ".wmf") continue;

    // Save to uploads directory
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
      await writeFile(filepath, mediaBuffer);
      results.push({
        url: `/api/upload/${filename}`,
        alt: path.basename(mediaPath, ext),
      });
    } catch {
      // Skip if write fails
    }
  }

  return results;
}

/**
 * Markdown → Block[] 변환
 */
export async function parseMarkdown(text: string): Promise<Block[]> {
  return splitMarkdownToBlocks(text);
}

/**
 * HTML → Block[] 변환
 * HTML을 Markdown으로 변환한 뒤 블록으로 분할
 */
export async function parseHTML(text: string): Promise<Block[]> {
  // Strip <head>/<style>/<script> sections, keep only body content
  let content = text;

  // Extract body content if full HTML document
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  }

  // Remove script and style tags
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<link[^>]*>/gi, "");
  content = content.replace(/<meta[^>]*>/gi, "");

  const markdown = htmlToMarkdown(content);
  return splitMarkdownToBlocks(markdown);
}

/**
 * Plain text → Block[] 변환
 */
export function parsePlainText(text: string): Block[] {
  return splitTextToBlocks(text);
}

// ── Internal helpers ──

/**
 * 긴 텍스트를 빈 줄 기준으로 여러 블록으로 분할
 */
function splitTextToBlocks(text: string): Block[] {
  const sections = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    return [
      {
        id: uuidv4(),
        type: "text",
        content: { text, format: "plain" },
        order: 0,
      },
    ];
  }

  const blocks: Block[] = [];
  let current: string[] = [];
  let lineCount = 0;

  for (const section of sections) {
    const lines = section.split("\n").length;
    if (lineCount + lines > 30 && current.length > 0) {
      blocks.push({
        id: uuidv4(),
        type: "text",
        content: { text: current.join("\n\n"), format: "plain" },
        order: blocks.length,
      });
      current = [];
      lineCount = 0;
    }
    current.push(section);
    lineCount += lines;
  }

  if (current.length > 0) {
    blocks.push({
      id: uuidv4(),
      type: "text",
      content: { text: current.join("\n\n"), format: "plain" },
      order: blocks.length,
    });
  }

  return blocks;
}

/**
 * 마크다운을 헤딩 기준으로 블록으로 분할
 * 코드블록 → code 블록, 이미지 → image 블록, h1-h6 인식
 */
function splitMarkdownToBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.split("\n");
  let current: string[] = [];
  let inCodeBlock = false;
  let codeLang = "";
  let codeLines: string[] = [];

  const flushText = () => {
    const text = current.join("\n").trim();
    if (!text) {
      current = [];
      return;
    }

    // Extract images from text and create separate blocks
    const parts = splitTextAndImages(text);
    for (const part of parts) {
      if (part.type === "image") {
        blocks.push({
          id: uuidv4(),
          type: "image",
          content: {
            url: part.url!,
            alt: part.alt || "",
            caption: part.alt || "",
          },
          order: blocks.length,
        });
      } else if (part.text.trim()) {
        blocks.push({
          id: uuidv4(),
          type: "text",
          content: { text: part.text.trim(), format: "markdown" },
          order: blocks.length,
        });
      }
    }
    current = [];
  };

  for (const line of lines) {
    // Code block fence
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({
          id: uuidv4(),
          type: "code",
          content: {
            code: codeLines.join("\n"),
            language: codeLang || "text",
          },
          order: blocks.length,
        });
        codeLines = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        flushText();
        codeLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Heading-level split (h1-h6)
    if (/^#{1,6}\s/.test(line) && current.length > 0) {
      flushText();
    }

    // Horizontal rule → divider block
    if (/^(---|\*\*\*|___)$/.test(line.trim())) {
      flushText();
      blocks.push({
        id: uuidv4(),
        type: "divider",
        content: {},
        order: blocks.length,
      } as Block);
      continue;
    }

    current.push(line);
  }

  // Handle unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({
      id: uuidv4(),
      type: "code",
      content: { code: codeLines.join("\n"), language: codeLang || "text" },
      order: blocks.length,
    });
  }

  flushText();

  if (blocks.length === 0) {
    blocks.push({
      id: uuidv4(),
      type: "text",
      content: { text: md, format: "markdown" },
      order: 0,
    });
  }

  return blocks;
}

/**
 * 텍스트에서 이미지 구문을 분리하여 텍스트/이미지 파트로 나눔
 */
function splitTextAndImages(
  text: string
): Array<
  { type: "text"; text: string } | { type: "image"; url: string; alt?: string }
> {
  const parts: Array<
    { type: "text"; text: string } | { type: "image"; url: string; alt?: string }
  > = [];
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = imgRegex.exec(text)) !== null) {
    // Text before the image
    const before = text.slice(lastIndex, match.index).trim();
    if (before) {
      parts.push({ type: "text", text: before });
    }
    parts.push({ type: "image", url: match[2], alt: match[1] || undefined });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last image
  const after = text.slice(lastIndex).trim();
  if (after) {
    parts.push({ type: "text", text: after });
  }

  // If no images found, return original text
  if (parts.length === 0) {
    parts.push({ type: "text", text });
  }

  return parts;
}

/**
 * PPTX 슬라이드 XML에서 제목과 본문을 구조적으로 분리
 */
function extractSlideStructure(xml: string): {
  title: string | null;
  bodyTexts: string[];
} {
  let title: string | null = null;
  const bodyTexts: string[] = [];

  // Extract shape trees - each <p:sp> is a shape
  const shapeRegex = /<p:sp\b[\s\S]*?<\/p:sp>/g;
  let shapeMatch;

  while ((shapeMatch = shapeRegex.exec(xml)) !== null) {
    const shape = shapeMatch[0];

    // Check if this is a title placeholder
    const isTitle =
      /<p:ph[^>]*type="(title|ctrTitle)"/.test(shape) ||
      /<p:ph[^>]*idx="0"/.test(shape);

    const texts = extractTextFromXML(shape);
    const content = texts.join(" ").trim();

    if (!content) continue;

    if (isTitle && !title) {
      title = content;
    } else {
      // Combine multi-line shape text with bullet formatting
      const formattedTexts = texts
        .map((t) => t.trim())
        .filter(Boolean);

      if (formattedTexts.length > 1) {
        // Multiple paragraphs in one shape → likely bullet points
        bodyTexts.push(formattedTexts.map((t) => `- ${t}`).join("\n"));
      } else if (formattedTexts.length === 1) {
        bodyTexts.push(formattedTexts[0]);
      }
    }
  }

  // Fallback: if no shapes found, try extracting all text
  if (!title && bodyTexts.length === 0) {
    const allTexts = extractTextFromXML(xml);
    if (allTexts.length > 0) {
      title = allTexts[0];
      if (allTexts.length > 1) {
        bodyTexts.push(...allTexts.slice(1));
      }
    }
  }

  return { title, bodyTexts };
}

/**
 * XML에서 텍스트 노드 추출 (PPTX 슬라이드용)
 */
function extractTextFromXML(xml: string): string[] {
  const texts: string[] = [];

  // Track paragraph boundaries <a:p>
  const paragraphs = xml.split(/<\/a:p>/);
  for (const para of paragraphs) {
    const paraTexts: string[] = [];
    const tRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
    let m;
    while ((m = tRegex.exec(para)) !== null) {
      paraTexts.push(decodeHtmlEntities(m[1]));
    }
    const joined = paraTexts.join("").trim();
    if (joined) {
      texts.push(joined);
    }
  }

  return texts;
}

/**
 * Buffer에서 ZIP 엔트리 추출 (PPTX용)
 */
async function extractZipEntries(
  buffer: Buffer
): Promise<{ name: string; data: Buffer }[]> {
  const entries: { name: string; data: Buffer }[] = [];
  let offset = 0;

  while (offset < buffer.length - 4) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break; // Local file header signature

    const compMethod = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);

    const name = buffer.toString("utf-8", offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;
    const rawData = buffer.subarray(dataStart, dataStart + compSize);

    if (compMethod === 0) {
      entries.push({ name, data: rawData });
    } else if (compMethod === 8) {
      try {
        const { inflateRawSync } = await import("zlib");
        const inflated = inflateRawSync(rawData);
        entries.push({ name, data: inflated });
      } catch {
        // Skip entries that fail to decompress
      }
    }

    offset = dataStart + compSize;
  }

  return entries;
}
