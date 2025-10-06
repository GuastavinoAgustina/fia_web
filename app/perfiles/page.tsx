"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import GranPrixDropdown from "@/components/gp-dropdown-list";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

type Piloto = {
  id_piloto: number;
  nombre: string;
  foto?: string | null;
};

type Escuderia = {
  id_escuderia: number;
  nombre: string;
};

export default function PerfilesPage() {
  const [listaEscuderias, setListaEscuderias] = useState<Escuderia[]>([]);
  const [listaPilotos, setListaPilotos] = useState<Piloto[]>([]);
  const [escuderiaSeleccionada, setEscuderiaSeleccionada] = useState<Escuderia | null>(null);
  const [pilotoSeleccionado, setPilotoSeleccionado] = useState<Piloto | null>(null);
  const [titular, setTitular] = useState<boolean>(true);
  const [nuevaFoto, setNuevaFoto] = useState<string | undefined>(undefined);
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);

  const [nuevaEscuderia, setNuevaEscuderia] = useState<string>("");
  const [nombreEditado, setNombreEditado] = useState<string>("");

  // --- Cargar escuderías ---
  useEffect(() => {
    const fetchEscuderias = async () => {
      const { data, error } = await supabase
        .from("Escuderia")
        .select("id_escuderia, nombre")
        .order("id_escuderia");
      if (data) setListaEscuderias(data);
      if (error) console.error(error);
    };
    fetchEscuderias();
  }, []);

  // --- Cargar pilotos ---
  useEffect(() => {
    const fetchPilotos = async () => {
      const { data, error } = await supabase
        .from("Piloto")
        .select("*")
        .eq("activo", true)
        .order("id_piloto");
      if (data) setListaPilotos(data);
      if (error) console.error(error);
    };
    fetchPilotos();
  }, []);

  const handleSelectEscuderia = (item: string) => {
    const escuderia = listaEscuderias.find(e => e.nombre === item) || null;
    setEscuderiaSeleccionada(escuderia);
    setMostrarFormulario(false);
    setPilotoSeleccionado(null);
    setTitular(true);
    setNuevaFoto(undefined);
    setNombreEditado(escuderia?.nombre ?? "");
  };

  const handleCrearEscuderia = async () => {
    const nombre = nuevaEscuderia.trim();
    if (nombre === "") return;

    if (listaEscuderias.some(e => e.nombre.toLowerCase() === nombre.toLowerCase())) {
      alert("Ya existe una escudería con ese nombre.");
      return;
    }

    const { data, error } = await supabase
      .from("Escuderia")
      .insert({ nombre })
      .select();

    if (error) {
      console.error("Error al crear escudería:", error);
    } else if (data) {
      setListaEscuderias(prev => [...prev, data[0]]);
      setNuevaEscuderia("");
    }
  };

  const handleModificarEscuderia = async () => {
    if (!escuderiaSeleccionada) return;

    const nombreNuevo = nombreEditado.trim();
    if (nombreNuevo === "") return;

    if (
      listaEscuderias.some(
        e =>
          e.nombre.toLowerCase() === nombreNuevo.toLowerCase() &&
          e.id_escuderia !== escuderiaSeleccionada.id_escuderia
      )
    ) {
      alert("Ya existe otra escudería con ese nombre.");
      return;
    }

    const { error } = await supabase
      .from("Escuderia")
      .update({ nombre: nombreNuevo })
      .eq("id_escuderia", escuderiaSeleccionada.id_escuderia);

    if (error) {
      console.error("Error al modificar escudería:", error);
    } else {
      setListaEscuderias(prev =>
        prev.map(e =>
          e.id_escuderia === escuderiaSeleccionada.id_escuderia
            ? { ...e, nombre: nombreNuevo }
            : e
        )
      );
      setEscuderiaSeleccionada(prev =>
        prev ? { ...prev, nombre: nombreNuevo } : null
      );
    }
  };

  const handleEliminarEscuderia = async () => {
    if (!escuderiaSeleccionada) return;

    const confirmar = confirm(
      `¿Seguro que deseas eliminar la escudería "${escuderiaSeleccionada.nombre}"?`
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from("Escuderia")
      .delete()
      .eq("id_escuderia", escuderiaSeleccionada.id_escuderia);

    if (error) {
      console.error("Error al eliminar escudería:", error);
    } else {
      setListaEscuderias(prev =>
        prev.filter(e => e.id_escuderia !== escuderiaSeleccionada.id_escuderia)
      );
      setEscuderiaSeleccionada(null);
      setMostrarFormulario(false);
      setNombreEditado("");
    }
  };

  const handleSelectPiloto = (item: string) => {
    const piloto = listaPilotos.find(p => p.nombre === item) || null;
    setPilotoSeleccionado(piloto);
  };

  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNuevaFoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = async () => {
    if (!escuderiaSeleccionada || !pilotoSeleccionado) return;

    const { error } = await supabase.from("Tiene").insert({
      id_escuderia: escuderiaSeleccionada.id_escuderia,
      id_piloto: pilotoSeleccionado.id_piloto,
      titular: titular,
      foto: nuevaFoto ?? pilotoSeleccionado.foto ?? null,
    });

    if (error) {
      console.error("Error al guardar:", error);
    } else {
      setMostrarFormulario(false);
      setPilotoSeleccionado(null);
      setTitular(true);
      setNuevaFoto(undefined);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen">
      <main className="p-10">
        <h1>Gestión de Perfiles</h1>

        {/* Crear nueva escudería */}
        <div className="mt-6 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Nombre de la nueva escudería"
            value={nuevaEscuderia}
            onChange={(e) => setNuevaEscuderia(e.target.value)}
            className="border p-2 rounded w-64"
          />
          <button
            onClick={handleCrearEscuderia}
            className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
          >
            Crear escudería
          </button>
        </div>

        {/* Selección de escudería */}
        <div className="mt-6">
          <GranPrixDropdown
            label="Seleccione una escudería"
            listaGP={listaEscuderias.map(it => it.nombre)}
            setSelected={handleSelectEscuderia}
          />
        </div>

        {/* Modificar / eliminar escudería */}
        {escuderiaSeleccionada && (
          <div className="mt-4 flex gap-3 items-center">
            <input
              type="text"
              value={nombreEditado}
              onChange={(e) => setNombreEditado(e.target.value)}
              className="border p-2 rounded w-64"
            />
            <button
              onClick={handleModificarEscuderia}
              className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
            >
              Modificar
            </button>
            <button
              onClick={handleEliminarEscuderia}
              className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        )}

        {/* Botón para abrir el formulario */}
        {escuderiaSeleccionada && !mostrarFormulario && (
          <div className="mt-4">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Añadir piloto
            </button>
          </div>
        )}

        {/* Formulario de edición */}
        {mostrarFormulario && escuderiaSeleccionada && (
          <div className="mt-4">
            <h2 className="text-lg mb-2">Agregar piloto a {escuderiaSeleccionada.nombre}</h2>

            <GranPrixDropdown
              label="Seleccione un piloto"
              listaGP={listaPilotos.map(p => p.nombre)}
              setSelected={handleSelectPiloto}
            />

            {pilotoSeleccionado && (
              <div className="mt-4">
                <label className="block mb-1">Condición</label>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      checked={titular}
                      onChange={() => setTitular(true)}
                    />
                    Titular
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={!titular}
                      onChange={() => setTitular(false)}
                    />
                    Suplente
                  </label>
                </div>

                <div className="mt-4">
                  <label className="block mb-1">Foto (opcional)</label>
                  <input type="file" accept="image/*" onChange={handleFotoChange} />
                  {nuevaFoto && (
                    <div className="mt-2">
                      <Image
                        src={nuevaFoto}
                        alt="Foto piloto"
                        width={100}
                        height={100}
                        className="rounded"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleGuardar}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setMostrarFormulario(false)}
                    className="bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
