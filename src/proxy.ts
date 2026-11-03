import NextAuth, { type NextAuthRequest } from "next-auth";
import type { NextFetchEvent } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const handleAuth = auth as unknown as (
  request: NextAuthRequest,
  event: NextFetchEvent,
) => Promise<Response>;

export function proxy(request: NextAuthRequest, event: NextFetchEvent) {
  return handleAuth(request, event);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup|forgot-password|reset-password|confirm-email-change|undo-email-change|.*\\..*).*)",
  ],
};
