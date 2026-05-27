import { NextResponse } from "next/server";

const VALID_USERNAME = process.env.AUTH_USERNAME ?? "falconai";
const VALID_PASSWORD = process.env.AUTH_PASSWORD ?? "Rana@ijtiba2309#";
const SESSION_TOKEN = process.env.AUTH_SESSION_TOKEN ?? "falcon_secure_session_v1";

// 7 days in seconds
const MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string; password?: string };
    const { username, password } = body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.trim() !== VALID_USERNAME ||
      password !== VALID_PASSWORD
    ) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set("falcon_auth", SESSION_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/"
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
}
