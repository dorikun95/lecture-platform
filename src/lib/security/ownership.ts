import { db } from "@/lib/db";

export async function isCoursOwner(
  courseId: string,
  userId: string
): Promise<boolean> {
  const course = await db.courses.findById(courseId);
  if (!course) return false;
  return course.instructorId === userId;
}

export async function isLessonOwner(
  lessonId: string,
  userId: string
): Promise<boolean> {
  const lesson = await db.lessons.findById(lessonId);
  if (!lesson) return false;

  // Find the module to get courseId
  const module = await db.modules.findById(lesson.moduleId);
  if (!module) return false;

  return isCoursOwner(module.courseId, userId);
}

export async function isEnrollmentOwner(
  enrollmentId: string,
  userId: string
): Promise<boolean> {
  const enrollment = await db.enrollments.findById(enrollmentId);
  if (!enrollment) return false;
  return enrollment.userId === userId;
}
