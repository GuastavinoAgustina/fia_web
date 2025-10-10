"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

// [ ... getEscuderiaColor function remains the same ... ]

/**
 * Función auxiliar para obtener el color de fondo y el color de texto de la escudería.
 * Se basa en los colores visibles en las imágenes.
 * @param nombre Nombre de la escudería
 * @returns {bgColor: string, textColor: string, tableRowEvenColor: string, tableRowOddColor: string, tableHeaderColor: string} Clases de Tailwind CSS para el color.
 */
const getEscuderiaColor = (nombre: string): {
  bgColor: string;
  textColor: string;
  tableRowEvenColor: string;
  tableRowOddColor: string;
  tableHeaderColor: string;
  tableBorderColor: string;
} => {
  const nombreNormalizado = nombre.toLowerCase().trim();

  if (nombreNormalizado.includes("mercedes")) {
    return {
      bgColor: "bg-black",
      textColor: "text-white",
      tableRowEvenColor: "bg-gray-900", // Más oscuro para filas pares
      tableRowOddColor: "bg-gray-800",  // Más claro para filas impares
      tableHeaderColor: "bg-gray-700", // Encabezado de tabla
      tableBorderColor: "border-gray-600"
    };
  }
  if (nombreNormalizado.includes("red bull")) {
    return {
      bgColor: "bg-blue-600",
      textColor: "text-white",
      tableRowEvenColor: "bg-blue-800",
      tableRowOddColor: "bg-blue-700",
      tableHeaderColor: "bg-blue-900",
      tableBorderColor: "border-blue-500"
    };
  }
  if (nombreNormalizado.includes("alpine")) {
    return {
      bgColor: "bg-blue-400",
      textColor: "text-black",
      tableRowEvenColor: "bg-blue-200",
      tableRowOddColor: "bg-blue-100",
      tableHeaderColor: "bg-blue-300",
      tableBorderColor: "border-blue-300"
    };
  }
  if (nombreNormalizado.includes("aston martin")) {
    return {
      bgColor: "bg-emerald-800",
      textColor: "text-white",
      tableRowEvenColor: "bg-emerald-900",
      tableRowOddColor: "bg-emerald-700",
      tableHeaderColor: "bg-emerald-950",
      tableBorderColor: "border-emerald-600"
    };
  }
  if (nombreNormalizado.includes("ferrari")) {
    return {
      bgColor: "bg-red-600",
      textColor: "text-white",
      tableRowEvenColor: "bg-red-900",
      tableRowOddColor: "bg-red-700",
      tableHeaderColor: "bg-red-950",
      tableBorderColor: "border-red-500"
    };
  }
  if (nombreNormalizado.includes("mclaren")) {
    return {
      bgColor: "bg-orange-500",
      textColor: "text-black",
      tableRowEvenColor: "bg-orange-300",
      tableRowOddColor: "bg-orange-200",
      tableHeaderColor: "bg-orange-400",
      tableBorderColor: "border-orange-400"
    };
  }
  if (nombreNormalizado === "nano") {
    return {
      bgColor: "bg-fuchsia-600",
      textColor: "text-white",
      tableRowEvenColor: "bg-fuchsia-800",
      tableRowOddColor: "bg-fuchsia-700",
      tableHeaderColor: "bg-fuchsia-900",
      tableBorderColor: "border-fuchsia-500"
    };
  }

  // Color por defecto para cualquier otra escudería
  return {
    bgColor: "bg-gray-800",
    textColor: "text-white",
    tableRowEvenColor: "bg-gray-700",
    tableRowOddColor: "bg-gray-600",
    tableHeaderColor: "bg-gray-900",
    tableBorderColor: "border-gray-500"
  };
};

type Sancion = {
  id_sancion: number;
  fechaSancion: string;
  motivo: string;
  descripcion: string;
  nombrePiloto: string; // <-- Aseguramos que existe
  nombreCarrera: string;
};

type EscuderiaConSanciones = {
  id_escuderia: number;
  nombreEscuderia: string;
  sanciones: Sancion[];
};

