import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// SVG removed — XSS attack vector
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Magic byte signatures for file type verification
const MAGIC_BYTES: Record<string, number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
};

function verifyMagicBytes(buffer: ArrayBuffer, claimedType: string): boolean {
  const expected = MAGIC_BYTES[claimedType];
  if (!expected) return true; // Skip check for types without known signatures
  const bytes = new Uint8Array(buffer);
  return expected.every((b, i) => bytes[i] === b);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const user = session.user as { id?: string };

  // Rate limit uploads
  const rateCheck = checkRateLimit(`upload:${user.id}`, RATE_LIMITS.upload);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "업로드 횟수를 초과했습니다. 잠시 후 다시 시도하세요." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // File size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    // Verify magic bytes match claimed MIME type
    if (!verifyMagicBytes(bytes, file.type)) {
      return NextResponse.json(
        { error: "파일 형식이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    // Use safe extension from allowed types only
    const extMap: Record<string, string> = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
      "text/plain": ".txt",
      "text/markdown": ".md",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    };
    const ext = extMap[file.type] || ".bin";
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await writeFile(filepath, Buffer.from(bytes));

    return NextResponse.json({
      url: `/api/upload/${filename}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch {
    return NextResponse.json(
      { error: "업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
