"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import SancionCard from "@/components/sancion-card"; 
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

type Sancion = {
  id_sancion: number;
  fechaSancion: string;
  motivo: string;
  descripcion: string;
  nombrePiloto: string;
  nombreCarrera: string;
};

type EscuderiaConSanciones = {
  id_escuderia: number;
  nombreEscuderia: string;
  color: string; 
  logo: string;  
  sanciones: Sancion[];
};

export default function SancionesPorEscuderia() {
  const [escuderias, setEscuderias] = useState<EscuderiaConSanciones[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchEscuderiasConSanciones = async () => {
      // 1️⃣ Traer todas las escuderías activas con sus datos de estilo
      const { data: escuderiasData, error: escuderiasError } = await supabase
        .from("Escuderia")
        .select("id_escuderia, nombre, color, logo") 
        .eq("activo", true)
        .order("nombre");

      if (escuderiasError || !escuderiasData) {
        console.error("Error cargando escuderías:", escuderiasError?.message);
        return;
      }

      // 2️⃣ Para cada escudería, traer sanciones de sus pilotos
      const escuderiasConSanciones = await Promise.all(
        escuderiasData.map(async (esc: any) => {
          // Pilotos de la escudería
          const { data: pilotosData } = await supabase
            .from("PilotoTieneEscuderia")
            .select("id_piloto")
            .eq("id_escuderia", esc.id_escuderia);

          const pilotoIds = pilotosData?.map((p: any) => p.id_piloto) || [];

          if (pilotoIds.length === 0) {
            return { 
                id_escuderia: esc.id_escuderia, 
                nombreEscuderia: esc.nombre, 
                color: esc.color, 
                logo: esc.logo, 
                sanciones: [] 
            };
          }

          // Sanciones de esos pilotos
          const sancionesPromises = pilotoIds.map(async (idPiloto: number) => {
            
            // Obtener el nombre del piloto
            const { data: pilotoInfo } = await supabase
              .from("Piloto")
              .select("nombre")
              .eq("id_piloto", idPiloto)
              .single();

            const nombrePiloto = pilotoInfo?.nombre || "Piloto Desconocido";

            const { data: sancionIdsData } = await supabase
              .from("SancionAplicaPiloto")
              .select("id_sancion")
              .eq("id_piloto", idPiloto);

            if (!sancionIdsData || sancionIdsData.length === 0) return [];

            return Promise.all(
              sancionIdsData.map(async (s: any) => {
                const { data: sancion } = await supabase
                  .from("Sancion")
                  .select("*")
                  .eq("id_sancion", s.id_sancion)
                  .single();

                // Búsqueda de la carrera relacionada
                let nombreCarrera = "-";
                const { data: correData } = await supabase
                  .from("Corre")
                  .select("id_carrera")
                  .eq("id_piloto", idPiloto);

                if (correData && correData.length > 0) {
                  const carreraIds = correData.map((c: any) => c.id_carrera);
                  const { data: carreras } = await supabase
                    .from("Carrera")
                    .select("nombre")
                    .in("id_carrera", carreraIds)
                    .eq("fecha", sancion.fecha);

                  if (carreras && carreras.length > 0) {
                    nombreCarrera = carreras[0].nombre;
                  }
                }
                
                return {
                  id_sancion: sancion.id_sancion,
                  fechaSancion: sancion.fecha,
                  motivo: sancion.motivo,
                  descripcion: sancion.descripcion ?? "-",
                  nombrePiloto: nombrePiloto,
                  nombreCarrera,
                };
              })
            );
          });

          const sancionesArrays = await Promise.all(sancionesPromises);
          const sancionesFlattened = sancionesArrays.flat();

          return {
            id_escuderia: esc.id_escuderia,
            nombreEscuderia: esc.nombre,
            color: esc.color, 
            logo: esc.logo,   
            sanciones: sancionesFlattened,
          };
        })
      );

      setEscuderias(escuderiasConSanciones);
    };

    fetchEscuderiasConSanciones();
  }, []);

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    // CAMBIO 1: Fondo de página a blanco y texto principal a negro
    <div className="flex justify-center min-h-screen p-10 bg-white text-black">
      <main className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Sanciones por Escudería</h1>
            <Link href="/client/" className="text-blue-600 hover:underline"> 
                Página principal
            </Link>
        </div>
        
        <div className="space-y-4">
          {escuderias.map(esc => {
            
            // Si el color no existe, usamos un color de fallback
            const colorFondo = esc.color ? '#' + esc.color : '#888888'; 
            let logoURL = "/icon.png"; 

            if (typeof esc.logo === "string" && esc.logo.trim() !== "") {
                try {
                    new URL(esc.logo);
                    logoURL = esc.logo;
                } catch {}
            }
            
            return (
              <div 
                key={esc.id_escuderia} 
                className="relative w-full rounded-lg shadow-lg overflow-hidden" 
                // Estilo para el encabezado de la escudería (Fondo sólido del color del equipo)
                style={{ background: colorFondo, color: '#fff' }}
              >
                <div 
                    className="relative flex items-center p-4 cursor-pointer min-h-[100px] hover:opacity-90 transition-opacity"
                    onClick={() => toggleExpanded(esc.id_escuderia)}
                >
                    {/* Nombre y Cantidad de Sanciones */}
                    <div className="text-2xl font-bold mr-4 flex-shrink-0 z-10">
                        {esc.nombreEscuderia} ({esc.sanciones.length})
                    </div>

                    {/* Logo como fondo semi-transparente */}
                    {logoURL && (
                      <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-20"> 
                          <div className="relative h-20 w-32">
                              {/* NOTE: Asegúrate de haber configurado el dominio de Supabase en next.config.js para que esto funcione */}
                              <Image
                                src={logoURL}
                                alt={`Logo de ${esc.nombreEscuderia}`}
                                fill
                                className="object-contain"
                              />
                          </div>
                      </div>
                    )}

                    {/* Flecha de expansión */}
                    <div className="ml-auto text-2xl flex-shrink-0 z-10">
                      {expandedId === esc.id_escuderia ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                </div>

                {/* Contenido de sanciones */}
                {expandedId === esc.id_escuderia && (
                  // CAMBIO 2: Fondo del contenedor de sanciones a blanco (o un gris claro)
                  <div className="p-4 border-t border-black/10 space-y-4 bg-gray-50"> 
                    {esc.sanciones.length > 0 ? (
                      esc.sanciones.map(s => (
                        <SancionCard 
                            key={s.id_sancion} 
                            sancion={s} 
                            colorEscuderia={esc.color} 
                        />
                      ))
                    ) : (
                      <p className="text-gray-600">No hay sanciones registradas para esta escudería.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}