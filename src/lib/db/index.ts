import { JsonCollection } from "./json-store";
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

// Pre-hashed passwords (bcrypt, 12 rounds)
const HASH_ADMIN = "$2b$12$f52agCeH72PChJJ6WjZCf.8HyPmMKJqL/n2.z0/PyfCmS0Yk4IMRO";
const HASH_TEST = "$2b$12$N9zhxuTUsgII1HFBkUdl.OFqYkArHAmpmM2/SZpL1SY4pSgqW6huW";

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
      password: HASH_ADMIN,
      role: "admin",
      createdAt: new Date().toISOString(),
    },
    {
      id: "instructor-001",
      email: "instructor@example.com",
      name: "Instructor",
      password: HASH_TEST,
      role: "instructor",
      createdAt: new Date().toISOString(),
    },
    {
      id: "student-001",
      email: "student@example.com",
      name: "Student",
      password: HASH_TEST,
      role: "student",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const user of defaultUsers) {
    await db.users.create(user);
  }
}
