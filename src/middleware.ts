import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers applied to all responses
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

// Simple in-middleware rate limit store (per-instance, resets on cold start)
const rateLimitStore = new Map<string, number[]>();

function checkRate(ip: string, path: string): boolean {
  const isAuth = path.startsWith("/api/auth");
  const maxRequests = isAuth ? 10 : 100;
  const windowMs = isAuth ? 900000 : 60000;

  const key = `${ip}:${isAuth ? "auth" : "api"}`;
  const now = Date.now();
  const timestamps = rateLimitStore.get(key) ?? [];
  const recent = timestamps.filter((t) => t > now - windowMs);

  if (recent.length >= maxRequests) {
    rateLimitStore.set(key, recent);
    return false;
  }

  recent.push(now);
  rateLimitStore.set(key, recent);
  return true;
}

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/courses/create",
  "/courses/edit",
  "/admin",
];

const protectedApiRoutes = [
  "/api/courses",
  "/api/lessons",
  "/api/enrollments",
  "/api/bookmarks",
  "/api/reviews",
  "/api/upload",
  "/api/import",
  "/api/export",
  "/api/analytics",
  "/api/admin",
  "/api/library",
];

// Admin-only routes
const adminRoutes = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Apply security headers to all responses
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // 2. CSRF origin check for mutating requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "CSRF 검증 실패" },
          { status: 403 }
        );
      }
    }
  }

  // 3. Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRate(ip, pathname)) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." },
        { status: 429 }
      );
    }
  }

  // 4. Auth protection — check session token cookie
  const isProtectedPage = protectedRoutes.some((r) => pathname.startsWith(r));
  const isProtectedApi = protectedApiRoutes.some((r) =>
    pathname.startsWith(r)
  );

  // Allow GET requests to public course listing and NextAuth routes
  const isPublicRead =
    request.method === "GET" &&
    (pathname === "/api/courses" || pathname.match(/^\/api\/courses\/[^/]+$/));
  const isNextAuthRoute = pathname.startsWith("/api/auth");

  if ((isProtectedPage || (isProtectedApi && !isPublicRead)) && !isNextAuthRoute) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value ??
      request.cookies.get("next-auth.session-token")?.value ??
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: "로그인이 필요합니다." },
          { status: 401 }
        );
      }
      // Redirect pages to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
