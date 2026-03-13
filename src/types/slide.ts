export type SlideLayoutId =
  | "title"
  | "title-subtitle"
  | "title-body"
  | "section-header"
  | "two-column"
  | "image-text"
  | "text-image"
  | "full-image"
  | "full-code"
  | "code-explain"
  | "quiz-slide"
  | "blank"
  | "hero"
  | "big-number"
  | "quote"
  | "three-column"
  | "agenda";

export type SlotType = "title" | "subtitle" | "body" | "image" | "code" | "quiz";

export type SlideTransition = "none" | "fade" | "slide-left" | "slide-up";

export interface SlotDefinition {
  id: string;
  type: SlotType;
  label: string;
  gridArea: string;
}

export interface LayoutDefinition {
  id: SlideLayoutId;
  name: string;
  description: string;
  gridTemplate: string;
  gridAreas: string;
  slots: SlotDefinition[];
}

export interface SlotContent {
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  code?: string;
  language?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  // Text formatting
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right";
  textColor?: string;
}

// ── Free-form element types ──

export type SlideElementType = "text" | "shape" | "image" | "code";

export type ShapeKind = "rectangle" | "rounded-rect" | "circle" | "arrow" | "triangle" | "diamond" | "line";

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  borderRadius?: number;
  shadow?: boolean;
}

export type TextRole = "title" | "subtitle" | "body" | "pageNumber" | "other";

export interface ElementTextContent {
  text: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  color?: string;
  lineHeight?: number;
  textRole?: TextRole;
}

export interface ElementShapeContent {
  shapeKind: ShapeKind;
  text?: string;
  textColor?: string;
  fontSize?: number;
}

export interface ElementImageContent {
  imageUrl: string;
  imageAlt?: string;
  objectFit?: "cover" | "contain" | "fill";
}

export interface ElementCodeContent {
  code: string;
  language: string;
}

export type ElementContent =
  | ElementTextContent
  | ElementShapeContent
  | ElementImageContent
  | ElementCodeContent;

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  style: ElementStyle;
  content: ElementContent;
}

export interface Slide {
  id: string;
  layoutId: SlideLayoutId;
  slots: Record<string, SlotContent>;
  order: number;
  notes?: string;
  transition?: SlideTransition;
  elements?: SlideElement[];
}

export interface PresentationTheme {
  id: string;
  name: string;
  bgColor: string;
  bgGradient?: string;
  titleColor: string;
  bodyColor: string;
  accentColor: string;
  fontFamily: string;
  codeBg: string;
}

export interface Presentation {
  slides: Slide[];
  theme: PresentationTheme;
}
