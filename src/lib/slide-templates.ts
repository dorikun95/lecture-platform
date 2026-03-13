import { v4 as uuidv4 } from "uuid";
import type { Slide, Presentation, PresentationTheme } from "@/types/slide";
import { THEMES } from "./slide-utils";

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  theme: PresentationTheme;
  slides: Slide[];
}

function sid(): string {
  return uuidv4();
}

// ── 템플릿 1: 모던 프레젠테이션 (라이트) ──
const modernLight: SlideTemplate = {
  id: "modern-light",
  name: "모던 라이트",
  description: "깔끔한 Sans 타이포 중심 디자인",
  theme: THEMES[0], // light
  slides: [
    {
      id: sid(),
      layoutId: "hero",
      order: 0,
      slots: {
        title: { text: "AI 시대의\n교육 혁신" },
        subtitle: { text: "한국AI강사협회 2026 컨퍼런스" },
        body: { text: "2026. 03. 12" },
      },
    },
    {
      id: sid(),
      layoutId: "agenda",
      order: 1,
      slots: {
        title: { text: "Agenda" },
        body: {
          text: "01  AI 교육 현황 분석\n\n02  핵심 기술 트렌드\n\n03  실전 적용 사례\n\n04  향후 로드맵",
        },
        image: {},
      },
    },
    {
      id: sid(),
      layoutId: "big-number",
      order: 2,
      slots: {
        title: { text: "핵심 수치" },
        body: { text: "78%의 교육기관이\nAI 도구를 도입했습니다" },
        subtitle: { text: "출처: 2025 교육기술 백서" },
      },
    },
    {
      id: sid(),
      layoutId: "three-column",
      order: 3,
      slots: {
        title: { text: "3가지 핵심 전략" },
        left: { text: "맞춤형 학습\n\nAI가 학습자 수준을 분석하여 최적의 콘텐츠를 제공합니다" },
        center: { text: "실시간 피드백\n\n즉각적인 평가와 개선 방향을 제시하여 학습 효율을 높입니다" },
        right: { text: "데이터 기반\n\n학습 데이터를 분석하여 교수법을 지속적으로 개선합니다" },
      },
    },
    {
      id: sid(),
      layoutId: "quote",
      order: 4,
      slots: {
        body: {
          text: '"기술은 도구일 뿐,\n교육의 본질은 사람에게 있다."',
        },
        subtitle: { text: "— 한국AI강사협회" },
      },
    },
    {
      id: sid(),
      layoutId: "title-subtitle",
      order: 5,
      slots: {
        title: { text: "감사합니다" },
        subtitle: { text: "contact@aikorea.org" },
      },
    },
  ],
};

// ── 템플릿 2: 다크 테크 ──
const darkTech: SlideTemplate = {
  id: "dark-tech",
  name: "다크 테크",
  description: "미드나이트 배경의 기술 발표용",
  theme: THEMES[5], // midnight
  slides: [
    {
      id: sid(),
      layoutId: "hero",
      order: 0,
      slots: {
        title: { text: "Generative AI\nfor Education" },
        subtitle: { text: "생성형 AI를 활용한 교육 콘텐츠 제작" },
        body: { text: "한국AI강사협회" },
      },
    },
    {
      id: sid(),
      layoutId: "title-body",
      order: 1,
      slots: {
        title: { text: "Why AI?" },
        body: {
          text: "콘텐츠 제작 시간 70% 단축\n학습자 만족도 35% 향상\n개인화 학습 경로 자동 생성\n실시간 다국어 번역 지원",
        },
      },
    },
    {
      id: sid(),
      layoutId: "code-explain",
      order: 2,
      slots: {
        title: { text: "Prompt Engineering" },
        code: {
          code: 'const prompt = `\n  당신은 ${subject} 전문 강사입니다.\n  학습자 수준: ${level}\n  \n  다음 주제에 대해 설명하세요:\n  ${topic}\n`;',
          language: "typescript",
        },
        body: {
          text: "효과적인 프롬프트 설계는\nAI 교육 도구의 핵심입니다.\n\n컨텍스트, 역할, 제약조건을\n명확하게 정의하세요.",
        },
      },
    },
    {
      id: sid(),
      layoutId: "big-number",
      order: 3,
      slots: {
        title: { text: "성과 지표" },
        body: { text: "교수자 생산성\n3.5배 향상" },
        subtitle: { text: "2025년 파일럿 프로그램 결과" },
      },
    },
    {
      id: sid(),
      layoutId: "title-subtitle",
      order: 4,
      slots: {
        title: { text: "Thank You" },
        subtitle: { text: "한국AI강사협회 | ai-instructor.kr" },
      },
    },
  ],
};

