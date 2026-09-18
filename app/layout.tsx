import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Map AI | Real Codebase Debugger",
  description: "Load any GitHub repo or zip file and debug it with AI. Ask questions, get answers, fix bugs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="h-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
