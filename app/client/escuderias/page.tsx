// app/client/pilotos/page.tsx
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"; 
import Link from "next/link";
import EscuderiaCard from "@/components/escuderia-card";
import { Piloto } from '../pilotos/page'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

export type Escuderia = {
  id_escuderia: number;
  nombre: string;
  color: string;
  logo: string;
  pilotos?: Piloto[];
};


export default function EscuderiasPage() {
  const [listaEscuderias, setListaEscuderias] = useState<Escuderia[]>([]);
  const [filteredEscuderias, setFilteredEscuderias] = useState<Escuderia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchEscuderiasConPilotos  = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: escuderias, error: errorEsc } = await supabase
          .from("Escuderia")
          .select("id_escuderia, nombre, color, logo");

        if (errorEsc) throw errorEsc;

        const { data: relaciones, error: errorRel } = await supabase
          .from("PilotoTieneEscuderia")
          .select("id_piloto, id_escuderia, esTitular");

        if (errorRel) throw errorRel;

        const { data: pilotos, error: errorPil } = await supabase
          .from("Piloto")
          .select("id_piloto, nombre, pais, fecha_nacimiento, foto");

        if (errorPil) throw errorPil;
        
        const calcularEdad = (fechaNacimiento: string) => {
          const hoy = new Date();
          const fechaNac = new Date(fechaNacimiento);
          let edad = hoy.getFullYear() - fechaNac.getFullYear();
          const mes = hoy.getMonth() - fechaNac.getMonth();
          if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
          }
          return edad;
        };

        const escuderiasConPilotos: Escuderia[] = escuderias.map((esc) => {
          const pilotosDeEsc = relaciones
            .filter((rel) => rel.id_escuderia === esc.id_escuderia)
            .map((rel) => {
              const p = pilotos.find((pil) => pil.id_piloto === rel.id_piloto);
              if (!p) return null;
              return {
                ...p,
                edad: p.fecha_nacimiento ? calcularEdad(p.fecha_nacimiento) : undefined,
                titular: rel.esTitular ?? null,
              };
            })
            .filter(Boolean) as Piloto[];

            return {
              ...esc,
              pilotos: pilotosDeEsc,
            };
          });

      // Ordenar alfabéticamente por nombre de escudería
      escuderiasConPilotos.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
      );

      setListaEscuderias(escuderiasConPilotos);
      setFilteredEscuderias(escuderiasConPilotos);
      } catch (err: any) {
        console.error("Error al cargar pilotos:", err);
        setError(`Error al cargar los datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEscuderiasConPilotos ();
  }, []);

  // Filtrar mientras el usuario escribe
  useEffect(() => {
    const texto = busqueda.toLowerCase();
    const filtradas = listaEscuderias.filter((esc) =>
      esc.nombre.toLowerCase().includes(texto)
    );
    setFilteredEscuderias(filtradas);
  }, [busqueda, listaEscuderias]);

// -------------------------------------------------------------

 return (
        <div className="p-10 bg-white text-black">
            <div className="flex justify-between items-center mb-6">
                <input
                  type="text"
                  placeholder="Buscar escudería..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-3/4 md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Link href="/client/" className="text-blue-600 hover:underline"> 
                    Página principal
                </Link>
            </div>

            <hr className="mb-6 border-gray-300" />
            
            {/* Mensajes de estado */}
            {loading && <p>Cargando escuderias...</p>}
            {error && <p className="text-red-600 font-medium">{error}</p>}

            {!loading && !error && (
              <div className="space-y-8">
                {filteredEscuderias.length > 0 ? (
                  filteredEscuderias.map((escuderia) => (
                    <EscuderiaCard
                      key={escuderia.id_escuderia}
                      escuderia={escuderia}
                    />
                  ))
                ) : (
                  <p className="text-gray-600 italic">No se encontraron escuderías.</p>
                )}
              </div>
            )}
        </div>
    );
}