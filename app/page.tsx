// app/page.tsx
"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col justify-between items-center px-4 py-8">
      {/* Encabezado arriba */}
      <h1 className="text-4xl font-bold">Página de gestión Fia-Web</h1>

      {/* Botones centrados */}
      <div className="flex flex-col gap-6 w-full max-w-xs mb-auto mt-auto">
        <Link
          href="/perfiles"
          className="rounded-lg bg-blue-600 px-6 py-3 text-center text-white font-semibold shadow hover:bg-blue-700 transition"
        >
          Gestión de perfiles
        </Link>

        <Link
          href="/pilotos"
          className="rounded-lg bg-green-600 px-6 py-3 text-center text-white font-semibold shadow hover:bg-green-700 transition"
        >
          Gestión de pilotos
        </Link>

        <Link
          href="/puntos"
          className="rounded-lg bg-purple-600 px-6 py-3 text-center text-white font-semibold shadow hover:bg-purple-700 transition"
        >
          Gestión de puntos
        </Link>
      </div>
    </main>
  );
}