// ── 템플릿 3: 블루 비즈니스 ──
const blueBusiness: SlideTemplate = {
  id: "blue-business",
  name: "블루 비즈니스",
  description: "기업 교육용 깔끔한 블루 톤",
  theme: THEMES[2], // blue
  slides: [
    {
      id: sid(),
      layoutId: "title-subtitle",
      order: 0,
      slots: {
        title: { text: "디지털 트랜스포메이션\n교육 전략" },
        subtitle: { text: "한국AI강사협회 | 2026년 1분기 보고서" },
      },
    },
    {
      id: sid(),
      layoutId: "three-column",
      order: 1,
      slots: {
        title: { text: "교육 프레임워크" },
        left: { text: "Discover\n\n현황 진단 및\n니즈 분석\n\n→ 역량 갭 도출" },
        center: { text: "Design\n\n맞춤형 커리큘럼\n설계 및 개발\n\n→ AI 도구 적용" },
        right: { text: "Deliver\n\n블렌디드 러닝\n실행 및 평가\n\n→ 성과 측정" },
      },
    },
    {
      id: sid(),
      layoutId: "two-column",
      order: 2,
      slots: {
        title: { text: "Before & After" },
        left: { text: "기존 방식\n\n• 일방향 강의 중심\n• 동일한 콘텐츠 제공\n• 수동 평가 및 피드백\n• 제한된 접근성" },
        right: { text: "AI 적용 후\n\n• 상호작용 중심 학습\n• 수준별 맞춤 콘텐츠\n• 자동화된 실시간 평가\n• 24/7 학습 가능" },
      },
    },
    {
      id: sid(),
      layoutId: "quote",
      order: 3,
      slots: {
        body: {
          text: '"교육의 미래는 기술과 인간의\n조화로운 협력에 달려 있습니다."',
        },
        subtitle: { text: "— 한국AI강사협회 비전 선언문" },
      },
    },
    {
      id: sid(),
      layoutId: "hero",
      order: 4,
      slots: {
        title: { text: "Next Steps" },
        subtitle: { text: "파일럿 프로그램 참여 신청" },
        body: { text: "apply@aikorea.org | 한국AI강사협회" },
      },
    },
  ],
};

// ── 템플릿 4: 미니멀 그린 ──
const minimalGreen: SlideTemplate = {
  id: "minimal-green",
  name: "미니멀 그린",
  description: "친환경/교육 주제에 적합",
  theme: THEMES[4], // green
  slides: [
    {
      id: sid(),
      layoutId: "hero",
      order: 0,
      slots: {
        title: { text: "지속 가능한\nAI 교육 생태계" },
        subtitle: { text: "한국AI강사협회 × 교육부 협력 프로젝트" },
        body: { text: "2026 Spring" },
      },
    },
    {
      id: sid(),
      layoutId: "big-number",
      order: 1,
      slots: {
        title: { text: "참여 현황" },
        body: { text: "전국 152개\n교육기관 참여" },
        subtitle: { text: "2025년 12월 기준" },
      },
    },
    {
      id: sid(),
      layoutId: "image-text",
      order: 2,
      slots: {
        title: { text: "학습 플랫폼" },
        image: {},
        body: {
          text: "AI 기반 학습 관리 시스템\n\n• 자동 커리큘럼 생성\n• 실시간 학습 분석\n• 적응형 콘텐츠 추천\n• 협업 학습 지원",
        },
      },
    },
    {
      id: sid(),
      layoutId: "title-subtitle",
      order: 3,
      slots: {
        title: { text: "함께 만들어가요" },
        subtitle: { text: "한국AI강사협회 | green@aikorea.org" },
      },
    },
  ],
};

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  modernLight,
  darkTech,
  blueBusiness,
  minimalGreen,
];

export function applyTemplate(template: SlideTemplate): Presentation {
  // Deep clone slides with fresh IDs
  const slides: Slide[] = template.slides.map((s, i) => ({
    ...s,
    id: uuidv4(),
    order: i,
    slots: { ...s.slots },
  }));

  return {
    slides,
    theme: { ...template.theme },
  };
}
