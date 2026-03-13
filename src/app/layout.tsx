import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LecturePlatform — 인터랙티브 강의 자료 공유",
  description:
    "강사가 강의 자료를 업로드하고, 커스터마이징하여 수강생과 공유하는 인터랙티브 웹 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Google Fonts — 한글 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Noto+Serif+KR:wght@400;700&family=Gothic+A1:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Black+Han+Sans&family=Do+Hyeon&family=Jua&family=Gowun+Dodum&family=Gowun+Batang:wght@400;700&family=Dongle:wght@300;400;700&family=Sunflower:wght@300;500;700&family=Gamja+Flower&family=Gaegu:wght@300;400;700&family=Single+Day&family=Poor+Story&family=Hi+Melody&family=Hahmlet:wght@400;500;700&family=Orbit&family=Nanum+Gothic:wght@400;700;800&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Pen+Script&family=Nanum+Brush+Script&family=East+Sea+Dokdo&family=Song+Myung&family=Cute+Font&family=Gugi&family=Stylish&family=Kirang+Haerang&display=swap"
          rel="stylesheet"
        />
        {/* Google Fonts — 영어 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Nunito:wght@400;600;700&family=Work+Sans:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=Manrope:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=EB+Garamond:wght@400;500;700&family=Libre+Baskerville:wght@400;700&family=Bebas+Neue&family=Oswald:wght@400;500;600;700&family=Lobster&family=Pacifico&family=Permanent+Marker&family=Abril+Fatface&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Indie+Flower&family=Patrick+Hand&family=JetBrains+Mono:wght@400;500&family=Fira+Code:wght@400;500;700&family=Source+Code+Pro:wght@400;500;700&family=Space+Mono:wght@400;700&family=Roboto+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* 다운로드형 무료 폰트 (SIL OFL) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/spoqa/spoqa-han-sans@latest/css/SpoqaHanSansNeo.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/wan2land/d2coding/d2coding-ligature-full.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
