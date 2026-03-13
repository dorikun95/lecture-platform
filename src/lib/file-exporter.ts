import type { Block } from "@/types/block";
import type {
  Presentation,
  SlideElement,
  ElementTextContent,
  ElementCodeContent,
  ElementImageContent,
} from "@/types/slide";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * 로컬 업로드 이미지를 base64 data URI로 변환
 */
async function resolveImageUrl(url: string): Promise<string | null> {
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  // Handle /api/upload/filename paths
  const uploadMatch = url.match(/\/api\/upload\/(.+)$/);
  if (uploadMatch) {
    const filename = uploadMatch[1];
    const filepath = path.join(UPLOAD_DIR, filename);
    try {
      const buf = await readFile(filepath);
      const ext = path.extname(filename).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".bmp": "image/bmp",
      };
      const mime = mimeMap[ext] || "image/png";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Block[] → Markdown 문자열로 변환
 */
export function blocksToMarkdown(blocks: Block[], title?: string): string {
  const parts: string[] = [];

  if (title) {
    parts.push(`# ${title}\n`);
  }

  for (const block of blocks) {
    switch (block.type) {
      case "text":
        parts.push(block.content.text);
        break;

      case "code":
        parts.push(
          `\`\`\`${block.content.language}${block.content.filename ? ` (${block.content.filename})` : ""}\n${block.content.code}\n\`\`\``
        );
        break;

      case "image":
        if (block.content.url) {
          const alt = block.content.alt || block.content.caption || "image";
          parts.push(`![${alt}](${block.content.url})`);
          if (block.content.caption) {
            parts.push(`*${block.content.caption}*`);
          }
        }
        break;

      case "divider":
        parts.push("---");
        break;

      case "video":
        if (block.content.url) {
          parts.push(`[Video](${block.content.url})`);
        }
        break;

      case "quiz":
        parts.push(`**퀴즈: ${block.content.question}**\n`);
        block.content.options.forEach((opt: string, i: number) => {
          const marker = i === block.content.correctIndex ? "✓" : " ";
          parts.push(`${i + 1}. [${marker}] ${opt}`);
        });
        if (block.content.explanation) {
          parts.push(`\n> ${block.content.explanation}`);
        }
        break;

      case "embed":
        if (block.content.url) {
          parts.push(
            `[${block.content.title || "Embed"}](${block.content.url})`
          );
        }
        break;
    }

    parts.push(""); // blank line between blocks
  }

  return parts.join("\n").trim() + "\n";
}

/**
 * Block[] → HTML 문자열로 변환 (PDF 생성용)
 */
export function blocksToHTML(blocks: Block[], title?: string): string {
  const parts: string[] = [];

  parts.push(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; color: #171717; line-height: 1.7; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.02em; }
  h2 { font-size: 20px; font-weight: 600; margin-top: 32px; margin-bottom: 12px; }
  h3 { font-size: 16px; font-weight: 600; margin-top: 24px; margin-bottom: 8px; }
  p { margin-bottom: 12px; color: #525252; }
  ul, ol { margin-bottom: 12px; padding-left: 24px; color: #525252; }
  li { margin-bottom: 4px; }
  pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 16px; font-size: 13px; }
  code { font-family: 'JetBrains Mono', monospace; }
  .inline-code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 24px 0; }
  img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
  figcaption { text-align: center; font-size: 12px; color: #a3a3a3; margin-top: 4px; }
  blockquote { border-left: 3px solid #6366f1; padding-left: 16px; color: #6366f1; background: #eef2ff; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; }
  .quiz { border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .quiz-q { font-weight: 600; margin-bottom: 12px; }
  .quiz-opt { padding: 8px 12px; border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 4px; font-size: 13px; }
  .quiz-correct { border-color: #16a34a; background: #f0fdf4; color: #16a34a; }
  .code-header { background: #0a0a0a; color: #737373; padding: 8px 16px; border-radius: 8px 8px 0 0; font-size: 12px; font-family: monospace; }
  .code-header + pre { border-radius: 0 0 8px 8px; }
  strong { font-weight: 600; color: #171717; }
  em { font-style: italic; }
</style>
</head>
<body>`);

  if (title) {
    parts.push(`<h1>${escapeHTML(title)}</h1>`);
  }

  for (const block of blocks) {
    switch (block.type) {
      case "text":
        parts.push(markdownToHTML(block.content.text));
        break;

      case "code": {
        const label = block.content.filename || block.content.language;
        parts.push(`<div class="code-header">${escapeHTML(label)}</div>`);
        parts.push(
          `<pre><code>${escapeHTML(block.content.code)}</code></pre>`
        );
        break;
      }

      case "image":
        if (block.content.url) {
          parts.push("<figure>");
          parts.push(
            `<img src="${escapeHTML(block.content.url)}" alt="${escapeHTML(block.content.alt || "")}" />`
          );
          if (block.content.caption) {
            parts.push(
              `<figcaption>${escapeHTML(block.content.caption)}</figcaption>`
            );
          }
          parts.push("</figure>");
        }
        break;

      case "divider":
        parts.push("<hr />");
        break;

      case "video":
        if (block.content.url) {
          parts.push(
            `<p>Video: <a href="${escapeHTML(block.content.url)}">${escapeHTML(block.content.url)}</a></p>`
          );
        }
        break;

      case "quiz":
        parts.push('<div class="quiz">');
        parts.push(
          `<div class="quiz-q">${escapeHTML(block.content.question)}</div>`
        );
        block.content.options.forEach((opt: string, i: number) => {
          const cls =
            i === block.content.correctIndex
              ? "quiz-opt quiz-correct"
              : "quiz-opt";
          parts.push(
            `<div class="${cls}">${i + 1}. ${escapeHTML(opt)}</div>`
          );
        });
        if (block.content.explanation) {
          parts.push(
            `<blockquote>${escapeHTML(block.content.explanation)}</blockquote>`
          );
        }
        parts.push("</div>");
        break;

      case "embed":
        if (block.content.url) {
          parts.push(
            `<p><a href="${escapeHTML(block.content.url)}">${escapeHTML(block.content.title || block.content.url)}</a></p>`
          );
        }
        break;
    }
  }

  parts.push("</body></html>");
  return parts.join("\n");
}

/**
 * Block[] → PDF용 HTML (브라우저 인쇄 다이얼로그 자동 실행)
 */
export function blocksToPrintHTML(blocks: Block[], title?: string): string {
  const html = blocksToHTML(blocks, title);
  // Insert print-trigger script and print-optimized styles before </body>
  const printScript = `
<style media="print">
  @page { margin: 20mm; }
  body { padding: 0; font-size: 12px; }
  pre { white-space: pre-wrap; word-break: break-all; }
  .no-print { display: none; }
</style>
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999">
  <button onclick="window.print()" style="padding:8px 20px;background:#171717;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit">PDF로 저장 (Ctrl+P)</button>
</div>
<script>
  // Auto-trigger print after a short delay for rendering
  setTimeout(function(){ window.print(); }, 500);
</script>`;

  return html.replace("</body>", printScript + "\n</body>");
}

/**
 * Block[] → PPTX Buffer
 */
export async function blocksToPPTX(
  blocks: Block[],
  title?: string
): Promise<Buffer> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_16x9";
  pptx.author = "LecturePlatform";
  if (title) pptx.title = title;

  // Title slide
  if (title) {
    const titleSlide = pptx.addSlide();
    titleSlide.addText(title, {
      x: 0.8,
      y: 2.0,
      w: 8.4,
      h: 1.5,
      fontSize: 32,
      fontFace: "Arial",
      bold: true,
      color: "171717",
      align: "center",
      valign: "middle",
    });
    titleSlide.addText("LecturePlatform", {
      x: 0.8,
      y: 4.0,
      w: 8.4,
      h: 0.5,
      fontSize: 14,
      fontFace: "Arial",
      color: "a3a3a3",
      align: "center",
    });
  }

  // Content slides
  for (const block of blocks) {
    switch (block.type) {
      case "text": {
        const slide = pptx.addSlide();
        const text = block.content.text;

        // Check if first line is a heading
        const lines = text.split("\n");
        const headingMatch = lines[0]?.match(/^#{1,3}\s+(.+)$/);

        if (headingMatch) {
          slide.addText(headingMatch[1], {
            x: 0.8,
            y: 0.4,
            w: 8.4,
            h: 0.8,
            fontSize: 24,
            fontFace: "Arial",
            bold: true,
            color: "171717",
          });
          const body = lines
            .slice(1)
            .join("\n")
            .replace(/^#{1,3}\s+/gm, "")
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/\*(.+?)\*/g, "$1")
            .replace(/`(.+?)`/g, "$1")
            .trim();
          if (body) {
            slide.addText(body, {
              x: 0.8,
              y: 1.4,
              w: 8.4,
              h: 3.6,
              fontSize: 16,
              fontFace: "Arial",
              color: "525252",
              valign: "top",
              lineSpacingMultiple: 1.3,
              wrap: true,
            });
          }
        } else {
          const clean = text
            .replace(/^#{1,3}\s+/gm, "")
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/\*(.+?)\*/g, "$1")
            .replace(/`(.+?)`/g, "$1");
          slide.addText(clean, {
            x: 0.8,
            y: 0.6,
            w: 8.4,
            h: 4.2,
            fontSize: 16,
            fontFace: "Arial",
            color: "525252",
            valign: "top",
            lineSpacingMultiple: 1.3,
            wrap: true,
          });
        }
        break;
      }

      case "code": {
        const slide = pptx.addSlide();
        const label = block.content.filename || block.content.language;
        slide.addText(label, {
          x: 0.8,
          y: 0.4,
          w: 8.4,
          h: 0.5,
          fontSize: 12,
          fontFace: "Courier New",
          color: "a3a3a3",
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.0,
          w: 8.4,
          h: 4.0,
          fill: { color: "1e1e2e" },
          rectRadius: 0.1,
        });
        slide.addText(block.content.code, {
          x: 1.0,
          y: 1.2,
          w: 8.0,
          h: 3.6,
          fontSize: 11,
          fontFace: "Courier New",
          color: "cdd6f4",
          valign: "top",
          wrap: true,
          lineSpacingMultiple: 1.2,
        });
        break;
      }

      case "image": {
        if (block.content.url) {
          const slide = pptx.addSlide();
          const resolved = await resolveImageUrl(block.content.url);
          if (resolved) {
            try {
              const imgOpts: Record<string, unknown> = {
                x: 1.0, y: 0.5, w: 8.0, h: 4.5,
                sizing: { type: "contain", w: 8.0, h: 4.5 },
              };
              if (resolved.startsWith("data:")) {
                imgOpts.data = resolved;
              } else {
                imgOpts.path = resolved;
              }
              slide.addImage(imgOpts);
            } catch {
              slide.addText(`[Image: ${block.content.alt || "이미지"}]`, {
                x: 0.8, y: 2.0, w: 8.4, h: 1,
                fontSize: 14, color: "a3a3a3", align: "center",
              });
            }
          } else {
            slide.addText(
              `[Image: ${block.content.caption || block.content.alt || block.content.url}]`,
              {
                x: 0.8, y: 2.0, w: 8.4, h: 1,
                fontSize: 14, color: "a3a3a3", align: "center",
              }
            );
          }
          if (block.content.caption) {
            slide.addText(block.content.caption, {
              x: 0.8,
              y: 4.8,
              w: 8.4,
              h: 0.4,
              fontSize: 11,
              color: "a3a3a3",
              align: "center",
            });
          }
        }
        break;
      }

      case "quiz": {
        const slide = pptx.addSlide();
        slide.addText(block.content.question, {
          x: 0.8,
          y: 0.4,
          w: 8.4,
          h: 1.0,
          fontSize: 20,
          fontFace: "Arial",
          bold: true,
          color: "171717",
          valign: "top",
          wrap: true,
        });
        block.content.options.forEach((opt: string, i: number) => {
          const isCorrect = i === block.content.correctIndex;
          slide.addText(`${i + 1}. ${opt}`, {
            x: 1.2,
            y: 1.6 + i * 0.7,
            w: 7.6,
            h: 0.6,
            fontSize: 16,
            fontFace: "Arial",
            color: isCorrect ? "16a34a" : "525252",
            bold: isCorrect,
            valign: "middle",
          });
        });
        break;
      }

      case "divider":
        // Skip dividers in PPTX
        break;

      case "video":
        if (block.content.url) {
          const slide = pptx.addSlide();
          slide.addText(`Video: ${block.content.url}`, {
            x: 0.8,
            y: 2.0,
            w: 8.4,
            h: 1,
            fontSize: 14,
            color: "6366f1",
            align: "center",
          });
        }
        break;

      case "embed":
        if (block.content.url) {
          const slide = pptx.addSlide();
          slide.addText(block.content.title || block.content.url, {
            x: 0.8,
            y: 2.0,
            w: 8.4,
            h: 1,
            fontSize: 14,
            color: "6366f1",
            align: "center",
          });
        }
        break;
    }
  }

  // Generate as base64 and convert to Buffer
  const base64 = (await pptx.write({ outputType: "base64" })) as string;
  return Buffer.from(base64, "base64");
}

/**
 * Presentation → PPTX Buffer (freeform elements 기반)
 */
export async function presentationToPPTX(
  presentation: Presentation,
  title?: string
): Promise<Buffer> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_16x9";
  pptx.author = "한국AI강사협회";
  if (title) pptx.title = title;

  const theme = presentation.theme;
  const fontFace = theme.fontFamily?.split(",")[0]?.trim().replace(/['"]/g, "") || "Arial";

  for (const slide of presentation.slides) {
    const pptSlide = pptx.addSlide();

    // Background (supports gradient)
    if (theme.bgGradient) {
      // Try to parse CSS gradient to pptxgenjs format
      const gradMatch = theme.bgGradient.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
      if (gradMatch) {
        const c1 = gradMatch[2].trim().replace("#", "");
        const c2 = gradMatch[3].trim().replace("#", "");
        pptSlide.background = {
          fill: {
            type: "solid",
            color: theme.bgColor.replace("#", ""),
          } as never,
        };
        // Fallback: try gradient fill
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (pptSlide.background as any) = {
            fill: { type: "gradient", stops: [
              { position: 0, color: c1 },
              { position: 100, color: c2 },
            ]},
          };
        } catch {
          pptSlide.background = { color: theme.bgColor.replace("#", "") };
        }
      } else {
        pptSlide.background = { color: theme.bgColor.replace("#", "") };
      }
    } else {
      pptSlide.background = { color: theme.bgColor.replace("#", "") };
    }

    const elements = slide.elements || [];
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sorted) {
      if (el.visible === false) continue;

      // Convert 960x540 canvas coords to inches (10"x5.625")
      const xIn = (el.x / 960) * 10;
      const yIn = (el.y / 540) * 5.625;
      const wIn = (el.width / 960) * 10;
      const hIn = (el.height / 540) * 5.625;

      if (el.type === "text") {
        const c = el.content as ElementTextContent;
        const fontSize = Math.max(8, Math.round(c.fontSize * (3 / 4))); // px to pt (exact inverse of import)
        const elFontFace = c.fontFamily || fontFace;
        pptSlide.addText(c.text, {
          x: xIn,
          y: yIn,
          w: wIn,
          h: hIn,
          fontSize,
          fontFace: elFontFace,
          bold: c.fontWeight === "bold",
          italic: c.fontStyle === "italic",
          underline: { style: c.textDecoration === "underline" ? "sng" : "none" },
          color: (c.color || "#171717").replace("#", ""),
          align: c.textAlign || "left",
          valign: c.verticalAlign === "bottom" ? "bottom" : c.verticalAlign === "middle" ? "middle" : "top",
          wrap: true,
          lineSpacingMultiple: c.lineHeight || 1.5,
          rotate: el.rotation || 0,
          transparency: el.style.opacity != null ? Math.round((1 - el.style.opacity) * 100) : undefined,
        });
      } else if (el.type === "shape") {
        const fillColor = (el.style.fill || "#e5e7eb").replace("#", "");
        const borderColor = (el.style.stroke || "#9ca3af").replace("#", "");
        pptSlide.addShape(pptx.ShapeType.rect, {
          x: xIn,
          y: yIn,
          w: wIn,
          h: hIn,
          fill: { color: fillColor, transparency: el.style.opacity != null ? Math.round((1 - el.style.opacity) * 100) : undefined },
          line: { color: borderColor, width: el.style.strokeWidth || 2 },
          rectRadius: el.style.borderRadius ? el.style.borderRadius / 100 : 0,
          rotate: el.rotation || 0,
          shadow: el.style.shadow ? { type: "outer", blur: 6, offset: 3, color: "000000", opacity: 0.25 } : undefined,
        });
      } else if (el.type === "image") {
        const c = el.content as ElementImageContent;
        if (c.imageUrl) {
          const resolved = await resolveImageUrl(c.imageUrl);
          if (resolved) {
            try {
              const imgOpts: Record<string, unknown> = {
                x: xIn, y: yIn, w: wIn, h: hIn,
                sizing: { type: "contain", w: wIn, h: hIn },
                rotate: el.rotation || 0,
              };
              if (resolved.startsWith("data:")) {
                imgOpts.data = resolved;
              } else {
                imgOpts.path = resolved;
              }
              pptSlide.addImage(imgOpts);
            } catch {
              pptSlide.addText(`[Image: ${c.imageAlt || "이미지"}]`, {
                x: xIn, y: yIn, w: wIn, h: hIn,
                fontSize: 12, color: "a3a3a3", align: "center",
              });
            }
          } else {
            pptSlide.addText(`[Image: ${c.imageAlt || c.imageUrl}]`, {
              x: xIn, y: yIn, w: wIn, h: hIn,
              fontSize: 12, color: "a3a3a3", align: "center",
            });
          }
        }
      } else if (el.type === "code") {
        const c = el.content as ElementCodeContent;
        const bgColor = (el.style.fill || "#1e1e2e").replace("#", "");
        pptSlide.addShape(pptx.ShapeType.rect, {
          x: xIn, y: yIn, w: wIn, h: hIn,
          fill: { color: bgColor },
          rectRadius: 0.05,
        });
        pptSlide.addText(c.code, {
          x: xIn + 0.1, y: yIn + 0.3, w: wIn - 0.2, h: hIn - 0.4,
          fontSize: 10,
          fontFace: "Courier New",
          color: "cdd6f4",
          valign: "top",
          wrap: true,
          lineSpacingMultiple: 1.2,
        });
        pptSlide.addText(c.language, {
          x: xIn + 0.1, y: yIn + 0.05, w: wIn - 0.2, h: 0.25,
          fontSize: 8,
          fontFace: "Courier New",
          color: "737373",
        });
      }
    }

    // Watermark
    pptSlide.addText("한국AI강사협회", {
      x: 7.5, y: 5.2, w: 2.3, h: 0.3,
      fontSize: 7, fontFace, color: "a3a3a3", align: "right",
    });
  }

  const base64 = (await pptx.write({ outputType: "base64" })) as string;
  return Buffer.from(base64, "base64");
}

/**
 * Presentation → Markdown (elements 기반)
 */
export function presentationToMarkdown(
  presentation: Presentation,
  title?: string
): string {
  const parts: string[] = [];
  if (title) parts.push(`# ${title}\n`);

  for (let i = 0; i < presentation.slides.length; i++) {
    const slide = presentation.slides[i];
    const elements = slide.elements || [];
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sorted) {
      if (el.visible === false) continue;

      if (el.type === "text") {
        const c = el.content as ElementTextContent;
        if (c.text) parts.push(c.text);
      } else if (el.type === "code") {
        const c = el.content as ElementCodeContent;
        if (c.code) {
          parts.push(`\`\`\`${c.language}\n${c.code}\n\`\`\``);
        }
      } else if (el.type === "image") {
        const c = el.content as ElementImageContent;
        if (c.imageUrl) {
          parts.push(`![${c.imageAlt || "image"}](${c.imageUrl})`);
        }
      }
    }

    if (i < presentation.slides.length - 1) {
      parts.push("\n---\n");
    }
    parts.push("");
  }

  return parts.join("\n").trim() + "\n";
}

/**
 * Presentation (freeform slides) → HTML 변환
 * 슬라이드 요소의 텍스트/코드/이미지를 HTML로 변환
 */
export function presentationToHTML(
  presentation: Presentation,
  title?: string
): string {
  const parts: string[] = [];

  parts.push(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; color: #171717; line-height: 1.7; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.02em; }
  h2 { font-size: 20px; font-weight: 600; margin-top: 32px; margin-bottom: 12px; }
  h3 { font-size: 16px; font-weight: 600; margin-top: 24px; margin-bottom: 8px; }
  p { margin-bottom: 12px; color: #525252; }
  ul, ol { margin-bottom: 12px; padding-left: 24px; color: #525252; }
  li { margin-bottom: 4px; }
  pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 16px; font-size: 13px; }
  code { font-family: 'JetBrains Mono', monospace; }
  .inline-code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 24px 0; }
  img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
  blockquote { border-left: 3px solid #6366f1; padding-left: 16px; color: #6366f1; background: #eef2ff; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; }
  strong { font-weight: 600; color: #171717; }
  em { font-style: italic; }
  .slide-divider { border: none; border-top: 2px dashed #d4d4d4; margin: 32px 0; }
</style>
</head>
<body>`);

  if (title) {
    parts.push(`<h1>${escapeHTML(title)}</h1>`);
  }

  for (let i = 0; i < presentation.slides.length; i++) {
    const slide = presentation.slides[i];
    const elements = slide.elements || [];
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sorted) {
      if (el.visible === false) continue;

      if (el.type === "text") {
        const c = el.content as ElementTextContent;
        if (!c.text?.trim()) continue;

        // Use textRole to determine HTML element
        const role = c.textRole;
        if (role === "title") {
          parts.push(`<h2>${escapeHTML(c.text)}</h2>`);
        } else if (role === "subtitle") {
          parts.push(`<h3>${escapeHTML(c.text)}</h3>`);
        } else if (role === "pageNumber") {
          // Skip page numbers in HTML export
        } else {
          // Body or other: render as markdown content
          parts.push(markdownToHTML(c.text));
        }
      } else if (el.type === "code") {
        const c = el.content as ElementCodeContent;
        if (c.code) {
          parts.push(`<pre><code>${escapeHTML(c.code)}</code></pre>`);
        }
      } else if (el.type === "image") {
        const c = el.content as ElementImageContent;
        if (c.imageUrl) {
          parts.push(`<figure><img src="${escapeHTML(c.imageUrl)}" alt="${escapeHTML(c.imageAlt || "")}" /></figure>`);
        }
      }
    }

    if (i < presentation.slides.length - 1) {
      parts.push('<hr class="slide-divider" />');
    }
  }

  parts.push("</body>\n</html>");
  return parts.join("\n");
}

// ── Helpers ──

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 간단한 마크다운→HTML 변환
 */
function markdownToHTML(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="inline-code">$1</code>')
    .replace(
      /^- (.+)$/gm,
      '<li style="list-style-type:disc;margin-left:24px">$1</li>'
    )
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<li style="list-style-type:decimal;margin-left:24px">$2</li>'
    )
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  return `<p>${html}</p>`;
}
