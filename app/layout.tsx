import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Map AI | Autonomous Observability & Context Engine",
  description: "Deterministic execution tracing, 4-tier context compression, and live self-healing pipelines for autonomous coding agents.",
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
