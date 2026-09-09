import { listEras } from "@time-machine/era-engine";
import { HomeTimeline } from "@/components/HomeTimeline";

export default function HomePage() {
  const eras = listEras();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-16 px-6 py-24 font-mono">
      <h1 className="text-center text-3xl font-bold tracking-widest text-white sm:text-5xl">
        WHEN DO YOU WANT TO GO?
      </h1>
      <HomeTimeline eras={eras} />
      <p className="max-w-md text-center text-sm text-neutral-500">
        Sélectionnez une époque pour démarrer la machine correspondante et explorer les réseaux et
        services numériques disponibles à cette date.
      </p>
      <a href="/admin" className="text-xs text-neutral-700 hover:text-neutral-400">
        Admin
      </a>
    </main>
  );
}
