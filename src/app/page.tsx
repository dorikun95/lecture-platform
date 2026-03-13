import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-neutral-50">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-neutral-900 tracking-tight">
              Lecture
            </span>
            <span className="text-[13px] text-neutral-400">Platform</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] text-neutral-500 hover:text-neutral-900 transition"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="text-[13px] bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-lg transition shadow-sm"
            >
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[12px] font-medium text-neutral-400 uppercase tracking-widest mb-5">
            인터랙티브 강의 자료 플랫폼
          </p>
          <h1 className="text-3xl md:text-[42px] font-semibold tracking-tight text-neutral-900 leading-[1.15] mb-5">
            강의 자료를 업로드하고
            <br />
            자유롭게 커스터마이징하세요
          </h1>
          <p className="text-[15px] text-neutral-400 leading-relaxed max-w-lg mx-auto mb-10">
            블록 기반 에디터로 강의 자료를 쉽게 구성하고, 라이브러리에서 자료를
            가져와 나만의 코스로 만들어 수강생에게 공유하세요.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-2.5 rounded-lg text-[14px] font-medium transition shadow-sm"
            >
              무료로 시작하기
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600 px-6 py-2.5 rounded-lg text-[14px] font-medium transition"
            >
              라이브러리 탐색
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-neutral-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-[12px] font-medium text-neutral-400 uppercase tracking-widest text-center mb-3">
            Features
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-center text-neutral-900 mb-12">
            핵심 기능
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "간편한 업로드",
                desc: "PDF, PPTX, 코드, 이미지 등 다양한 형식을 드래그앤드롭으로 업로드하세요.",
              },
              {
                title: "블록 기반 에디터",
                desc: "텍스트, 코드, 이미지, 퀴즈 블록을 조합하여 인터랙티브 강의를 만드세요.",
              },
              {
                title: "손쉬운 공유",
                desc: "공개/비밀 링크, 비밀번호 보호 등 다양한 방식으로 수강생과 공유하세요.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="border border-neutral-100 rounded-xl p-6 hover:border-neutral-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200"
              >
                <h3 className="font-medium text-[14px] text-neutral-900 mb-2">{f.title}</h3>
                <p className="text-[13px] text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 border-t border-neutral-50">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "코스", label: "체계적 구조" },
            { value: "공유", label: "수강생 초대" },
            { value: "분석", label: "학습 통계" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-lg font-semibold tracking-tight text-neutral-900">{s.value}</p>
              <p className="text-[13px] text-neutral-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-50 py-8 px-4 text-center text-[12px] text-neutral-300">
        <p>&copy; 2026 LecturePlatform. All rights reserved.</p>
      </footer>
    </div>
  );
}
