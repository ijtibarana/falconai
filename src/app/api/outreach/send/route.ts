import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { addSentMessage, listDashboardData } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, campaignId, connectionId, subject, emailBody, toEmail, toName, isHtml, attachments } = body;

    if (!leadId || !campaignId || !subject || !emailBody || !toEmail) {
      return NextResponse.json({ error: "Missing required outreach fields" }, { status: 400 });
    }

    const dbData = listDashboardData();
    const connection = dbData.emailConnections.find((conn) => conn.id === connectionId);

    if (!connection) {
      return NextResponse.json({ error: "Active email connection not found. Please connect an inbox first." }, { status: 400 });
    }

    let status: "sent" | "failed" = "sent";
    let errorMessage: string | undefined;

    try {
      // Create Nodemailer SMTP transporter
      const transporter = nodemailer.createTransport({
        host: connection.smtpHost,
        port: Number(connection.smtpPort),
        secure: Number(connection.smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: connection.smtpUser,
          pass: connection.smtpPass
        },
        timeout: 10000 // 10s timeout
      } as any);

      // Setup mail options
      const mailOptions: any = {
        from: `"${connection.smtpUser.split("@")[0]}" <${connection.email}>`,
        to: toEmail,
        subject: subject
      };

      if (isHtml) {
        mailOptions.html = emailBody;
      } else {
        mailOptions.text = emailBody;
      }

      if (attachments && attachments.length) {
        mailOptions.attachments = attachments.map((att: any) => ({
          filename: att.name,
          content: att.content || "Placeholder PDF outreach attachment content.",
          contentType: "application/pdf"
        }));
      }

      // Send mail
      await transporter.sendMail(mailOptions);
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : "SMTP connection failed";
    }

    // Log the message in our DB
    const sentRecord = addSentMessage({
      id: `sent_${Math.random().toString(36).substring(2, 9)}`,
      campaignId,
      leadId,
      leadEmail: toEmail,
      leadName: toName || "Valued Customer",
      subject,
      body: emailBody,
      sentAt: new Date().toISOString(),
      status,
      error: errorMessage
    });

    if (status === "failed") {
      return NextResponse.json({
        success: false,
        error: errorMessage,
        record: sentRecord
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      record: sentRecord
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
