export type UserRole = "instructor" | "student" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  organization?: string;
  createdAt: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  organization?: string;
  createdAt: string;
}
