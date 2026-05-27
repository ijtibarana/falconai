import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Lead Agent",
  description: "Agency command center for B2B and B2C AI lead generation."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
