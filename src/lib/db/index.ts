import { JsonCollection } from "./json-store";
import { hashSync } from "bcryptjs";
import type { User } from "@/types/user";
import type {
  Course,
  Module,
  Lesson,
  Resource,
  Enrollment,
  Bookmark,
  Review,
  LibraryItem,
  Fork,
} from "@/types/course";

export const db = {
  users: new JsonCollection<User>("users.json"),
  courses: new JsonCollection<Course>("courses.json"),
  modules: new JsonCollection<Module>("modules.json"),
  lessons: new JsonCollection<Lesson>("lessons.json"),
  resources: new JsonCollection<Resource>("resources.json"),
  enrollments: new JsonCollection<Enrollment>("enrollments.json"),
  bookmarks: new JsonCollection<Bookmark>("bookmarks.json"),
  reviews: new JsonCollection<Review>("reviews.json"),
  library: new JsonCollection<LibraryItem>("library.json"),
  forks: new JsonCollection<Fork>("forks.json"),
};

// Seed default users on first access (for serverless environments)
let seeded = false;
export async function ensureSeed() {
  if (seeded) return;
  seeded = true;

  const users = await db.users.findAll();
  if (users.length > 0) return;

  const defaultUsers: User[] = [
    {
      id: "admin-001",
      email: "admin@example.com",
      name: "Admin",
      password: hashSync("admin1234", 12),
      role: "admin",
      createdAt: new Date().toISOString(),
    },
    {
      id: "instructor-001",
      email: "instructor@example.com",
      name: "Instructor",
      password: hashSync("test1234", 12),
      role: "instructor",
      createdAt: new Date().toISOString(),
    },
    {
      id: "student-001",
      email: "student@example.com",
      name: "Student",
      password: hashSync("test1234", 12),
      role: "student",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const user of defaultUsers) {
    await db.users.create(user);
  }
}
