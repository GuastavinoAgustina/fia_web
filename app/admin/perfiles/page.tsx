"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {Piloto} from "@/app/admin/pilotos/page"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/toast-provider"
import { subirLogoEscuderia } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/client"

type PilotoEnEscuderia = {
  id_piloto: number;
  esTitular : boolean
  Piloto: Piloto;
};

type Escuderia = {
  id_escuderia: number;
  nombre: string;
  logo?: string | null;
  color?: string | null;
  activo?: boolean;
  PilotoTieneEscuderia?: PilotoEnEscuderia[];
};

const supabase = createClient()

export default function EscuderiasPage() {
  const [escuderias, setEscuderias] = useState<Escuderia[]>([]);
  const [nuevaEscuderia, setNuevaEscuderia] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#000000");
  const [editandoEscuderia, setEditandoEscuderia] = useState<Escuderia | null>(null);
  const [nuevoLogo, setNuevoLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { addToast } = useToast()

  // 🔹 Cargar escuderías al iniciar
  useEffect(() => {
    cargarEscuderias();
  }, []);

  async function cargarEscuderias() {
    const { data, error } = await supabase
      .from("Escuderia")
      .select(`
        *,
        PilotoTieneEscuderia(
          id_piloto,
          esTitular,
          Piloto(id_piloto, nombre, foto)
        )
      `)
      .order("id_escuderia", { ascending: true });

    if (error) console.error(error.message);
    else setEscuderias(data || []);
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setNuevoLogo(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // 🔹 Crear nueva escudería
  async function handleCrearEscuderia() {
    if (!nuevaEscuderia.trim()) return alert("Debe ingresar un nombre.");

    setUploading(true);

    const nuevaEsc = {
        nombre: nuevaEscuderia,
        color: nuevoColor.replace("#", ""),
        activo: true,
    }

    const { data, error } = await supabase
      .from("Escuderia")
      .insert(nuevaEsc)
      .select()
      .single()

    if (error || !data) {
      addToast("Error al crear el piloto: ",error?.message)
      setUploading(false)
      return
    }

    // Subir logo si existe
    let logoUrl = null
    if (nuevoLogo) {
      logoUrl = await subirLogoEscuderia(nuevoLogo, data.id_escuderia.toString())
                
      // Actualizar el logo con la URL
      if (logoUrl) {
        await supabase
          .from("Escuderia")
          .update({ logo: logoUrl })
          .eq("id_escuderia", data.id_escuderia)
        }
    }
  
    addToast(`Escudería "${nuevaEscuderia}" creada exitosamente`)
    setNuevaEscuderia("");
    setNuevoColor("#000000");
    setNuevoLogo(null);
    setLogoPreview("");
    cargarEscuderias();
     setUploading(false);

  }

  async function handleEditarEscuderia() {
    if (!editandoEscuderia) return;
    setUploading(true);

    let logoUrl = editandoEscuderia.logo;

    /*if (nuevoLogo) {
      const uploaded = await subirLogoEscuderia(nuevoLogo);
      if (uploaded) logoUrl = uploaded;
    }*/

    const { error } = await supabase
      .from("Escuderia")
      .update({
        nombre: editandoEscuderia.nombre,
        color: editandoEscuderia.color?.replace("#", ""),
        logo: logoUrl,
      })
      .eq("id_escuderia", editandoEscuderia.id_escuderia);

    if (error) {
      console.error("Error al editar escudería:", error);
      addToast("Error al actualizar escudería");
    } else {
      addToast(`Escudería "${editandoEscuderia.nombre}" actualizada correctamente`);
      setEscuderias((prev) =>
        prev.map((e) =>
          e.id_escuderia === editandoEscuderia.id_escuderia
            ? { ...editandoEscuderia, logo: logoUrl }
            : e
        )
      );
      setEditandoEscuderia(null);
      setNuevoLogo(null);
      setLogoPreview("");
    }

    setUploading(false);
  }
  
  function EditarEscuderia({
  escuderia,
  onGuardar,
  onCancelar,
}: {
  escuderia: Escuderia;
  onGuardar: (escuderia: Escuderia, nuevoNombre: string, nuevoColor: string, nuevoLogoFile: File | null) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(escuderia.nombre);
  const [color, setColor] = useState(`#${escuderia.color || "000000"}`);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  return (
    <div className="flex items-center gap-3">
      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="border border-gray-300 rounded p-2" />
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
      <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="border rounded px-2 py-1" />
      <button onClick={() => onGuardar(escuderia, nombre, color, logoFile)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded">
        Guardar
      </button>
      <button onClick={onCancelar} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded">
        Cancelar
      </button>
    </div>
  );
}


  // 🔹 Eliminar escudería
  async function handleEliminarEscuderia(id: number) {
    if (!confirm("¿Eliminar esta escudería?")) return;
    const { error } = await supabase
      .from("Escuderia")
      .delete()
      .eq("id_escuderia", id);

    if (error) {
      console.error(error.message);
      alert("Error al eliminar");
    } else {
      addToast(`Escudería eliminada exitosamente`)
      cargarEscuderias();
    }
  }

  const MAX_PILOTOS = 2; // parámetro configurable

  // Estado para el modal
  const [modalEscuderiaId, setModalEscuderiaId] = useState<number | null>(null);
  const [pilotosSinEscuderia, setPilotosSinEscuderia] = useState<Piloto[]>([]);
  const [pilotosSeleccionados, setPilotosSeleccionados] = useState<number[]>([]);


  async function handleAgregarPiloto(id_escuderia: number) {
  setModalEscuderiaId(id_escuderia);
  setPilotosSeleccionados([]);

  // Traer pilotos sin escudería
  const { data, error } = await supabase
    .from("Piloto")
    .select("*, PilotoTieneEscuderia(id_escuderia)")
    .eq("activo", true);

  if (error) {
    console.error(error.message);
    alert("Error cargando pilotos");
  } else {
      // Filtramos los pilotos que NO tienen ninguna relación con escudería
    const pilotosSinEscuderia = data.filter(
      (p) => !p.PilotoTieneEscuderia || p.PilotoTieneEscuderia.length === 0
    );
    setPilotosSinEscuderia(pilotosSinEscuderia || []);
  }
}

function togglePilotoSeleccionado(id_piloto: number) {
    if (pilotosSeleccionados.includes(id_piloto)) {
    // Deseleccionamos 
    setPilotosSeleccionados((prev) => prev.filter((p) => p !== id_piloto));
  } else {
    if (pilotosSeleccionados.length >= MAX_PILOTOS) {
      alert(`Solo se pueden seleccionar hasta ${MAX_PILOTOS} pilotos`);
      return;
    }
    setPilotosSeleccionados((prev) => [...prev, id_piloto]);
  }
}

async function confirmarAgregarPilotos() {
  if (!modalEscuderiaId || pilotosSeleccionados.length === 0) return;

  const inserts = pilotosSeleccionados.map((id_piloto) => ({
    id_escuderia: modalEscuderiaId,
    id_piloto,
    esTitular: false,
  }));

  const { error } = await supabase.from("PilotoTieneEscuderia").insert(inserts);

  if (error) {
    console.error(error);
    alert("Error agregando pilotos");
  } else {
    addToast(`Pilotos agregados exitosamente`)
    setModalEscuderiaId(null);
    cargarEscuderias(); // recargar escuderías para ver los pilotos nuevos
  }
}

async function handleCambiarRolPiloto(
  id_piloto: number,
  id_escuderia: number,
  esTitular : boolean
) {
  const { error } = await supabase
    .from("PilotoTieneEscuderia")
    .update({ esTitular })
    .match({ id_piloto, id_escuderia });
  if (error) {
    console.error(error.message);
    alert("Error al actualizar el rol del piloto");
  } else {
    cargarEscuderias();
  }
}

  async function handleEliminarPiloto(id_piloto: number, id_escuderia: number) {
    const { error } = await supabase
      .from("PilotoTieneEscuderia")
      .delete()
      .match({ id_piloto, id_escuderia });

    if (error) console.error(error);
    else{
      addToast(`Pilotos desvinculado de la escudería exitosamente`)
      cargarEscuderias();
    }
  }

 return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Encabezado */}
        <div className="bg-white border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Escuderías</h1>
              <p className="text-gray-600 mt-1">Administra las escuderías registradas</p>
            </div>
              <Link 
                href="/admin" 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                ← Página principal
              </Link>
          </div>
        </div>

        {/* Crear nueva escudería */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-xl text-gray-900 mb-4">Agregar nueva escudería</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Mercedes AMG"
                value={nuevaEscuderia}
                onChange={(e) => setNuevaEscuderia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="color"
                value={nuevoColor}
                onChange={(e) => setNuevoColor(e.target.value)}
                className="w-full h-10 cursor-pointer p-0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNuevoLogo(e.target.files?.[0] || null)}
                className="w-full text-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={handleCrearEscuderia}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
            >
              Crear Escudería
            </button>
          </div>
        </div>

        {/* Lista de escuderías */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Lista de Escuderías ({escuderias.length})
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {escuderias.map((e) => (
              <div key={e.id_escuderia} className="border border-gray-200 rounded-lg overflow-hidden">

                {/* Header escudería */}
                <div className="flex justify-between items-center bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-4">
                    {e.logo ? (
                        <div
                          className="w-16 h-16 rounded-lg border flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: `#${e.color || "cccccc"}` }}
                        >
                        <Image
                          src={e.logo}
                          alt={e.nombre}
                          width={64}
                          height={64}
                          className="object-contain w-5/6 h-5/6"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-lg border flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: `#${e.color || "cccccc"}` }}
                      >
                        {e.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}

                      <span className="font-medium text-lg">{e.nombre}</span>
                  </div>

                  <div className="flex gap-2">
                    {editandoEscuderia?.id_escuderia === e.id_escuderia ? null : (
                      <>
                        <button
                          onClick={() => handleAgregarPiloto(e.id_escuderia)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
                        >
                          Agregar Piloto
                        </button>
                        <button
                          onClick={() => setEditandoEscuderia(e)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarEscuderia(e.id_escuderia)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Lista de pilotos de la escudería */}
                <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                  {e.PilotoTieneEscuderia && e.PilotoTieneEscuderia.length > 0 ? (
                    e.PilotoTieneEscuderia.map((pte) => (
                      <div
                        key={pte.id_piloto}
                        className="flex justify-between items-center border-b border-gray-100 pb-2"
                      >
                        <div className="flex items-center gap-3">
                          {pte.Piloto.foto && (
                            <Image
                              src={pte.Piloto.foto}
                              alt={pte.Piloto.nombre}
                              width={40}
                              height={40}
                              className="rounded-full object-cover border"
                            />
                          )}
                          <span className="text-gray-800 font-medium">{pte.Piloto.nombre}</span>
                        </div>

                        <div className = "flex items-center gap-2">
                          {/* Dropdown de rol */}
                            <DropdownMenu>
                                <DropdownMenuTrigger className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">
                                  {pte.esTitular ? "Titular" : "Suplente"}
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-28">
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      handleCambiarRolPiloto(pte.id_piloto, e.id_escuderia, true)
                                    }
                                  >
                                    Titular
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onSelect={() =>
                                      handleCambiarRolPiloto(pte.id_piloto, e.id_escuderia, false)
                                    }
                                  >
                                    Suplente
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            
                          <button
                            onClick={() => handleEliminarPiloto(pte.id_piloto, e.id_escuderia)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Desvincular
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No hay pilotos en esta escudería.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/*Modal de edición de pilotos de la escudería*/}
              {modalEscuderiaId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold mb-4">Seleccionar pilotos</h3>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {pilotosSinEscuderia.map((p) => (
                        <label
                          key={p.id_piloto}
                          className="flex items-center gap-3 p-2 border rounded cursor-pointer hover:bg-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={pilotosSeleccionados.includes(p.id_piloto)}
                            onChange={() => togglePilotoSeleccionado(p.id_piloto)}
                          />
                          <span>{p.nombre}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={confirmarAgregarPilotos}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => setModalEscuderiaId(null)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        Cancelar
                      </button>

                    </div>
                  </div>
                </div>
              )}

              {/* MODAL DE EDICIÓN */}
      {editandoEscuderia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[400px] space-y-4 shadow-lg">
            <h3 className="text-lg font-semibold">Editar Escudería</h3>

            <input
              type="text"
              value={editandoEscuderia.nombre}
              onChange={(e) =>
                setEditandoEscuderia({
                  ...editandoEscuderia,
                  nombre: e.target.value,
                })
              }
              className="border p-2 rounded w-full"
            />

            <div className="flex items-center gap-3">
              <label>Color:</label>
              <input
                type="color"
                value={`#${editandoEscuderia.color}`}
                onChange={(e) =>
                  setEditandoEscuderia({
                    ...editandoEscuderia,
                    color: e.target.value,
                  })
                }
                className="w-12 h-10 border rounded"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Nuevo Logo (opcional)</label>
              <input type="file" accept="image/*" onChange={handleLogo} />
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Preview"
                  className="mt-3 w-24 h-24 object-contain border rounded-lg"
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditandoEscuderia(null)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditarEscuderia}
                disabled={uploading}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg"
              >
                {uploading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

