import { NextRequest, NextResponse } from "next/server";

const APEX_HOST = "uscoo.ai";
const CANONICAL_HOST = "www.uscoo.ai";

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const requestHost =
    forwardedHost ?? request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? request.nextUrl.hostname;

  if (requestHost !== APEX_HOST) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.protocol = "https:";
  destination.hostname = CANONICAL_HOST;
  destination.port = "";

  return NextResponse.redirect(destination, 301);
}

export const config = {
  matcher: "/:path*",
};
