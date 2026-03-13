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
