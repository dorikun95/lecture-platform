export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("비밀번호는 8자 이상이어야 합니다.");
  }
  if (password.length > 128) {
    errors.push("비밀번호는 128자 이하여야 합니다.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("소문자를 포함해야 합니다.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("대문자를 포함해야 합니다.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("숫자를 포함해야 합니다.");
  }

  return { valid: errors.length === 0, errors };
}
