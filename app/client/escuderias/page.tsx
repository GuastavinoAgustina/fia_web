// app/client/pilotos/page.tsx
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"; 
import Link from "next/link";
import EscuderiaCard from "@/components/escuderia-card";
import { Piloto, calcularEdad } from '@/app/client/pilotos/page'

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

        const { data: carreras, error: errorCar } = await supabase
          .from("Carrera")
          .select("id_carrera, fecha, nombre");

        if (errorCar) throw errorCar;
        
        const { data: pilotoCorre, error: errorPilcor } = await supabase
          .from("Corre")
          .select("id_piloto, id_carrera, id_escuderia");

        if (errorPilcor) throw errorPilcor;

        /*const { data: categorias, error: errorCats } = await supabase
          .from("Categoria")
          .select("id_categoria, nombre");

        if (errorCats) throw errorCats; 

        const { data: categoriaCarrera, error: errorCatCar } = await supabase
          .from("CarreraTieneCategoria")
          .select("id_carrera, id_categoria");

        if (errorCatCar) throw errorCatCar;*/

        const categoria = "F1";
        const escuderiasConPilotos: Escuderia[] = escuderias.map((esc) => {
          const pilotosDeEsc = relaciones
            .filter((rel) => rel.id_escuderia === esc.id_escuderia)
            .map((rel) => {
              const p = pilotos.find((pil) => pil.id_piloto === rel.id_piloto);
              if (!p) return null;

              const carrerasPiloto = pilotoCorre?.filter((c) => c.id_piloto === p.id_piloto) ?? [];
              const carrerasDetalladas = carrerasPiloto
                .map((rel) => carreras?.find((c) => c.id_carrera === rel.id_carrera))
                .filter((c) => c && c.fecha) as { nombre: string; fecha: string }[];

              const hoy = new Date();
              const proximas = carrerasDetalladas
                .filter((c) => new Date(c.fecha) > hoy)
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

              const proximaCarrera = proximas.length > 0 ? proximas[0].nombre : "Sin próxima carrera";

              return {
                ...p,
                edad: p.fecha_nacimiento ? calcularEdad(p.fecha_nacimiento) : undefined,
                titular: rel.esTitular ?? null,
                categoria : categoria,
                proximaCarrera: proximaCarrera,
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
                  className="w-2/4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Link 
                  href="/" 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  ← Página principal
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