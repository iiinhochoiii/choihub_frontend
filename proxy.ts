import { type NextRequest, NextResponse } from "next/server";
import { SESSION_TYPE_COOKIE } from "@/lib/sessionCookie";

/** 로그인한 구성원은 소개 화면을 그리기 전에 대시보드로 보낸다. */
export function proxy(request: NextRequest) {
  if (request.cookies.get(SESSION_TYPE_COOKIE)?.value === "member") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
