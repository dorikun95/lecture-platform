// Strip dangerous HTML patterns from user content
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");
}

// Strip sensitive fields from objects
export function stripFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): Omit<T, string> {
  const result = { ...obj };
  for (const field of fields) {
    delete result[field];
  }
  return result;
}

// Sanitize user object for response (remove password)
export function sanitizeUser<T extends { password?: string }>(
  user: T
): Omit<T, "password"> {
  const { password: _, ...safe } = user;
  return safe;
}

// Sanitize course object for response (remove passwordHash)
export function sanitizeCourse<T extends { passwordHash?: string }>(
  course: T
): Omit<T, "passwordHash"> {
  const { passwordHash: _, ...safe } = course;
  return safe;
}
