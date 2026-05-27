import { NextResponse } from "next/server";
import { createEmailTemplate, deleteEmailTemplate, listEmailTemplates, updateEmailTemplate } from "@/lib/storage";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ templates: listEmailTemplates() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, subject, body: tplBody } = body;

    if (!name || !subject || !tplBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (id) {
      const template = updateEmailTemplate(id, { name, subject, body: tplBody });
      return NextResponse.json({ template }, { status: 200 });
    } else {
      const template = createEmailTemplate({ name, subject, body: tplBody });
      return NextResponse.json({ template }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const result = deleteEmailTemplate(id);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
