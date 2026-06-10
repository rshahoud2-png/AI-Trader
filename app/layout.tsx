import type { Metadata } from "next";
import Link from "next/link";
import { RadioTower, ShieldAlert } from "lucide-react";
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
          <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/88 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded border border-cyan/30 bg-cyan/15 text-cyan shadow-glow">
                  <ShieldAlert size={23} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan">Paper Trading Only</p>
                  <h1 className="text-lg font-semibold text-white">AI Market Research Command Center</h1>
                </div>
              </Link>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex items-center gap-2 rounded border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-mint">
                  <RadioTower size={14} /> Polygon Live
                </div>
                <nav className="flex gap-2">
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded border border-line bg-panel/80 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan hover:bg-cyan/10 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
