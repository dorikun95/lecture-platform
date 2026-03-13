export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const diff = now - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return formatDate(dateString);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    "ai-ml": "AI/ML",
    "web-dev": "웹개발",
    "data-science": "데이터사이언스",
    mobile: "모바일",
    devops: "DevOps",
    security: "보안",
    design: "디자인",
    other: "기타",
  };
  return labels[category] || category;
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    beginner: "입문",
    intermediate: "중급",
    advanced: "고급",
  };
  return labels[difficulty] || difficulty;
}

export function getDifficultyColor(_difficulty: string): string {
  return "bg-neutral-100 text-neutral-600";
}
