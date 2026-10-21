import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "GPLMS — Government Public Library Management System",
  description: "Official Digital Portal for Government Public Library: Online Public Access Catalogue (OPAC), QR Circulation, Accession Register, and Fee Management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F6F2EA] text-[#2A2823] flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#FBF8F2] border-t border-[rgba(42,40,35,0.06)] text-[#8B8678] py-14 px-6 text-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="font-display text-[#2A2823] text-base font-normal">Government Public Library</span>
              <span className="text-[rgba(42,40,35,0.2)]">/</span>
              <span className="font-mono-num text-xs tracking-wide uppercase text-[#8B8678]">GPLMS v1.0</span>
            </div>
            <div className="text-center md:text-right text-xs leading-relaxed max-w-md">
              National Digital Library Standard · Dewey Decimal Classification · Cash & Fine Sequential Ledger · NIC Compliant
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
