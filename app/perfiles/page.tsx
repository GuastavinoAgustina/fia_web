"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import GranPrixDropdown from "@/components/gp-dropdown-list";
import Image from "next/image";
export const dynamic = 'force-dynamic';
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

  // --- Nuevo estado para crear escuderías ---
  const [nuevaEscuderia, setNuevaEscuderia] = useState<string>("");

  // --- Cargar escuderías ---
  useEffect(() => {
    const fetchEscuderias = async () => {
      const { data, error } = await supabase
        .from("Escuderia")
        .select("id_escuderia, nombre");
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

  // --- Seleccionar escudería ---
  const handleSelectEscuderia = (item: string) => {
    const escuderia = listaEscuderias.find(e => e.nombre === item) || null;
    setEscuderiaSeleccionada(escuderia);
    setMostrarFormulario(false);
    setPilotoSeleccionado(null);
    setTitular(true);
    setNuevaFoto(undefined);
  };

  // --- Seleccionar piloto ---
  const handleSelectPiloto = (item: string) => {
    const piloto = listaPilotos.find(p => p.nombre === item) || null;
    setPilotoSeleccionado(piloto);
  };

  // --- Subir imagen en base64 ---
  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNuevaFoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // --- Guardar relación en DB ---
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
      console.log("Piloto agregado a escudería");
      setMostrarFormulario(false);
      setPilotoSeleccionado(null);
      setTitular(true);
      setNuevaFoto(undefined);
    }
  };

  // --- Crear nueva escudería ---
  const handleCrearEscuderia = async () => {
    if (nuevaEscuderia.trim() === "") return;

    const { data, error } = await supabase
      .from("Escuderia")
      .insert({ nombre: nuevaEscuderia })
      .select();

    if (error) {
      console.error("Error al crear escudería:", error);
    } else if (data) {
      console.log("Escudería creada:", data[0]);
      setListaEscuderias(prev => [...prev, data[0]]);
      setNuevaEscuderia("");
    }
  };

  return (
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
      {mostrarFormulario && (
        <div className="mt-4">
          <h2 className="text-lg mb-2">Agregar piloto a {escuderiaSeleccionada?.nombre}</h2>

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
  );
}
