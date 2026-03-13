"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50/50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">로그인</h1>
          <p className="text-[13px] text-neutral-400 mt-1">강의 플랫폼에 오신 것을 환영합니다</p>
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
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-100 focus:border-neutral-400 outline-none text-sm placeholder:text-neutral-300 transition-all duration-200"
              placeholder="비밀번호 입력"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium text-[13px] transition shadow-sm disabled:opacity-40 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "로그인"
            )}
          </button>
        </form>

        <p className="text-center text-[13px] text-neutral-400 mt-5">
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="text-neutral-900 hover:text-neutral-700 font-medium"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
