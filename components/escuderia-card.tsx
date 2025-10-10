// components/escuderia-card.tsx
import Image from 'next/image';
import { useState } from 'react';
import { Escuderia} from '../app/client/escuderias/page';
import { Piloto } from '../app/client/pilotos/page'
import PilotoCard from './piloto-card';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa'; // Para la flecha

type EscuderiaCardProps = {
  escuderia: Escuderia & { pilotos?: Piloto[] };
};

export default function EscuderiaCar({ escuderia }:
   EscuderiaCardProps) {
  const [expanded, setExpanded] = useState(false);

  const nombre = escuderia.nombre || "Sin nombre"; 
  const color = escuderia.color ? '#' + escuderia.color : '#ec0000ff';
  const pilotos = escuderia.pilotos || [];
  let logoURL = "/icon.png"; // fallback por defecto

  if (typeof escuderia.logo === "string" && escuderia.logo.trim() !== "") {
    try {
      // Si la URL es válida, la usamos
      new URL(escuderia.logo);
      logoURL = escuderia.logo;
    } catch {}
  }

 return (
    <div className="relative w-full rounded-lg shadow-lg overflow-hidden" style={{ background: color, color: '#fff' }}>
      
      {/* Header de la card */}
      <div 
        className="relative flex items-center p-4 cursor-pointer min-h-[100px]"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Nombre a la izquierda */}
        <div className="text-2xl font-bold mr-4 flex-shrink-0 z-10">
          {nombre}
        </div>

        {/* Logo centrado con tamaño fijo y manteniendo proporción */}
        {logoURL && (
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="relative h-20 w-32">
                <Image
                  src={logoURL}
                  alt={`Logo de ${nombre}`}
                  fill
                  className="object-contain max-h-24 max-w-28"
                />
            </div>
          </div>
        )}

        {/* Flecha a la derecha */}
        <div className="ml-auto text-2xl flex-shrink-0 z-10">
          {expanded ? <FaChevronDown /> : <FaChevronRight />}
        </div>
      </div>

      {/* Pilotos, solo si está expandida */}
      {expanded && (
        <div className="p-4 border-t border-white/50 space-y-4">
          {pilotos.length > 0 ? (
            pilotos.map((piloto) => (
              <PilotoCard key={piloto.id_piloto} piloto={piloto} escuderiaContexto={escuderia.nombre}/>
            ))
          ) : (
            <p className="text-white/80">No hay pilotos asignados.</p>
          )}
        </div>
      )}
    </div>
  );
}