import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=MissingCode", request.url));
  }

  // Handle the OAuth callback here (e.g. exchange code for token)
  // ...

  return NextResponse.redirect(new URL("/profile/build", request.url));
}
