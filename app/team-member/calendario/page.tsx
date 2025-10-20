"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Link from 'next/link';
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Evento = {
  fecha: string;
  evento: string;
  tipo: string;
  id_carrera?: number;
  id_pruebaneumatico?: number;
  id_control_tecnico?: number;
  [key: string]: any;
};

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function CalendarioPage() {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalleExtra, setDetalleExtra] = useState<any[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Estado para saber si los nombres de detalles están cargando
  const [detallesCargando, setDetallesCargando] = useState(true);

  // Estado para guardar los detalles con nombres ya resueltos
  const [detallesResueltos, setDetallesResueltos] = useState<any[]>([]);

  // Estado para filtros de búsqueda
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroLugar, setFiltroLugar] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // Estado para resultados filtrados
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Evento[]>([]);

  // Estado para mostrar/ocultar el menú de filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // Estado para filtros temporales antes de buscar
  const [tempFiltroFecha, setTempFiltroFecha] = useState("");
  const [tempFiltroLugar, setTempFiltroLugar] = useState("");
  const [tempFiltroCategoria, setTempFiltroCategoria] = useState("");
  // Estado para saber si se hizo una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Ref para el apartado de detalles
  const detallesRef = useRef<HTMLDivElement>(null);

  // Cargar eventos desde la base de datos
  useEffect(() => {
    fetchEventos();
  }, []);

  async function fetchEventos() {
    setLoading(true);

    // Carrera
    const { data: carreras } = await supabase
      .from("Carrera")
      .select("*");

    // PruebaNeumatico
    const { data: pruebas } = await supabase
      .from("PruebaNeumatico")
      .select("*");

    // ControlTecnico
    const { data: controles } = await supabase
      .from("ControlTecnico")
      .select("*");

    const eventosBD: Evento[] = [];

    if (carreras) {
      carreras.forEach((c: any) => {
        eventosBD.push({
          ...c,
          fecha: c.fecha,
          evento: c.nombre ? `Carrera: ${c.nombre}` : `Carrera en ${c.lugar}`,
          tipo: "carrera",
          id_carrera: c.id_carrera
        });
      });
    }
    if (pruebas) {
      pruebas.forEach((p: any) => {
        eventosBD.push({
          ...p,
          fecha: p.fecha,
          evento: "Prueba de Neumáticos",
          tipo: "prueba",
          id_prueba_neumatico: p.id_prueba_neumatico
        });
      });
    }
    if (controles) {
      controles.forEach((ct: any) => {
        eventosBD.push({
          ...ct,
          fecha: ct.fecha,
          evento: "Control Técnico",
          tipo: "control",
          id_control_tecnico: ct.id_control_tecnico
        });
      });
    }

    eventosBD.sort((a, b) => a.fecha.localeCompare(b.fecha));
    setEventos(eventosBD);
    setLoading(false);
  }

  // Cargar detalles extra según el tipo de evento
  useEffect(() => {
    setDetalleExtra([]);
    if (!eventoSeleccionado) return;
    fetchDetalleExtra(eventoSeleccionado);
  }, [eventoSeleccionado]);

  async function fetchDetalleExtra(evento: Evento) {
    setLoadingDetalle(true);

    if (evento.tipo === "carrera" && evento.id_carrera) {
      const { data: corre } = await supabase
        .from("Corre")
        .select("*")
        .eq("id_carrera", evento.id_carrera);
      setDetalleExtra(corre ?? []);
    }
    if (evento.tipo === "prueba" && evento.id_prueba_neumatico) { // <-- corregido aquí
      const { data: pruebas } = await supabase
        .from("PruebaSobreEscuderia")
        .select("*")
        .eq("id_prueba_neumatico", evento.id_prueba_neumatico); // <-- corregido aquí
      setDetalleExtra(pruebas ?? []);
    }
    if (evento.tipo === "control" && evento.id_control_tecnico) {
      const { data: controles } = await supabase
        .from("ControlSobreEscuderia")
        .select("*")
        .eq("id_control_tecnico", evento.id_control_tecnico);
      setDetalleExtra(controles ?? []);
    }

    setLoadingDetalle(false);
  }

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
    return eventos.filter(evento => evento.fecha.startsWith(fechaBuscada));
  };

  // Generar array de días para mostrar
  const generarDias = () => {
    const dias = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
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

  // Próximos eventos (los siguientes 5 a partir de hoy)
  const proximosEventos = eventos
    .filter(e => new Date(e.fecha) >= hoy)
    .slice(0, 5);

  // Efecto para cargar los detalles con nombres
  useEffect(() => {
    setDetallesCargando(true);
    setDetallesResueltos([]);
    if (!eventoSeleccionado || detalleExtra.length === 0) {
      setDetallesCargando(false);
      return;
    }

    // Función auxiliar para obtener nombre de escudería
    const getEscuderiaNombre = async (id: number) => {
      const { data } = await supabase
        .from("Escuderia")
        .select("nombre")
        .eq("id_escuderia", id)
        .single();
      return data?.nombre ?? id;
    };

    // Función auxiliar para obtener nombre de piloto
    const getPilotoNombre = async (id: number) => {
      const { data } = await supabase
        .from("Piloto")
        .select("nombre")
        .eq("id_piloto", id)
        .single();
      return data?.nombre ?? id;
    };

    // Resolver detalles según tipo
    (async () => {
      if (eventoSeleccionado.tipo === "carrera") {
        const detalles = await Promise.all(detalleExtra.map(async (item: any) => ({
          piloto: item.id_piloto ? await getPilotoNombre(item.id_piloto) : null,
          escuderia: item.id_escuderia ? await getEscuderiaNombre(item.id_escuderia) : null,
          puntaje: item.puntaje ?? null
        })));
        setDetallesResueltos(detalles);
      } else if (eventoSeleccionado.tipo === "prueba") {
        const detalles = await Promise.all(detalleExtra.map(async (item: any) => ({
          escuderia: item.id_escuderia ? await getEscuderiaNombre(item.id_escuderia) : null,
          informacion: item.informacion ?? null
        })));
        setDetallesResueltos(detalles);
      } else if (eventoSeleccionado.tipo === "control") {
        const detalles = await Promise.all(detalleExtra.map(async (item: any) => ({
          escuderia: item.id_escuderia ? await getEscuderiaNombre(item.id_escuderia) : null,
          id_control_tecnico: item.id_control_tecnico ?? null,
          informacion: item.informacion ?? null
        })));
        setDetallesResueltos(detalles);
      }
      setDetallesCargando(false);
    })();
  }, [eventoSeleccionado, detalleExtra]);

  // Filtrar carreras cuando cambian los filtros (solo si se hizo búsqueda)
  useEffect(() => {
    if (!busquedaRealizada) {
      setResultadosBusqueda([]);
      return;
    }
    const carreras = eventos.filter(e => e.tipo === "carrera");
    const filtradas = carreras.filter(c => {
      const coincideFecha = filtroFecha ? c.fecha.startsWith(filtroFecha) : true;
      const coincideLugar = filtroLugar ? c.lugar?.toLowerCase().includes(filtroLugar.toLowerCase()) : true;
      const coincideCategoria = filtroCategoria ? String(c.id_categoria) === filtroCategoria : true;
      return coincideFecha && coincideLugar && coincideCategoria;
    });
    setResultadosBusqueda(filtradas);
  }, [filtroFecha, filtroLugar, filtroCategoria, eventos, busquedaRealizada]);

  // Efecto para hacer scroll cuando se terminan de cargar los detalles
  useEffect(() => {
    if (!detallesCargando && eventoSeleccionado && detallesRef.current) {
      detallesRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [detallesCargando, eventoSeleccionado]);

  return (
    <div className="flex justify-center min-h-screen p-10 bg-white text-black">
      <main className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold">Calendario de Eventos</h1>
          </div>
          <Link href="/" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
            ← Página principal
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

                  const eventosDia = obtenerEventosPorFecha(dia);
                  const tieneEventos = eventosDia.length > 0;

                  return (
                    <div
                      key={`day-${dia}-${fechaActual.getMonth()}-${fechaActual.getFullYear()}`}
                      className={`
                        p-2 h-24 border border-gray-200 cursor-pointer transition-all hover:bg-gray-50
                        ${esHoy(dia) ? 'bg-blue-100 border-blue-300' : 'bg-white'}
                        ${tieneEventos ? 'bg-red-50 border-red-200' : ''}
                      `}
                      onClick={() => tieneEventos && setEventoSeleccionado(eventosDia[0])}
                    >
                      <div className={`text-sm font-medium mb-1 ${esHoy(dia) ? 'text-blue-700 font-bold' : 'text-black'}`}>
                        {dia}
                      </div>
                      {tieneEventos && (
                        <div
                          className="text-xs bg-red-600 text-white px-1 py-0.5 rounded truncate"
                          title={eventosDia[0].evento} // <-- muestra el título completo al hacer hover
                        >
                          {eventosDia[0].evento}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Espacio entre calendario y detalles */}
            <div className="my-6"></div>

            {/* Detalle del evento seleccionado */}
            {eventoSeleccionado && (
              <div
                ref={detallesRef}
                className="bg-white rounded-lg shadow-lg border p-6"
              >
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
                  {/* Mostrar nombre de categoría para carreras */}
                  {eventoSeleccionado.tipo === "carrera" && eventoSeleccionado.id_categoria && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Categoría</label>
                      <p className="text-black">
                        <CategoriaNombre id={eventoSeleccionado.id_categoria} />
                      </p>
                    </div>
                  )}
                  {/* Mostrar lugar para carreras */}
                  {eventoSeleccionado.tipo === "carrera" && eventoSeleccionado.lugar && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lugar</label>
                      <p className="text-black">{eventoSeleccionado.lugar}</p>
                    </div>
                  )}

                  {/* Mostrar loader hasta que los nombres estén resueltos */}
                  {detallesCargando ? (
                    <div className="text-gray-500">Cargando detalles...</div>
                  ) : (
                    detallesResueltos.length > 0 && (
                      <>
                        {/* Control Técnico */}
                        {eventoSeleccionado.tipo === "control" && detallesResueltos.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            {item.escuderia && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Escudería</label>
                                <div className="text-black">{item.escuderia}</div>
                              </div>
                            )}
                            {item.id_control_tecnico && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Id de control técnico</label>
                                <div className="text-black">{item.id_control_tecnico}</div>
                              </div>
                            )}
                            {item.informacion && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Más información</label>
                                <div className="text-black">{item.informacion}</div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Prueba de Neumáticos */}
                        {eventoSeleccionado.tipo === "prueba" && detallesResueltos.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            {item.escuderia && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Escudería</label>
                                <div className="text-black">{item.escuderia}</div>
                              </div>
                            )}
                            {item.informacion && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Más información</label>
                                <div className="text-black">{item.informacion}</div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Carrera */}
                        {eventoSeleccionado.tipo === "carrera" && detallesResueltos.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Pilotos</label>
                            <div>
                              {[...detallesResueltos]
                                .sort((a, b) => (b.puntaje ?? 0) - (a.puntaje ?? 0))
                                .map((item, idx) => {
                                  const esFutura = new Date(eventoSeleccionado.fecha) > new Date();
                                  return (
                                    <div key={idx} className="mb-2">
                                      <span className="font-semibold">{item.piloto}</span>
                                      {" - "}
                                      <span>{item.escuderia}</span>
                                      {!esFutura && item.puntaje !== undefined && item.puntaje !== null && (
                                        <>
                                          <br />
                                          <span className="text-blue-700">Puntaje: {item.puntaje}</span>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  )}
                  <button
                    onClick={() => setEventoSeleccionado(null)}
                    className="w-full mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Buscar carrera */}
            <div className="bg-white rounded-lg shadow-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-black">Buscar carrera</h3>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={() => setMostrarFiltros((prev) => !prev)}
                >
                  Filtrar
                </button>
              </div>
              {/* Dropdown de filtros */}
              {mostrarFiltros && (
                <form className="space-y-3 mb-4 bg-white p-4 rounded shadow" onSubmit={e => {
                  e.preventDefault();
                  setFiltroFecha(tempFiltroFecha);
                  setFiltroLugar(tempFiltroLugar);
                  setFiltroCategoria(tempFiltroCategoria);
                  setBusquedaRealizada(true);
                  setMostrarFiltros(false);
                }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 w-full bg-white"
                      style={{ minWidth: '100%' }}
                      value={tempFiltroFecha}
                      onChange={e => setTempFiltroFecha(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Circuitos</label>
                    <div className="relative">
                      <select
                        className="border rounded px-2 py-1 w-full bg-white"
                        style={{ minWidth: '100%' }}
                        size={Math.min(5, [...new Set(eventos.filter(e => e.tipo === "carrera").map(e => e.lugar))].length || 1)}
                        value={tempFiltroLugar}
                        onChange={e => setTempFiltroLugar(e.target.value)}
                      >
                        <option value="" className="rounded px-2 py-1 w-full bg-white text-black" title="Todos">Todos</option>
                        {[...new Set(eventos.filter(e => e.tipo === "carrera").map(e => e.lugar))]
                          .filter(Boolean)
                          .map(lugar => (
                            <option key={lugar} value={lugar} className="rounded px-2 py-1 w-full bg-white text-black truncate" title={lugar} >{lugar}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Categoría</label>
                    <div className="relative">
                      <select
                        className="border rounded px-2 py-1 w-full bg-white"
                        style={{ minWidth: '100%' }}
                        size={Math.min(5, [...new Set(eventos.filter(e => e.tipo === "carrera").map(e => e.id_categoria))].length || 1)}
                        value={tempFiltroCategoria}
                        onChange={e => setTempFiltroCategoria(e.target.value)}
                      >
                        <option value="" className="rounded px-2 py-1 w-full bg-white text-black">Todas</option>
                        {[...new Set(eventos.filter(e => e.tipo === "carrera").map(e => e.id_categoria))]
                          .filter(Boolean)
                          .map(id => (
                            <option key={id} value={id} className="rounded px-2 py-1 w-full bg-white text-black">
                              <CategoriaNombre id={id} />
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Buscar
                    </button>
                  </div>
                </form>
              )}
              {/* Resultados de búsqueda */}
              <div className="mt-4">
                {!busquedaRealizada ? (
                  <div className="text-gray-500">Seleccione filtros para empezar a buscar</div>
                ) : resultadosBusqueda.length === 0 ? (
                  <div className="text-gray-500">No se encontraron carreras.</div>
                ) : (
                  <ul className="space-y-2">
                    {resultadosBusqueda.map(c => (
                      <li
                        key={c.id_carrera}
                        className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => setEventoSeleccionado(c)}
                      >
                        <div className="font-semibold">{c.evento}</div>
                        <div className="text-xs text-gray-600">
                          {new Date(c.fecha).toLocaleDateString('es-ES')}
                          {" | "}
                          {c.lugar}
                          {" | "}
                          <CategoriaNombre id={c.id_categoria} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

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
                  <span className="text-sm text-black">Evento</span>
                </div>
              </div>
            </div>

            {/* Próximos eventos */}
            <div className="bg-white rounded-lg shadow-lg border p-6">
              <h3 className="text-xl font-semibold mb-4 text-black">Próximos Eventos</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-gray-500">Cargando...</div>
                ) : proximosEventos.length === 0 ? (
                  <div className="text-gray-500">No hay próximos eventos.</div>
                ) : (
                  proximosEventos.map((evento, index) => (
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
                      <div className="text-xs capitalize text-gray-500">{evento.tipo}</div>
                    </div>
                  ))
                )}
              </div>
            </div>


          </div>
        </div>
      </main>
    </div>
  );
}

// Componente para mostrar el nombre de la escudería dado su id
function EscuderiaNombre({ id, onLoaded }: { id: number, onLoaded?: () => void }) {
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchNombre() {
      const { data } = await supabase
        .from("Escuderia")
        .select("nombre")
        .eq("id_escuderia", id)
        .single();
      if (mounted) {
        setNombre(data?.nombre ?? "");
        if (onLoaded) onLoaded();
      }
    }
    fetchNombre();
    return () => { mounted = false; };
  }, [id, onLoaded]);

  if (nombre === null) return null;
  return <>{nombre}</>;
}

// Componente para mostrar el nombre del piloto dado su id
function NombrePiloto({ id, onLoaded }: { id: number, onLoaded?: () => void }) {
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchNombre() {
      const { data } = await supabase
        .from("Piloto")
        .select("nombre")
        .eq("id_piloto", id)
        .single();
      if (mounted) {
        setNombre(data?.nombre ?? "");
        if (onLoaded) onLoaded();
      }
    }
    fetchNombre();
    return () => { mounted = false; };
  }, [id, onLoaded]);

  if (nombre === null) return null;
  return <>{nombre}</>;
}

// Componente para mostrar el nombre de la categoría dado su id
function CategoriaNombre({ id }: { id: number }) {
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchNombre() {
      const { data } = await supabase
        .from("Categoria")
        .select("nombre")
        .eq("id_categoria", id)
        .single();
      if (mounted) setNombre(data?.nombre ?? "");
    }
    fetchNombre();
    return () => { mounted = false; };
  }, [id]);

  if (nombre === null) return null;
  return <>{nombre}</>;
}