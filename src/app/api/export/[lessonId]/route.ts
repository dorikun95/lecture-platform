import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  blocksToMarkdown,
  blocksToHTML,
  blocksToPrintHTML,
  blocksToPPTX,
  presentationToPPTX,
  presentationToMarkdown,
  presentationToHTML,
} from "@/lib/file-exporter";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  try {
    const { lessonId } = await params;
    const lesson = await db.lessons.findById(lessonId);

    if (!lesson) {
      return NextResponse.json(
        { error: "레슨을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const format = req.nextUrl.searchParams.get("format") || "md";
    const title = lesson.title || "Untitled";

    // Use presentation data if available (freeform slides)
    const hasPresentation = lesson.presentation?.slides?.some(
      (s: { elements?: unknown[] }) => s.elements && s.elements.length > 0
    );

    if (format === "md") {
      const markdown = hasPresentation
        ? presentationToMarkdown(lesson.presentation!, title)
        : blocksToMarkdown(lesson.blocks, title);
      const filename = `${sanitizeFilename(title)}.md`;

      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    if (format === "html") {
      const html = hasPresentation
        ? presentationToHTML(lesson.presentation!, title)
        : blocksToHTML(lesson.blocks, title);
      const filename = `${sanitizeFilename(title)}.html`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    if (format === "pdf") {
      // Open as HTML with auto-print dialog for "Save as PDF"
      const html = blocksToPrintHTML(lesson.blocks, title);

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    if (format === "pptx") {
      const buffer = hasPresentation
        ? await presentationToPPTX(lesson.presentation!, title)
        : await blocksToPPTX(lesson.blocks, title);
      const filename = `${sanitizeFilename(title)}.pptx`;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    if (format === "json") {
      const json = JSON.stringify(
        {
          title: lesson.title,
          blocks: lesson.blocks,
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      );
      const filename = `${sanitizeFilename(title)}.json`;

      return new NextResponse(json, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    return NextResponse.json(
      { error: "지원하지 않는 형식입니다. (md, html, pdf, pptx, json)" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "내보내기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}
