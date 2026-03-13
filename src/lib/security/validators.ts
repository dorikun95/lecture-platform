import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요.").max(254),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(128),
  name: z.string().min(1, "이름을 입력하세요.").max(100).trim(),
  role: z.enum(["instructor", "student"], {
    message: "유효하지 않은 역할입니다.",
  }),
});

export const CourseCreateSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(5000).optional().default(""),
  category: z.string().max(100).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  visibility: z.enum(["public", "private", "password"]).optional().default("private"),
  thumbnailUrl: z.string().max(500).optional(),
});

export const CourseUpdateSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(5000).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  visibility: z.enum(["public", "private", "password"]).optional(),
  thumbnailUrl: z.string().max(500).optional(),
});

export const LessonUpdateSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  blocks: z.array(z.any()).optional(),
  presentation: z.any().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const ReviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).trim().optional().default(""),
});

export const BookmarkSchema = z.object({
  lessonId: z.string().min(1),
  note: z.string().max(500).trim().optional().default(""),
});

export const ModuleSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  orderIndex: z.number().int().min(0).optional(),
});

export function parseBody<T>(schema: z.ZodType<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues
      .map((e: { message: string }) => e.message)
      .join(", ");
    return { success: false, error: msg };
  }
  return { success: true, data: result.data };
}
