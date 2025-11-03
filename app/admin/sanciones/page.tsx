"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import SancionCard from "@/components/sancion-card";
import Image from "next/image";
import Link from "next/link";
import {
  FaChevronRight,
  FaChevronDown,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaEraser, // Nuevo icono para eliminar piloto de la sanción
} from "react-icons/fa";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

// 📦 Tipos de datos actualizados
type Sancion = {
  id_sancion: number;
  fechaSancion: string;
  horaSancion: string; // Nuevo campo
  motivo: string;
  descripcion: string;
  tipo: string; // Nuevo campo
  nombrePiloto: string;
  id_piloto: number; // Agregamos el id_piloto para la edición
  nombreCarrera: string;
};

type EscuderiaConSanciones = {
  id_escuderia: number;
  nombreEscuderia: string;
  color: string;
  logo: string;
  sanciones: Sancion[];
};

type Piloto = {
  id_piloto: number;
  nombre: string;
};

export default function SancionesCRUD() {
  const [escuderias, setEscuderias] = useState<EscuderiaConSanciones[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pilotos, setPilotos] = useState<Piloto[]>([]);

  // 🔧 Estados para CRUD
  const [isAdding, setIsAdding] = useState(false);
  const [editSancionId, setEditSancionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fechaSancion: "",
    horaSancion: "", // Nuevo
    motivo: "",
    descripcion: "",
    tipo: "", // Nuevo
    id_piloto: "",
  });

  // ✅ Cargar datos iniciales
  useEffect(() => {
    fetchEscuderiasConSanciones();
    fetchPilotos();
  }, []);

  const fetchPilotos = async () => {
    const { data, error } = await supabase
      .from("Piloto")
      .select("id_piloto, nombre")
      .order("nombre");

    if (error) console.error("Error cargando pilotos:", error.message);
    else setPilotos(data || []);
  };

  const fetchEscuderiasConSanciones = async () => {
    const { data: escuderiasData, error: escuderiasError } = await supabase
      .from("Escuderia")
      .select("id_escuderia, nombre, color, logo")
      .eq("activo", true)
      .order("nombre");

    if (escuderiasError || !escuderiasData) {
      console.error("Error cargando escuderías:", escuderiasError?.message);
      return;
    }

    const escuderiasConSanciones = await Promise.all(
      escuderiasData.map(async (esc: any) => {
        // 1. Obtener todos los pilotos de la escudería
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
            sanciones: [],
          };
        }

        // 2. Obtener las sanciones por piloto
        const sancionesPromises = pilotoIds.map(async (idPiloto: number) => {
          const { data: pilotoInfo } = await supabase
            .from("Piloto")
            .select("nombre")
            .eq("id_piloto", idPiloto)
            .single();

          const nombrePiloto = pilotoInfo?.nombre || "Piloto Desconocido";

          // 2.1. Obtener ids de sanción asociados al piloto
          const { data: sancionIdsData } = await supabase
            .from("SancionAplicaPiloto")
            .select("id_sancion")
            .eq("id_piloto", idPiloto);

          if (!sancionIdsData || sancionIdsData.length === 0) return [];

          // 2.2. Obtener la información de cada sanción
          return Promise.all(
            sancionIdsData.map(async (s: any) => {
              const { data: sancion } = await supabase
                .from("Sancion")
                .select("*")
                .eq("id_sancion", s.id_sancion)
                .single();

              if (!sancion) return null;

              let nombreCarrera = "-";
              // Intentamos buscar la carrera asociada por la fecha de la sanción
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
                horaSancion: sancion.hora ?? "-", // Nuevo
                motivo: sancion.motivo,
                descripcion: sancion.descripcion ?? "-",
                tipo: sancion.tipo ?? "-", // Nuevo
                nombrePiloto,
                id_piloto: idPiloto, // Agregado
                nombreCarrera,
              };
            })
          ).then(results => results.filter((s): s is Sancion => s !== null)); // Filtra nulos
        });

        const sancionesArrays = await Promise.all(sancionesPromises);
        const sancionesFlattened = sancionesArrays.flat();

        return {
          id_escuderia: esc.id_escuderia,
          nombreEscuderia: esc.nombre,
          color: esc.color,
          logo: esc.logo,
          // Eliminamos duplicados de sanciones (si un piloto sancionado está en varias escuderías - aunque no debería pasar)
          sanciones: Array.from(new Map(sancionesFlattened.map(s => [s.id_sancion, s])).values()),
        };
      })
    );

    setEscuderias(escuderiasConSanciones);
  };

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 🟢 Crear Sanción
  const handleAddSancion = async () => {
    if (!formData.fechaSancion || !formData.motivo || !formData.id_piloto || !formData.tipo) return;

    // 1. Insertar en Sancion
    const { data, error } = await supabase
      .from("Sancion")
      .insert({
        fecha: formData.fechaSancion,
        hora: formData.horaSancion || null, // Nuevo
        motivo: formData.motivo,
        descripcion: formData.descripcion,
        tipo: formData.tipo, // Nuevo
      })
      .select();

    if (error) {
      console.error("Error agregando sanción:", error.message);
      return;
    }

    const nuevaSancionId = data[0].id_sancion;

    // 2. Insertar en SancionAplicaPiloto
    await supabase
      .from("SancionAplicaPiloto")
      .insert({ id_sancion: nuevaSancionId, id_piloto: parseInt(formData.id_piloto) });

    setIsAdding(false);
    setFormData({ fechaSancion: "", horaSancion: "", motivo: "", descripcion: "", tipo: "", id_piloto: "" });
    fetchEscuderiasConSanciones();
  };

  // 🟡 Editar sanción
  const handleEditSancion = async (sancion: Sancion) => {
    setEditSancionId(sancion.id_sancion);

    // Obtener el id_piloto de la sanción (solo tiene un piloto en el diseño actual)
    const { data: pilotoSancionData } = await supabase
        .from("SancionAplicaPiloto")
        .select("id_piloto")
        .eq("id_sancion", sancion.id_sancion)
        .limit(1)
        .single();
    
    const idPilotoActual = pilotoSancionData?.id_piloto.toString() || "";

    setFormData({
      fechaSancion: sancion.fechaSancion,
      horaSancion: sancion.horaSancion === "-" ? "" : sancion.horaSancion,
      motivo: sancion.motivo,
      descripcion: sancion.descripcion,
      tipo: sancion.tipo === "-" ? "" : sancion.tipo,
      id_piloto: idPilotoActual,
    });
  };

  const handleSaveEdit = async () => {
    // 1. Actualizar tabla Sancion
    const { error: sancionError } = await supabase
      .from("Sancion")
      .update({
        fecha: formData.fechaSancion,
        hora: formData.horaSancion || null, // Nuevo
        motivo: formData.motivo,
        descripcion: formData.descripcion,
        tipo: formData.tipo, // Nuevo
      })
      .eq("id_sancion", editSancionId);

    if (sancionError) {
      console.error("Error actualizando sanción:", sancionError.message);
      return;
    }
    
    // 2. Actualizar/Insertar/Eliminar Piloto en SancionAplicaPiloto
    if (formData.id_piloto) {
        // Eliminar registros anteriores (solo debería haber uno)
        await supabase
            .from("SancionAplicaPiloto")
            .delete()
            .eq("id_sancion", editSancionId);

        // Insertar el nuevo piloto
        await supabase
            .from("SancionAplicaPiloto")
            .insert({ id_sancion: editSancionId, id_piloto: parseInt(formData.id_piloto) });

    } else {
        // Si no hay piloto seleccionado, eliminamos el registro de SancionAplicaPiloto
        await supabase
            .from("SancionAplicaPiloto")
            .delete()
            .eq("id_sancion", editSancionId);
    }

    setEditSancionId(null);
    setFormData({ fechaSancion: "", horaSancion: "", motivo: "", descripcion: "", tipo: "", id_piloto: "" });
    fetchEscuderiasConSanciones();
  };
  
  // 🔴 Eliminar Piloto de la Sanción
  const handleRemovePilotoFromSancion = async () => {
    if (!editSancionId) return;

    await supabase
        .from("SancionAplicaPiloto")
        .delete()
        .eq("id_sancion", editSancionId);

    setFormData(prev => ({ ...prev, id_piloto: "" }));
    fetchEscuderiasConSanciones();
  };


  // 🔴 Eliminar sanción
  const handleDeleteSancion = async (id: number) => {
    // 1. Eliminar relaciones
    await supabase.from("SancionAplicaPiloto").delete().eq("id_sancion", id);
    // 2. Eliminar sanción
    await supabase.from("Sancion").delete().eq("id_sancion", id);
    fetchEscuderiasConSanciones();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Encabezado */}
        <div className="bg-white border-b border-gray-200 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Sanciones</h1>
            <p className="text-gray-600 mt-1">Agrega, edita o elimina sanciones</p>
          </div>
          <Link
            href="/team-member"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            ← Página principal
          </Link>
        </div>

        {/* Formulario de Alta */}
        <div className="bg-gray-50 p-4 rounded-lg shadow border">
          <button
            className="flex items-center gap-2 text-red-600 hover:text-red-800 font-semibold"
            onClick={() => {
                setIsAdding(!isAdding);
                setFormData({ fechaSancion: "", horaSancion: "", motivo: "", descripcion: "", tipo: "", id_piloto: "" });
            }}
          >
            <FaPlus /> {isAdding ? "Cancelar" : "Agregar nueva sanción"}
          </button>

          {isAdding && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Fecha y Hora */}
              <input
                type="date"
                placeholder="Fecha"
                className="border rounded p-2"
                value={formData.fechaSancion}
                onChange={(e) => setFormData({ ...formData, fechaSancion: e.target.value })}
              />
               <input
                type="time"
                placeholder="Hora (Opcional)"
                className="border rounded p-2"
                value={formData.horaSancion}
                onChange={(e) => setFormData({ ...formData, horaSancion: e.target.value })}
              />

              {/* Tipo */}
              <input
                type="text"
                placeholder="Tipo (Ej: Multa, Pérdida de puestos...)"
                className="border rounded p-2 lg:col-span-2"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              />
              
              {/* Piloto (Dropdown) */}
              <select
                className="border rounded p-2"
                value={formData.id_piloto}
                onChange={(e) => setFormData({ ...formData, id_piloto: e.target.value })}
              >
                <option value="">Seleccione un piloto *</option>
                {pilotos.map((p) => (
                  <option key={p.id_piloto} value={p.id_piloto}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              
              {/* Motivo y Descripción (Dos columnas para mejor distribución) */}
              <input
                type="text"
                placeholder="Motivo *"
                className="border rounded p-2 lg:col-span-2 sm:col-span-1"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              />
              <input
                type="text"
                placeholder="Descripción (Opcional)"
                className="border rounded p-2 lg:col-span-2 sm:col-span-1"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />

              <button
                onClick={handleAddSancion}
                disabled={!formData.fechaSancion || !formData.motivo || !formData.id_piloto || !formData.tipo}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg col-span-full font-semibold"
              >
                Guardar Sanción
              </button>
            </div>
          )}
        </div>

        {/* Listado */}
        <div className="space-y-4">
          {escuderias.map((esc) => {
            const colorFondo = esc.color ? "#" + esc.color : "#888888";
            // Lógica de logo... (se mantiene)
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
                style={{ background: colorFondo, color: "#fff" }}
              >
                <div
                  className="relative flex items-center p-4 cursor-pointer min-h-[100px] hover:opacity-90 transition-opacity"
                  onClick={() => toggleExpanded(esc.id_escuderia)}
                >
                  <div className="text-2xl font-bold mr-4 flex-shrink-0 z-10">
                    {esc.nombreEscuderia} ({esc.sanciones.length})
                  </div>
                  {logoURL && (
                    <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-20">
                      <div className="relative h-20 w-32">
                        <Image
                          src={logoURL}
                          alt={`Logo de ${esc.nombreEscuderia}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                  <div className="ml-auto text-2xl flex-shrink-0 z-10">
                    {expandedId === esc.id_escuderia ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronRight />
                    )}
                  </div>
                </div>

                {expandedId === esc.id_escuderia && (
                  <div className="p-4 border-t border-black/10 space-y-4 bg-gray-50">
                    {esc.sanciones.length > 0 ? (
                      esc.sanciones.map((s) => (
                        <div
                          key={s.id_sancion}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white shadow p-3 rounded-lg"
                        >
                          {editSancionId === s.id_sancion ? (
                            // Modo Edición
                            <div className="flex flex-col gap-3 w-full text-black">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                    {/* Fecha, Hora, Tipo */}
                                    <input
                                        type="date"
                                        value={formData.fechaSancion}
                                        onChange={(e) => setFormData({ ...formData, fechaSancion: e.target.value })}
                                        className="border rounded p-2"
                                    />
                                    <input
                                        type="time"
                                        placeholder="Hora"
                                        value={formData.horaSancion}
                                        onChange={(e) => setFormData({ ...formData, horaSancion: e.target.value })}
                                        className="border rounded p-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Tipo de sanción"
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="border rounded p-2 sm:col-span-2"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                    {/* Motivo y Descripción */}
                                    <input
                                        type="text"
                                        placeholder="Motivo"
                                        value={formData.motivo}
                                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                        className="border rounded p-2 sm:col-span-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Descripción"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        className="border rounded p-2 sm:col-span-2"
                                    />
                                </div>
                                
                                {/* Piloto a editar */}
                                <div className="flex items-center gap-2">
                                    <select
                                        className="border rounded p-2 flex-1"
                                        value={formData.id_piloto}
                                        onChange={(e) => setFormData({ ...formData, id_piloto: e.target.value })}
                                    >
                                        <option value="">Cambiar/Asignar piloto</option>
                                        {pilotos.map((p) => (
                                            <option key={p.id_piloto} value={p.id_piloto}>
                                                {p.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleRemovePilotoFromSancion}
                                        className="bg-red-200 hover:bg-red-300 text-red-700 p-2 rounded-lg flex items-center gap-1 transition-colors"
                                        title="Quitar piloto de la sanción"
                                    >
                                        <FaEraser /> Quitar
                                    </button>
                                </div>

                                {/* Botones Guardar/Cancelar */}
                                <div className="flex gap-2 justify-end mt-2">
                                    <button
                                        onClick={handleSaveEdit}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaSave /> Guardar
                                    </button>
                                    <button
                                        onClick={() => setEditSancionId(null)}
                                        className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <FaTimes /> Cancelar
                                    </button>
                                </div>
                            </div>
                          ) : (
                            // Modo Visualización
                            <>
                              <div className="flex-1 min-w-0">
                                <SancionCard sancion={s} colorEscuderia={esc.color} />
                                {/* Mostrar los nuevos campos */}
                                <div className="text-gray-700 text-sm mt-1 ml-2">
                                </div>
                              </div>
                              <div className="flex gap-3 mt-2 md:mt-0 md:ml-4 flex-shrink-0">
                                <button
                                  onClick={() => handleEditSancion(s)}
                                  className="text-yellow-600 hover:text-yellow-800"
                                  title="Editar"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteSancion(s.id_sancion)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Eliminar"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">
                        No hay sanciones registradas para esta escudería.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}