export default function SancionesPorEscuderia() {
  const [escuderias, setEscuderias] = useState<EscuderiaConSanciones[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchEscuderiasConSanciones = async () => {
      // 1️⃣ Traer todas las escuderías activas
      const { data: escuderiasData, error: escuderiasError } = await supabase
        .from("Escuderia")
        .select("id_escuderia, nombre")
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
            return { id_escuderia: esc.id_escuderia, nombreEscuderia: esc.nombre, sanciones: [] };
          }

          // Sanciones de esos pilotos
          const sancionesPromises = pilotoIds.map(async (idPiloto: number) => {
            // ⭐ NUEVO PASO: Obtener el nombre del piloto
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

                // Carrera relacionada (fecha de sanción)
                let nombreCarrera = "-";
                // Este bloque de código para buscar la carrera asociada es complejo
                // y asume que la sanción tiene una fecha que coincide con una carrera
                // donde corrió el piloto.
                // Lo mantengo, pero puede ser la fuente de que 'nombreCarrera' sea '-'
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
                
                // ⭐ INCLUIR el nombre del piloto en el objeto de sanción
                return {
                  id_sancion: sancion.id_sancion,
                  fechaSancion: sancion.fecha,
                  motivo: sancion.motivo,
                  descripcion: sancion.descripcion ?? "-",
                  nombrePiloto: nombrePiloto, // ⭐ ¡Ahora tenemos el nombre!
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

  // [ ... JSX renderizado permanece igual ... ]

  return (
    <div className="flex justify-center min-h-screen p-10 bg-gray-900 text-white">
      <main className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Sanciones por Escudería</h1>

        <div className="space-y-4">
          {escuderias.map(esc => {
            const { bgColor, textColor, tableRowEvenColor, tableRowOddColor, tableHeaderColor, tableBorderColor } = getEscuderiaColor(esc.nombreEscuderia);
            return (
              <div
                key={esc.id_escuderia}
                className={`border ${tableBorderColor} rounded shadow-lg overflow-hidden`}
              >
                <button
                  onClick={() => toggleExpanded(esc.id_escuderia)}
                  className={`w-full text-left px-4 py-2 ${bgColor} ${textColor} font-semibold hover:opacity-90 transition-opacity`}
                >
                  {esc.nombreEscuderia} ({esc.sanciones.length} sanciones)
                </button>

                {expandedId === esc.id_escuderia && esc.sanciones.length > 0 && (
                  <div className={`p-4 ${tableHeaderColor} ${textColor}`}>
                    <table className={`w-full border-collapse ${textColor}`}>
                      <thead>
                        <tr>
                          <th className={`border ${tableBorderColor} px-4 py-2 text-left ${tableHeaderColor}`}>Fecha Sanción</th>
                          <th className={`border ${tableBorderColor} px-4 py-2 text-left ${tableHeaderColor}`}>Motivo</th>
                          <th className={`border ${tableBorderColor} px-4 py-2 text-left ${tableHeaderColor}`}>Nombre Piloto</th>
                          <th className={`border ${tableBorderColor} px-4 py-2 text-left ${tableHeaderColor}`}>Descripción</th>
                          <th className={`border ${tableBorderColor} px-4 py-2 text-left ${tableHeaderColor}`}>Nombre Carrera</th>
                        </tr>
                      </thead>
                      <tbody>
                        {esc.sanciones.map((s, index) => (
                          <tr key={s.id_sancion} className={`${index % 2 === 0 ? tableRowEvenColor : tableRowOddColor} hover:opacity-90 transition-opacity`}>
                            <td className={`border ${tableBorderColor} px-4 py-2`}>{s.fechaSancion}</td>
                            <td className={`border ${tableBorderColor} px-4 py-2`}>{s.motivo}</td>
                            <td className={`border ${tableBorderColor} px-4 py-2`}>{s.nombrePiloto}</td>
                            <td className={`border ${tableBorderColor} px-4 py-2`}>{s.descripcion}</td>
                            <td className={`border ${tableBorderColor} px-4 py-2`}>{s.nombreCarrera}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {expandedId === esc.id_escuderia && esc.sanciones.length === 0 && (
                  <div className={`p-4 ${tableRowOddColor} ${textColor}`}>No hay sanciones para esta escudería.</div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}