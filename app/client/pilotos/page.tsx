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
};

//Función para calcular la edad a partir de la fecha de nacimiento
function calcularEdad(fechaNacimiento: string): number {
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
  const [listaEscuderias, setListaEscuderias] = useState<Escuderia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

            return {
              ...p,
              edad,
              pais: p.pais,
              escuderias: escuderiasPiloto.length > 0 ? escuderiasPiloto : ["Sin escudería"],
              titular: relacionesPiloto.some((rel) => rel.esTitular) || null,
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
      } catch (err: any) {
        console.error("Error al cargar pilotos:", err);
        setError(`Error al cargar los datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPilotosConEscuderia();
  }, []);
// -------------------------------------------------------------

 return (
        <div className="p-10 bg-white text-black">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Listado de Pilotos</h1>
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
                    {listaPilotos.map((piloto) => {
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