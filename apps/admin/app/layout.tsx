import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Time Machine — Admin",
  description: "Content CRUD and rights review for the Time Machine seed data.",
};

const NAV_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/websites", label: "Websites" },
  { href: "/snapshots", label: "Snapshots" },
  { href: "/sources", label: "Sources" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="top">
          <Link href="/">
            <strong>Time Machine Admin</strong>
          </Link>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
