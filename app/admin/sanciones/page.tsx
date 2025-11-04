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
import { FaMinus } from "react-icons/fa6";
import { form } from "framer-motion/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

// 📦 Tipos de datos actualizados
type Sancion = {
  id_sancion: number;
  fechaSancion: string;
  horaSancion: string; // Nuevo campo
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

type PilotoOEscuderia = {
  id: number;
  type: "piloto" | "escuderia";
  nombre: string;
};

type Categoria = {
  id_categoria: number;
  nombre: string;
}

type Carrera = {
  id_carrera: number;
  nombre: string;
}


export default function SancionesCRUD() {
  const [escuderias, setEscuderias] = useState<EscuderiaConSanciones[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pilotosOEscuderias, setPilotosOEscuderias] = useState<PilotoOEscuderia[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [selectedCarreraId, setSelectedCarreraId] = useState<string>("");

  // 🔧 Estados para CRUD
  const [isAdding, setIsAdding] = useState(false);
  const [editSancionId, setEditSancionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fechaSancion: "",
    horaSancion: "", // Nuevo
    descripcion: "",
    tipo: "", // Nuevo
    id_piloto: "",
    id_escuderia: "",
    id_carrera: "",
  });

  // ✅ Cargar datos iniciales
  useEffect(() => {
    fetchCategorias();
    fetchEscuderiasConSanciones();

  }, []);

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from("Categoria")
      .select("id_categoria, nombre")
      .order("nombre");
    if (error) console.error("Error cargando categorías:", error.message);
    else setCategorias(data || []);
  }

  const fetchEscuderiasConSanciones = async () => {
    const { data: escuderiaSanciones, error: escuderiaSancionesError } = await supabase
      .from("SancionAplicaEscuderia")
      .select(`
      id_escuderia,
      Escuderia ( id_escuderia, nombre, color, logo ),
      Sancion (
        id_sancion, fecha, hora, descripcion, tipo,
        Carrera!Sancion_id_carrera_fkey ( id_carrera, nombre )
      )
    `);
    if (escuderiaSancionesError) {
      console.error("Error cargando sanciones de escuderías:", escuderiaSancionesError.message);
      return;
    }

    const mapEscuderias = new Map<number, EscuderiaConSanciones>();

    escuderiaSanciones?.forEach((item) => {
      const esc = Array.isArray(item.Escuderia) ? item.Escuderia[0] : item.Escuderia;
      if (!esc) return;
      if (!mapEscuderias.has(esc.id_escuderia)) {
        mapEscuderias.set(esc.id_escuderia, {
          id_escuderia: esc.id_escuderia,
          nombreEscuderia: esc.nombre,
          color: esc.color,
          logo: esc.logo,
          sanciones: [],
        });
      }
      const sancion = Array.isArray(item.Sancion) ? item.Sancion[0] : item.Sancion;
      if (sancion) {
        const car = Array.isArray(sancion.Carrera) ? sancion.Carrera[0] : sancion.Carrera;
        mapEscuderias.get(esc.id_escuderia)?.sanciones.push({
          id_sancion: sancion.id_sancion,
          fechaSancion: sancion.fecha,
          horaSancion: sancion.hora ?? "-", // Nuevo
          descripcion: sancion.descripcion ?? "-",
          tipo: sancion.tipo ?? "-", // Nuevo
          nombrePiloto: "-", // No aplica para escuderías
          id_piloto: 0, // No aplica
          nombreCarrera: car ? car.nombre : "-",
        });
      }
    });

    const { data: pilotoSanciones, error: pilotoSancionesError } = await supabase
      .from("SancionAplicaPiloto")
      .select(`
    id_piloto,
    Piloto ( id_piloto, nombre ),
    Sancion (
      id_sancion, fecha, hora, descripcion, tipo,
      Carrera!Sancion_id_carrera_fkey (
        id_carrera, nombre,
        Corre (
          id_carrera, id_piloto, id_escuderia,
          Escuderia!Corre_id_escuderia_fkey ( id_escuderia, nombre, color, logo )
        )
      )
    )
  `);

    if (pilotoSancionesError) {
      console.error("Error cargando sanciones de pilotos:", pilotoSancionesError.message);
      return;
    }
    (pilotoSanciones ?? []).forEach((item: any) => {
      const pil = Array.isArray(item.Piloto) ? item.Piloto[0] : item.Piloto;
      const sancion = Array.isArray(item.Sancion) ? item.Sancion[0] : item.Sancion;
      const carrera = sancion?.Carrera ? (Array.isArray(sancion.Carrera) ? sancion.Carrera[0] : sancion.Carrera) : null;

      // Corre can be array or object
      const correList: any[] = Array.isArray(carrera?.Corre) ? carrera!.Corre : (carrera?.Corre ? [carrera.Corre] : []);
      const corre = correList.find(r => r.id_piloto === item.id_piloto) ?? correList[0];

      // Escuderia can be array or object
      const escuderia = corre?.Escuderia ? (Array.isArray(corre.Escuderia) ? corre.Escuderia[0] : corre.Escuderia) : null;
      if (!escuderia) return;

      if (!mapEscuderias.has(escuderia.id_escuderia)) {
        mapEscuderias.set(escuderia.id_escuderia, {
          id_escuderia: escuderia.id_escuderia,
          nombreEscuderia: escuderia.nombre,
          color: escuderia.color,
          logo: escuderia.logo,
          sanciones: [],
        });
      }

      mapEscuderias.get(escuderia.id_escuderia)!.sanciones.push({
        id_sancion: sancion.id_sancion,
        fechaSancion: sancion.fecha,
        horaSancion: sancion.hora ?? "-",
        descripcion: sancion.descripcion ?? "-",
        tipo: sancion.tipo ?? "-",
        nombrePiloto: pil ? pil.nombre : "Piloto Desconocido",
        id_piloto: pil ? pil.id_piloto : 0,
        nombreCarrera: carrera ? carrera.nombre : "-",
      });
    });


    setEscuderias(Array.from(mapEscuderias.values()));


  };

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 🟢 Crear Sanción
  const handleAddSancion = async () => {
    if (!formData.fechaSancion || !formData.descripcion || !(formData.id_piloto || formData.id_escuderia) || !formData.tipo) return;

    // 1. Insertar en Sancion
    const { data, error } = await supabase
      .from("Sancion")
      .insert({
        fecha: formData.fechaSancion,
        hora: formData.horaSancion || null, // Nuevo
        descripcion: formData.descripcion,
        tipo: formData.tipo, // Nuevo
        id_carrera: formData.id_carrera,
      })
      .select();

    if (error) {
      console.error("Error agregando sanción:", error.message);
      return;
    }

    const nuevaSancionId = data[0].id_sancion;

    // 2. Insertar en SancionAplicaPiloto

    if (formData.id_piloto) {
      await supabase
        .from("SancionAplicaPiloto")
        .insert({ id_sancion: nuevaSancionId, id_piloto: parseInt(formData.id_piloto) });
    }
    if (formData.id_escuderia) {
      await supabase
        .from("SancionAplicaEscuderia")
        .insert({ id_sancion: nuevaSancionId, id_escuderia: parseInt(formData.id_escuderia) });
    }

    setIsAdding(false);
    setFormData({ fechaSancion: "", horaSancion: "", descripcion: "", tipo: "", id_piloto: "", id_escuderia: "", id_carrera: "" });
    fetchEscuderiasConSanciones();

  };

  // 🟡 Editar sanción
  const handleEditSancion = async (sancion: Sancion) => {
    setEditSancionId(sancion.id_sancion);
    setIsAdding(false);

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
      descripcion: sancion.descripcion,
      tipo: sancion.tipo === "-" ? "" : sancion.tipo,
      id_piloto: idPilotoActual,
      id_escuderia: "",
      id_carrera: "", // No se edita aquí
    });
  };

  const handleSaveEdit = async () => {
    // 1. Actualizar tabla Sancion
    const { error: sancionError } = await supabase
      .from("Sancion")
      .update({
        fecha: formData.fechaSancion,
        hora: formData.horaSancion || null, // Nuevo
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
    setFormData({ fechaSancion: "", horaSancion: "", descripcion: "", tipo: "", id_piloto: "", id_escuderia: "", id_carrera: "" });
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

  const handleSelectedCategoria = (categoriaId: string) => {

    const categoria = categorias.find(c => c.id_categoria.toString() === categoriaId) || null;
    setSelectedCategoria(categoria);
    fetchCarrerasByCategoria(categoriaId);
  }

  const fetchCarrerasByCategoria = async (categoriaId: string) => {
    const { data, error } = await supabase
      .from("Carrera")
      .select("id_carrera, nombre")
      .eq("id_categoria", categoriaId)
      .order("nombre");

    if (error) {
      console.error("Error fetching carreras:", error.message);
      return;
    }
    setCarreras(data);
  }

  const handleSelectedCarreraId = async (carreraId: string) => {
    setSelectedCarreraId(carreraId);
    setFormData({ ...formData, id_carrera: carreraId });

    const { data, error } = await supabase
      .from('Corre')
      .select('id_piloto, id_escuderia, Piloto(id_piloto, nombre), Escuderia(id_escuderia, nombre)')
      .eq('id_carrera', carreraId);

    if (error) {
      console.error(error);
      return;
    }

    const pilotos: PilotoOEscuderia[] = (data || []).map((d: any) => {
      const pilotoObj = Array.isArray(d.Piloto) ? d.Piloto[0] : d.Piloto;
      return {
        id: d.id_piloto,
        type: "piloto" as const,
        nombre: pilotoObj?.nombre ?? 'Desconocido',
      };
    });

    const escuderias: PilotoOEscuderia[] = (data || []).map((d: any) => {
      const escuderiaObj = Array.isArray(d.Escuderia) ? d.Escuderia[0] : d.Escuderia;

      return {
        id: d.id_escuderia,
        type: "escuderia" as const,
        nombre: escuderiaObj?.nombre ?? 'Desconocida',
      };
    })
      .filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.type === value.type && t.id === value.id
        ))
      );


    setPilotosOEscuderias(pilotos.concat(escuderias));
    console.log(pilotos.concat(escuderias))
  };

  const handleSelectEntidad = (id_entidad: string) => {
    const [type, id] = id_entidad.split(':');
    if (type === 'piloto') {
      setFormData({ ...formData, id_piloto: id, id_escuderia: "" });
    } else if (type === 'escuderia') {
      setFormData({ ...formData, id_escuderia: id, id_piloto: "" });
    } else {
      console.error("Entidad no encontrada");
    }
  }

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
              setEditSancionId(null);
              setFormData({ fechaSancion: "", horaSancion: "", descripcion: "", tipo: "", id_piloto: "", id_escuderia: "", id_carrera: "" });
            }}
          >
            {isAdding ? <div className="flex items-center justify-center gap-1"><FaMinus /> Cancelar </div> :
              <div className="flex items-center justify-center gap-1"><FaPlus /> Agregar Nueva Sanción</div>}

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

              {/* Categoria */}

              <select
                className="border rounded p-2 lg:col-span-2"
                value={selectedCategoria ? selectedCategoria.id_categoria : ""}
                onChange={(e) => handleSelectedCategoria(e.target.value)}
              >
                <option value="" disabled hidden>Seleccione una categoría *</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              {/* Carrera (Dropdown) */}

              <select
                className="border rounded p-2"
                value={selectedCarreraId}
                onChange={(e) => handleSelectedCarreraId(e.target.value)}
              >
                <option value="" disabled hidden>Seleccione una carrera *</option>
                {carreras.map((c) => (
                  <option key={c.id_carrera} value={c.id_carrera}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              {/* Motivo y Descripción (Dos columnas para mejor distribución) */}
              <input
                type="text"
                placeholder="Tipo (Ej: Multa, Pérdida de puestos...) *"
                className="border rounded p-2 lg:col-span-2"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              />
              <input
                type="text"
                placeholder="Descripción *"
                className="border rounded p-2 lg:col-span-2 sm:col-span-1"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
              <select
                className="border rounded p-2"
                value={formData.id_piloto ? `piloto:${formData.id_piloto}` : formData.id_escuderia ? `escuderia:${formData.id_escuderia}` : ""}
                onChange={(e) => { handleSelectEntidad(e.target.value); }}
              >
                <option value="" disabled hidden>Seleccione una entidad *</option>
                {pilotosOEscuderias.map((p) => (
                  <option key={`${p.type}:${p.id}`} value={`${p.type}:${p.id}`}>
                    {p.nombre}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddSancion}
                disabled={!formData.fechaSancion || !formData.tipo || !(formData.id_escuderia || formData.id_piloto) || !formData.id_carrera}
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
              } catch { }
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
                                  placeholder="Descripción"
                                  value={formData.descripcion}
                                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                  className="border rounded p-2 sm:col-span-2"
                                />
                              </div>

                              {/* Piloto a editar */}


                              {/* Botones Guardar/Cancelar */}
                              <div className="flex gap-2 justify-end mt-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                  disabled={!formData.fechaSancion || !formData.tipo || !formData.descripcion}
                                >
                                  <FaSave /> Guardar
                                </button>
                                <button
                                  onClick={() => setEditSancionId(null)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
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