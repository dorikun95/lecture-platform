import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  parsePDF,
  parseDOCX,
  parsePPTX,
  parsePPTXToSlides,
  parseMarkdown,
  parsePlainText,
  parseHTML,
} from "@/lib/file-parser";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/html": "html",
  "text/markdown": "md",
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 없습니다." },
        { status: 400 }
      );
    }

    // Determine file type from MIME or extension
    let fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      // Fallback: check extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") fileType = "pdf";
      else if (ext === "md" || ext === "markdown") fileType = "md";
      else if (ext === "txt") fileType = "txt";
      else if (ext === "pptx") fileType = "pptx";
      else if (ext === "docx") fileType = "docx";
      else if (ext === "html" || ext === "htm") fileType = "html";
      else {
        return NextResponse.json(
          {
            error:
              "지원하지 않는 파일 형식입니다. (PDF, PPTX, DOCX, HTML, MD, TXT 지원)",
          },
          { status: 400 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let blocks;
    let slides;

    switch (fileType) {
      case "pdf":
        blocks = await parsePDF(buffer);
        break;
      case "docx":
        blocks = await parseDOCX(buffer);
        break;
      case "pptx":
        blocks = await parsePPTX(buffer);
        // Also parse as slides with full styling
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
      default:
        return NextResponse.json(
          { error: "지원하지 않는 형식입니다." },
          { status: 400 }
        );
    }

    return NextResponse.json({
      blocks,
      slides,
      fileName: file.name,
      fileType,
      blockCount: blocks?.length || 0,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "파일 파싱 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
