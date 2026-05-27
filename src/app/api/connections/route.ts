import { NextResponse } from "next/server";
import { createEmailConnection, deleteEmailConnection, listEmailConnections } from "@/lib/storage";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ connections: listEmailConnections() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, smtpHost, smtpPort, smtpUser, smtpPass, provider } = body;

    if (!email || !smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const connection = createEmailConnection({
      email,
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser,
      smtpPass,
      provider: provider || "smtp"
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Connection ID is required" }, { status: 400 });
    }

    const result = deleteEmailConnection(id);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
