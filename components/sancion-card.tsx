// components/sancion-card.tsx
import React from 'react';

type Sancion = {
    id_sancion: number;
    fechaSancion: string;
    descripcion: string;
    nombrePiloto: string;
    nombreCarrera: string;
    tipo: string;
    horaSancion: string;
  };

type SancionCardProps = {
  sancion: Sancion;
  colorEscuderia: string; 
};

export default function SancionCard({ sancion, colorEscuderia }: SancionCardProps) {
  
  const baseColor = colorEscuderia ? `#${colorEscuderia}` : "#888888"; 
  
  // Establecemos el color del texto a NEGRO (#000) de forma forzada,
  // como se ve en el ejemplo de PilotoCard.
  const textColor = '#000000'; 

  return (
    <div 
      className="relative w-full overflow-hidden rounded-lg shadow-lg"
      style={{
        // CAMBIO CLAVE: Degradado de blanco (o casi blanco) al color del equipo.
        // Simulamos un efecto de luz desde la izquierda.
        background: `linear-gradient(to right, #ffffff, #ffffff, ${baseColor}20, ${baseColor}50)`,
        color: textColor,
      }}
    >
      <div className="flex flex-col md:flex-row items-stretch">
        
  {/* Lado Izquierdo: Información clave (Texto Negro) */}
  <div className="p-4 md:p-6 space-y-2 w-full md:w-2/3 border-b md:border-b-0 md:border-r border-black/10 z-10">
        <p className="text-lg font-bold">
            Tipo: <span className="font-normal">{sancion.tipo}</span>
          </p>
          <p className="text-lg font-bold">
            Piloto: <span className="font-normal">{sancion.nombrePiloto}</span>
          </p>
          <p className="text-lg font-bold">
            Carrera: <span className="font-normal">{sancion.nombreCarrera}</span>
          </p>
          <p className="text-lg font-bold">
            Fecha: <span className="font-normal">{sancion.fechaSancion}</span>
          </p>
          <p className="text-lg font-bold">
            Hora: <span className="font-normal">{sancion.horaSancion}</span>
          </p>
        </div>
        
  {/* Lado Derecho: Descripción (Texto Negro) */}
  <div className="p-4 md:p-6 w-full md:w-1/3 flex flex-col justify-start z-10">
            <h4 className="text-xl font-bold mb-2">Descripción</h4>
            <p className="text-base italic font-normal text-black/80">
                {sancion.descripcion || "Descripción no proporcionada."}
            </p>
        </div>
      </div>
    </div>
  );
}