import { Block } from "./block";
import { Presentation } from "./slide";

export type Visibility = "public" | "private" | "password";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Category =
  | "ai-ml"
  | "web-dev"
  | "data-science"
  | "mobile"
  | "devops"
  | "security"
  | "design"
  | "other";

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  visibility: Visibility;
  passwordHash?: string;
  category: Category;
  difficulty: Difficulty;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  orderIndex: number;
  blocks: Block[];
  presentation?: Presentation;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  lessonId: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: Record<string, boolean>;
}

export interface Bookmark {
  id: string;
  userId: string;
  lessonId: string;
  note?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  blocks: Block[];
  thumbnailUrl?: string;
  authorId: string;
  usageCount: number;
  createdAt: string;
}

export interface Fork {
  id: string;
  libraryItemId: string;
  userId: string;
  lessonId: string;
  forkedAt: string;
  lastSyncedAt: string;
}
