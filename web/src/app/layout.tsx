import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLMTS — Smart Library Management & Tracking System",
  description: "Institutional Library Operations & RFID Automation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
