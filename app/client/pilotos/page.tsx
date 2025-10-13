// app/client/pilotos/page.tsx
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"; 
import { Escuderia } from "../escuderias/page";
import Link from "next/link";
import PilotoCard from "@/components/piloto-card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

export type Piloto = {
  id_piloto: number;
  nombre: string;
  pais: string;
  foto?: string | null;
  edad? : number;
  escuderias?: string[];
  titular?: boolean | null;
  proximaCarrera?: string | null;
  categoria? : string
};

//Función para calcular la edad a partir de la fecha de nacimiento
export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const fechaNac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }

  return edad;
}

export default function PilotosPage() {
  const [listaPilotos, setListaPilotos] = useState<Piloto[]>([]);
  const [filteredPilotos, setFilteredPilotos] = useState<Piloto[]>([]);
  const [listaEscuderias, setListaEscuderias] = useState<Escuderia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchPilotosConEscuderia = async () => {
      setLoading(true);
      setError(null);

      try {
        
        const { data: pilotos, error: errorPilotos } = await supabase
          .from("Piloto")
          .select("id_piloto, nombre, fecha_nacimiento, pais, foto");

        if (errorPilotos) throw errorPilotos;

        const { data: relaciones, error: errorRel } = await supabase
          .from("PilotoTieneEscuderia")
          .select("id_piloto, id_escuderia, esTitular");

        if (errorRel) throw errorRel;

        const { data: escuderias, error: errorEsc } = await supabase
          .from("Escuderia")
          .select("id_escuderia, nombre, logo, color");

        if (errorEsc) throw errorEsc;
        
        const { data: carreras, error: errorCar } = await supabase
          .from("Carrera")
          .select("id_carrera, fecha, nombre");

        if (errorCar) throw errorCar;
        
        const { data: pilotoCorre, error: errorPilcor } = await supabase
          .from("Corre")
          .select("id_piloto, id_carrera, id_escuderia");

        if (errorPilcor) throw errorPilcor;

        const { data: categorias, error: errorCateg } = await supabase
          .from("Categoria")
          .select("id_categoria, nombre");

        if (errorCateg) throw errorCateg;

        /*const { data: categoriaCarrera, error: errorCategCarr } = await supabase
          .from("CategoriaTieneCarrera")
          .select("id_categoria, id_carrera");

        if (errorCategCarr) throw errorCategCarr;*/

        setListaEscuderias(escuderias ?? []);

        // Join de pilotos con escuderías a traves de la relacion
        const resultado: Piloto[] =
          pilotos?.map((p) => {
            const relacionesPiloto = relaciones?.filter(
              (r) => r.id_piloto === p.id_piloto
            ) ?? [];

            const escuderiasPiloto = relacionesPiloto.map((rel) => {
              const esc = escuderias?.find(
                (e) => e.id_escuderia === rel.id_escuderia
              );
              return esc ? esc.nombre : "Desconocida";
            });

            const edad = p.fecha_nacimiento
              ? calcularEdad(p.fecha_nacimiento)
              : undefined;

              const carrerasPiloto = pilotoCorre?.filter((c) => c.id_piloto === p.id_piloto) ?? [];
              const carrerasDetalladas = carrerasPiloto
                .map((rel) => carreras?.find((c) => c.id_carrera === rel.id_carrera))
                .filter((c) => c && c.fecha) as { nombre: string; fecha: string }[];

              const hoy = new Date();
              const proximas = carrerasDetalladas
                .filter((c) => new Date(c.fecha) > hoy)
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

              const proximaCarrera = proximas.length > 0 ? proximas[0].nombre : "Sin próxima carrera";

              const categoria = "F1"
              //TO DO: Revisar como conseguimos las categorías desde la bd
            return {
              ...p,
              edad,
              pais: p.pais,
              escuderias: escuderiasPiloto.length > 0 ? escuderiasPiloto : ["Sin escudería"],
              titular: relacionesPiloto.some((rel) => rel.esTitular) || null,
              proximaCarrera,
              categoria,
            };
        }) ?? [];

          //Sort del resultado por orden alfabético
          resultado.sort((a, b) => {
            const escA = a.escuderias?.[0]?.toLowerCase() ?? "";
            const escB = b.escuderias?.[0]?.toLowerCase() ?? "";

            if (escA < escB) return -1;
            if (escA > escB) return 1;

            const nomA = a.nombre.toLowerCase();
            const nomB = b.nombre.toLowerCase();
            if (nomA < nomB) return -1;
            if (nomA > nomB) return 1;
            return 0;
          });

        setListaPilotos(resultado);
        setFilteredPilotos(resultado);
      } catch (err: any) {
        console.error("Error al cargar pilotos:", err);
        setError(`Error al cargar los datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPilotosConEscuderia();
  }, []);

    // Filtrar mientras el usuario escribe
  useEffect(() => {
    const texto = busqueda.toLowerCase();
    const filtrados = listaPilotos.filter((p) =>
      p.nombre.toLowerCase().includes(texto)
    );
    setFilteredPilotos(filtrados);
  }, [busqueda, listaEscuderias]);
// -------------------------------------------------------------

 return (
        <div className="p-10 bg-white text-white">
            <div className="flex justify-between items-center mb-6">
                <input
                  type="text"
                  placeholder="Buscar piloto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Link href="/client/" className="text-blue-600 hover:underline"> 
                    Página principal
                </Link>
            </div>

            <hr className="mb-6 border-gray-300" />
            
            {/* Mensajes de estado */}
            {loading && <p>Cargando pilotos...</p>}
            {error && <p className="text-red-600 font-medium">{error}</p>}

            {/* Renderizado de la lista de pilotos (El paso final) */}
            {!loading && !error && (
                // Usamos 'space-y-8' para dejar espacio entre cada tarjeta de piloto
                <div className="space-y-8"> 
                    {filteredPilotos.map((piloto) => {
                    let colorFondo;

                    if (piloto.escuderias && piloto.escuderias.length === 1) {
                      const esc = listaEscuderias.find(
                        (e) => e.nombre === piloto.escuderias![0]
                      );
                      if (esc?.color) colorFondo = esc.color;
                    }

                    return (
                      <PilotoCard
                        key={piloto.id_piloto}
                        piloto={piloto}
                        colorFondo={colorFondo}
                      />
                    );
                  })}
                </div>
            )}
        </div>
    );

}