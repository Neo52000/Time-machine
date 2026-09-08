import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 font-mono text-neutral-300">
      <p className="text-sm uppercase tracking-widest text-neutral-500">Époque introuvable</p>
      <Link href="/" className="underline hover:text-white">
        ← Retour à la timeline
      </Link>
    </main>
  );
}
