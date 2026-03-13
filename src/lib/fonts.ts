/**
 * 지원 폰트 목록
 * 모든 폰트는 SIL Open Font License 또는 Apache License 2.0 기반 무료 폰트입니다.
 */

export interface FontDefinition {
  /** CSS font-family 값 */
  family: string;
  /** UI에 표시할 이름 */
  label: string;
  /** 카테고리 */
  category: "sans" | "serif" | "display" | "handwriting" | "mono";
  /** 언어 */
  lang: "ko" | "en" | "both";
  /** 라이센스 */
  license: "OFL" | "Apache-2.0";
}

export const FONTS: FontDefinition[] = [
  // ═══════════════════════════════════════
  //  한글 — 산세리프
  // ═══════════════════════════════════════
  { family: "Pretendard Variable", label: "프리텐다드", category: "sans", lang: "ko", license: "OFL" },
  { family: "Noto Sans KR", label: "노토 산스", category: "sans", lang: "ko", license: "OFL" },
  { family: "Gothic A1", label: "고딕 A1", category: "sans", lang: "ko", license: "OFL" },
  { family: "IBM Plex Sans KR", label: "IBM 플렉스 산스", category: "sans", lang: "ko", license: "OFL" },
  { family: "Nanum Gothic", label: "나눔 고딕", category: "sans", lang: "ko", license: "OFL" },
  { family: "Spoqa Han Sans Neo", label: "스포카 한 산스 네오", category: "sans", lang: "ko", license: "OFL" },
  { family: "Orbit", label: "오르빗", category: "sans", lang: "ko", license: "OFL" },

  // ═══════════════════════════════════════
  //  한글 — 세리프
  // ═══════════════════════════════════════
  { family: "Noto Serif KR", label: "노토 세리프", category: "serif", lang: "ko", license: "OFL" },
  { family: "Gowun Batang", label: "고운 바탕", category: "serif", lang: "ko", license: "OFL" },
  { family: "Nanum Myeongjo", label: "나눔 명조", category: "serif", lang: "ko", license: "OFL" },
  { family: "Hahmlet", label: "함렛", category: "serif", lang: "ko", license: "OFL" },
  { family: "Song Myung", label: "송명", category: "serif", lang: "ko", license: "OFL" },

  // ═══════════════════════════════════════
  //  한글 — 디스플레이
  // ═══════════════════════════════════════
  { family: "Black Han Sans", label: "블랙 한 산스", category: "display", lang: "ko", license: "OFL" },
  { family: "Do Hyeon", label: "도현", category: "display", lang: "ko", license: "OFL" },
  { family: "Jua", label: "주아", category: "display", lang: "ko", license: "OFL" },
  { family: "Sunflower", label: "선플라워", category: "display", lang: "ko", license: "OFL" },
  { family: "Dongle", label: "동글", category: "display", lang: "ko", license: "OFL" },
  { family: "Gowun Dodum", label: "고운 돋움", category: "display", lang: "ko", license: "OFL" },
  { family: "Gugi", label: "구기", category: "display", lang: "ko", license: "OFL" },
  { family: "Cute Font", label: "큐트", category: "display", lang: "ko", license: "OFL" },
  { family: "Stylish", label: "스타일리시", category: "display", lang: "ko", license: "OFL" },

  // ═══════════════════════════════════════
  //  한글 — 손글씨
  // ═══════════════════════════════════════
  { family: "Gamja Flower", label: "감자 꽃", category: "handwriting", lang: "ko", license: "OFL" },
  { family: "Gaegu", label: "개구", category: "handwriting", lang: "ko", license: "OFL" },
  { family: "Single Day", label: "싱글 데이", category: "handwriting", lang: "ko", license: "OFL" },
  { family: "Poor Story", label: "푸어 스토리", category: "handwriting", lang: "ko", license: "OFL" },
  { family: "Hi Melody", label: "하이 멜로디", category: "handwriting", lang: "ko", license: "OFL" },
  { family: "Nanum Pen Script", label: "나눔 펜", category: "handwriting", lang: "ko", license: "OFL" },
  { family: "Nanum Brush Script", label: "나눔 붓", category: "handwriting", lang: "ko", license: "OFL" },
  { family: "East Sea Dokdo", label: "동해 독도", category: "handwriting", lang: "ko", license: "OFL" },
  { family: "Kirang Haerang", label: "키랑 해랑", category: "handwriting", lang: "ko", license: "OFL" },

  // ═══════════════════════════════════════
  //  영어 — 산세리프
  // ═══════════════════════════════════════
  { family: "Inter", label: "Inter", category: "sans", lang: "en", license: "OFL" },
  { family: "Roboto", label: "Roboto", category: "sans", lang: "en", license: "Apache-2.0" },
  { family: "Open Sans", label: "Open Sans", category: "sans", lang: "en", license: "Apache-2.0" },
  { family: "Lato", label: "Lato", category: "sans", lang: "en", license: "OFL" },
  { family: "Montserrat", label: "Montserrat", category: "sans", lang: "en", license: "OFL" },
  { family: "Poppins", label: "Poppins", category: "sans", lang: "en", license: "OFL" },
  { family: "Raleway", label: "Raleway", category: "sans", lang: "en", license: "OFL" },
  { family: "Nunito", label: "Nunito", category: "sans", lang: "en", license: "OFL" },
  { family: "Work Sans", label: "Work Sans", category: "sans", lang: "en", license: "OFL" },
  { family: "DM Sans", label: "DM Sans", category: "sans", lang: "en", license: "OFL" },
  { family: "Manrope", label: "Manrope", category: "sans", lang: "en", license: "OFL" },
  { family: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "sans", lang: "en", license: "OFL" },

  // ═══════════════════════════════════════
  //  영어 — 세리프
  // ═══════════════════════════════════════
  { family: "Playfair Display", label: "Playfair Display", category: "serif", lang: "en", license: "OFL" },
  { family: "Merriweather", label: "Merriweather", category: "serif", lang: "en", license: "OFL" },
  { family: "Lora", label: "Lora", category: "serif", lang: "en", license: "OFL" },
  { family: "EB Garamond", label: "EB Garamond", category: "serif", lang: "en", license: "OFL" },
  { family: "Libre Baskerville", label: "Libre Baskerville", category: "serif", lang: "en", license: "OFL" },

  // ═══════════════════════════════════════
  //  영어 — 디스플레이
  // ═══════════════════════════════════════
  { family: "Bebas Neue", label: "Bebas Neue", category: "display", lang: "en", license: "OFL" },
  { family: "Oswald", label: "Oswald", category: "display", lang: "en", license: "OFL" },
  { family: "Lobster", label: "Lobster", category: "display", lang: "en", license: "OFL" },
  { family: "Pacifico", label: "Pacifico", category: "display", lang: "en", license: "OFL" },
  { family: "Permanent Marker", label: "Permanent Marker", category: "display", lang: "en", license: "Apache-2.0" },
  { family: "Abril Fatface", label: "Abril Fatface", category: "display", lang: "en", license: "OFL" },

  // ═══════════════════════════════════════
  //  영어 — 손글씨
  // ═══════════════════════════════════════
  { family: "Caveat", label: "Caveat", category: "handwriting", lang: "en", license: "OFL" },
  { family: "Dancing Script", label: "Dancing Script", category: "handwriting", lang: "en", license: "OFL" },
  { family: "Indie Flower", label: "Indie Flower", category: "handwriting", lang: "en", license: "OFL" },
  { family: "Patrick Hand", label: "Patrick Hand", category: "handwriting", lang: "en", license: "OFL" },

  // ═══════════════════════════════════════
  //  모노스페이스 (한영 공용)
  // ═══════════════════════════════════════
  { family: "JetBrains Mono", label: "JetBrains Mono", category: "mono", lang: "en", license: "OFL" },
  { family: "Fira Code", label: "Fira Code", category: "mono", lang: "en", license: "OFL" },
  { family: "Source Code Pro", label: "Source Code Pro", category: "mono", lang: "en", license: "OFL" },
  { family: "Space Mono", label: "Space Mono", category: "mono", lang: "en", license: "OFL" },
  { family: "Roboto Mono", label: "Roboto Mono", category: "mono", lang: "en", license: "Apache-2.0" },
  { family: "D2Coding ligature", label: "D2 코딩", category: "mono", lang: "ko", license: "OFL" },
];

export type FontLang = "all" | "ko" | "en";

export const FONT_CATEGORIES: { key: FontDefinition["category"]; label: string }[] = [
  { key: "sans", label: "산세리프" },
  { key: "serif", label: "세리프" },
  { key: "display", label: "디스플레이" },
  { key: "handwriting", label: "손글씨" },
  { key: "mono", label: "모노스페이스" },
];

export const FONT_LANGS: { key: FontLang; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "ko", label: "한글" },
  { key: "en", label: "영어" },
];

/** 폰트 이름으로 FontDefinition 찾기 */
export function findFont(family: string): FontDefinition | undefined {
  return FONTS.find((f) => f.family === family);
}

/** CSS font-family 문자열 생성 (fallback 포함) */
export function fontFamilyCSS(family: string): string {
  const def = findFont(family);
  if (!def) return `"${family}", sans-serif`;

  switch (def.category) {
    case "serif":
      return `"${family}", serif`;
    case "mono":
      return `"${family}", monospace`;
    default:
      return `"${family}", sans-serif`;
  }
}
