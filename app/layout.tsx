import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paper Trading AI Command Center",
  description: "Educational fake-money paper trading dashboard with AI-style market research."
};

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/settings", label: "Settings" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="grid-bg min-h-screen">
          <header className="border-b border-line/80 bg-ink/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-cyan/15 text-cyan">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan">Paper Trading Only</p>
                  <h1 className="text-lg font-semibold text-white">AI Market Research Command Center</h1>
                </div>
              </Link>
              <nav className="flex gap-2">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded border border-line bg-panel/80 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
