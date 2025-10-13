"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Link from 'next/link';

// Datos simulados de eventos de F1
const eventosF1 = [
  { fecha: "2025-03-16", evento: "GP de Bahréin", tipo: "carrera" },
  { fecha: "2025-03-23", evento: "GP de Arabia Saudí", tipo: "carrera" },
  { fecha: "2025-04-13", evento: "GP de Australia", tipo: "carrera" },
  { fecha: "2025-04-27", evento: "GP de Japón", tipo: "carrera" },
  { fecha: "2025-05-04", evento: "GP de China", tipo: "carrera" },
  { fecha: "2025-05-18", evento: "GP de Miami", tipo: "carrera" },
  { fecha: "2025-05-25", evento: "GP de Emilia-Romagna", tipo: "carrera" },
  { fecha: "2025-06-01", evento: "GP de Mónaco", tipo: "carrera" },
  { fecha: "2025-06-15", evento: "GP de Canadá", tipo: "carrera" },
  { fecha: "2025-06-29", evento: "GP de España", tipo: "carrera" },
  { fecha: "2025-07-06", evento: "GP de Austria", tipo: "carrera" },
  { fecha: "2025-07-27", evento: "GP de Gran Bretaña", tipo: "carrera" },
];

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function CalendarioPage() {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any>(null);

  // Obtener el primer día del mes
  const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
  
  // Obtener el día de la semana del primer día (0 = domingo)
  const primerDiaSemana = primerDia.getDay();
  
  // Obtener el número de días en el mes
  const diasEnMes = ultimoDia.getDate();

  // Navegación entre meses
  const mesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  };

  // Obtener eventos para una fecha específica
  const obtenerEventosPorFecha = (dia: number) => {
    const fechaBuscada = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return eventosF1.filter(evento => evento.fecha === fechaBuscada);
  };

  // Generar array de días para mostrar
  const generarDias = () => {
    const dias = [];
    
    // Días vacíos al inicio del mes
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    
    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(dia);
    }
    
    return dias;
  };

  const hoy = new Date();
  const esHoy = (dia: number) => {
    return hoy.getDate() === dia && 
           hoy.getMonth() === fechaActual.getMonth() && 
           hoy.getFullYear() === fechaActual.getFullYear();
  };

  return (
    // Fondo blanco estilo sanciones
    <div className="flex justify-center min-h-screen p-10 bg-white text-black">
      <main className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold">Calendario F1 2025</h1>
          </div>
          <Link href="/" className="text-blue-600 hover:underline">
            Página principal
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendario principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border p-6">
              {/* Header del calendario */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={mesAnterior}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <h2 className="text-2xl font-semibold text-black">
                  {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
                </h2>
                
                <button
                  onClick={mesSiguiente}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {diasSemana.map((dia) => (
                  <div key={dia} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1">
                {generarDias().map((dia, index) => {
                  if (dia === null) {
                    return <div key={`empty-${index}`} className="p-3 h-24 bg-gray-50"></div>;
                  }

                  const eventos = obtenerEventosPorFecha(dia);
                  const tieneEventos = eventos.length > 0;

                  return (
                    <div
                      key={`day-${dia}-${fechaActual.getMonth()}-${fechaActual.getFullYear()}`}
                      className={`
                        p-2 h-24 border border-gray-200 cursor-pointer transition-all hover:bg-gray-50
                        ${esHoy(dia) ? 'bg-blue-100 border-blue-300' : 'bg-white'}
                        ${tieneEventos ? 'bg-red-50 border-red-200' : ''}
                      `}
                      onClick={() => tieneEventos && setEventoSeleccionado(eventos[0])}
                    >
                      <div className={`text-sm font-medium mb-1 ${esHoy(dia) ? 'text-blue-700 font-bold' : 'text-black'}`}>
                        {dia}
                      </div>
                      {tieneEventos && (
                        <div className="text-xs bg-red-600 text-white px-1 py-0.5 rounded truncate">
                          {eventos[0].evento.replace("GP de ", "")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Próximas carreras */}
            <div className="bg-white rounded-lg shadow-lg border p-6">
              <h3 className="text-xl font-semibold mb-4 text-black">Próximas Carreras</h3>
              <div className="space-y-3">
                {eventosF1.slice(0, 5).map((evento, index) => (
                  <div
                    key={`evento-${evento.fecha}-${index}`}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setEventoSeleccionado(evento)}
                  >
                    <div className="font-medium text-sm text-black">{evento.evento}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(evento.fecha).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalle del evento seleccionado */}
            {eventoSeleccionado && (
              <div className="bg-white rounded-lg shadow-lg border p-6">
                <h3 className="text-xl font-semibold mb-4 text-black">Detalle del Evento</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Evento</label>
                    <p className="text-lg font-semibold text-black">{eventoSeleccionado.evento}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha</label>
                    <p className="text-black">{new Date(eventoSeleccionado.fecha).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      weekday: 'long'
                    })}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <p className="capitalize text-black">{eventoSeleccionado.tipo}</p>
                  </div>
                  <button
                    onClick={() => setEventoSeleccionado(null)}
                    className="w-full mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* Leyenda */}
            <div className="bg-white rounded-lg shadow-lg border p-6">
              <h3 className="text-lg font-semibold mb-3 text-black">Leyenda</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-sm text-black">Día actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                  <span className="text-sm text-black">Gran Premio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}