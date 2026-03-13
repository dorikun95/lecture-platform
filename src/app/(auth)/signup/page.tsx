"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "instructor" | "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "회원가입에 실패했습니다.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("서버 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50/50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">회원가입</h1>
          <p className="text-[13px] text-neutral-400 mt-1">새 계정을 만들어 시작하세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-neutral-100 p-7 space-y-4"
        >
          {error && (
            <div className="bg-red-50 text-red-600 text-[13px] rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
              이름
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 outline-none text-sm placeholder:text-neutral-300 transition-all duration-200"
              placeholder="홍길동"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
              이메일
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 outline-none text-sm placeholder:text-neutral-300 transition-all duration-200"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
              비밀번호
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 outline-none text-sm placeholder:text-neutral-300 transition-all duration-200"
              placeholder="6자 이상"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-600 mb-2">
              역할 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "instructor" })}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200 text-sm ${
                  form.role === "instructor"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-500"
                }`}
              >
                <span className="font-medium text-[13px]">강사</span>
                <span className={`text-[11px] ${form.role === "instructor" ? "text-neutral-400" : "text-neutral-300"}`}>
                  자료 업로드 & 공유
                </span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "student" })}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200 text-sm ${
                  form.role === "student"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-500"
                }`}
              >
                <span className="font-medium text-[13px]">수강생</span>
                <span className={`text-[11px] ${form.role === "student" ? "text-neutral-400" : "text-neutral-300"}`}>
                  자료 열람 & 학습
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium text-[13px] transition shadow-sm disabled:opacity-40 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "가입하기"
            )}
          </button>
        </form>

        <p className="text-center text-[13px] text-neutral-400 mt-5">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="text-neutral-900 hover:text-neutral-700 font-medium"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
