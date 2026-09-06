import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Time Machine — Internet History Simulator",
  description:
    "Choisissez une date, chargez une époque, et voyagez dans l'histoire de l'informatique et d'Internet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
