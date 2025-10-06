"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast-provider";

const supabase = createClient();

type Piloto = {
  id_piloto: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  titular: boolean;
  escuderia_id: number;
  foto?: string; // base64
};

type Escuderia = {
  id_escuderia: number;
  nombre: string;
  pilotos?: Piloto[];
};

export default function PerfilesPage() {
  const [escuderias, setEscuderias] = useState<Escuderia[]>([]);
  const [nombreEscuderia, setNombreEscuderia] = useState("");

  const [nombrePiloto, setNombrePiloto] = useState("");
  const [apellidoPiloto, setApellidoPiloto] = useState("");
  const [fechaNacimientoPiloto, setFechaNacimientoPiloto] = useState("");
  const [titularPiloto, setTitularPiloto] = useState(true);
  const [fotoPiloto, setFotoPiloto] = useState<string | undefined>(undefined);

  const [escuderiaSeleccionada, setEscuderiaSeleccionada] = useState<number | null>(null);

  const [escuderiaEditando, setEscuderiaEditando] = useState<number | null>(null);
  const [nuevoNombreEscuderia, setNuevoNombreEscuderia] = useState("");

  const [pilotoEditando, setPilotoEditando] = useState<number | null>(null);
  const [nuevoNombrePiloto, setNuevoNombrePiloto] = useState("");
  const [nuevoApellidoPiloto, setNuevoApellidoPiloto] = useState("");
  const [nuevaFechaNacimientoPiloto, setNuevaFechaNacimientoPiloto] = useState("");
  const [nuevoTitularPiloto, setNuevoTitularPiloto] = useState(true);
  const [nuevaFotoPiloto, setNuevaFotoPiloto] = useState<string | undefined>(undefined);

  const { addToast } = useToast();

  // 🔹 Manejo de imagen en base64
  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>, setFoto: (value: string | undefined) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // 🔹 Cargar escuderías y pilotos
  useEffect(() => {
    fetchEscuderias();
  }, []);

  async function fetchEscuderias() {
    const { data, error } = await supabase
      .from("Escuderia")
      .select("*, Piloto(*)")
      .order("id_escuderia");

    if (error) {
      console.log(error);
      addToast("Error al cargar escuderías");
    } else if (data) {
      setEscuderias(data);
    }
  }

  // 🔹 Agregar escudería
  async function agregarEscuderia() {
    if (!nombreEscuderia.trim()) return addToast("El nombre no puede estar vacío");
    const { error } = await supabase.from("Escuderia").insert([{ nombre: nombreEscuderia }]);
    if (!error) {
      setNombreEscuderia("");
      fetchEscuderias();
      addToast(`Escudería "${nombreEscuderia}" añadida`);
    }
  }

  // 🔹 Editar escudería
  async function guardarEdicionEscuderia(id: number) {
    const { error } = await supabase
      .from("Escuderia")
      .update({ nombre: nuevoNombreEscuderia })
      .eq("id_escuderia", id);

    if (!error) {
      setEscuderiaEditando(null);
      setNuevoNombreEscuderia("");
      fetchEscuderias();
      addToast("Escudería actualizada");
    }
  }

  // 🔹 Agregar piloto
  async function agregarPiloto(escuderiaId: number) {
    if (!nombrePiloto.trim() || !apellidoPiloto.trim() || !fechaNacimientoPiloto) {
      return addToast("Nombre, apellido y fecha de nacimiento son obligatorios");
    }

    const nuevo: Omit<Piloto, "id_piloto"> = {
      nombre: nombrePiloto,
      apellido: apellidoPiloto,
      fecha_nacimiento: fechaNacimientoPiloto,
      titular: titularPiloto,
      escuderia_id: escuderiaId,
      foto: fotoPiloto,
    };

    const { error } = await supabase.from("Piloto").insert([nuevo]);
    if (!error) {
      setNombrePiloto("");
      setApellidoPiloto("");
      setFechaNacimientoPiloto("");
      setTitularPiloto(true);
      setFotoPiloto(undefined);
      setEscuderiaSeleccionada(null);
      fetchEscuderias();
      addToast("Piloto añadido");
    }
  }

  // 🔹 Editar piloto
  async function guardarEdicionPiloto(p: Piloto) {
    const { error } = await supabase
      .from("Piloto")
      .update({
        nombre: nuevoNombrePiloto,
        apellido: nuevoApellidoPiloto,
        fecha_nacimiento: nuevaFechaNacimientoPiloto,
        titular: nuevoTitularPiloto,
        foto: nuevaFotoPiloto ?? p.foto,
      })
      .eq("id_piloto", p.id_piloto);

    if (!error) {
      setPilotoEditando(null);
      fetchEscuderias();
      addToast("Piloto actualizado");
    }
  }

  // 🔹 Eliminar piloto
  async function eliminarPiloto(p: Piloto) {
    const { error } = await supabase.from("Piloto").delete().eq("id_piloto", p.id_piloto);
    if (!error) {
      fetchEscuderias();
      addToast(`Piloto "${p.nombre}" eliminado`);
    }
  }

  // 🔹 Eliminar escudería
  async function eliminarEscuderia(id: number) {
    const { error } = await supabase.from("Escuderia").delete().eq("id_escuderia", id);
    if (!error) {
      fetchEscuderias();
      addToast("Escudería eliminada");
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestión de perfiles</h1>

      {/* Formulario Escuderías */}
      <div className="bg-card text-card-foreground p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-2">Nueva Escudería</h2>
        <input
          type="text"
          value={nombreEscuderia}
          onChange={(e) => setNombreEscuderia(e.target.value)}
          placeholder="Nombre de la escudería"
          className="w-full p-2 border rounded mb-2 bg-input text-foreground"
        />
        <button
          onClick={agregarEscuderia}
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-80"
        >
          Añadir Escudería
        </button>
      </div>

      {/* Lista de Escuderías y pilotos */}
      {escuderias.map((e) => (
        <div key={e.id_escuderia} className="bg-card text-card-foreground shadow p-4 rounded mb-4">
          <div className="flex justify-between items-center mb-2">
            {escuderiaEditando === e.id_escuderia ? (
              <div className="flex w-full gap-2">
                <input
                  type="text"
                  value={nuevoNombreEscuderia}
                  onChange={(ev) => setNuevoNombreEscuderia(ev.target.value)}
                  placeholder="Nuevo nombre"
                  className="flex-1 p-2 border rounded bg-input text-foreground"
                />
                <button
                  onClick={() => guardarEdicionEscuderia(e.id_escuderia)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEscuderiaEditando(null)}
                  className="bg-gray-500 text-white px-3 py-1 rounded"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold">{e.nombre}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEscuderiaEditando(e.id_escuderia);
                      setNuevoNombreEscuderia(e.nombre);
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarEscuderia(e.id_escuderia)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Lista de pilotos */}
          <ul className="mb-3">
            {e.pilotos?.map((p) => (
              <li key={p.id_piloto} className="flex justify-between items-center bg-muted p-2 rounded mb-1">
                {pilotoEditando === p.id_piloto ? (
                  <div className="flex flex-col w-full gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevoNombrePiloto}
                        onChange={(ev) => setNuevoNombrePiloto(ev.target.value)}
                        placeholder="Nombre"
                        className="flex-1 p-2 border rounded bg-input text-foreground"
                      />
                      <input
                        type="text"
                        value={nuevoApellidoPiloto}
                        onChange={(ev) => setNuevoApellidoPiloto(ev.target.value)}
                        placeholder="Apellido"
                        className="flex-1 p-2 border rounded bg-input text-foreground"
                      />
                    </div>
                    <input
                      type="date"
                      value={nuevaFechaNacimientoPiloto}
                      onChange={(ev) => setNuevaFechaNacimientoPiloto(ev.target.value)}
                      className="p-2 border rounded bg-input text-foreground"
                    />
                    <select
                      value={nuevoTitularPiloto ? "Titular" : "Suplente"}
                      onChange={(ev) => setNuevoTitularPiloto(ev.target.value === "Titular")}
                      className="p-2 border rounded bg-input text-foreground"
                    >
                      <option value="Titular">Titular</option>
                      <option value="Suplente">Suplente</option>
                    </select>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFotoChange(e, setNuevaFotoPiloto)}
                      className="p-1"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => guardarEdicionPiloto(p)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setPilotoEditando(null)}
                        className="bg-gray-500 text-white px-3 py-1 rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      {p.foto && (
                        <img src={p.foto} alt="foto piloto" className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <span>
                        {p.nombre} {p.apellido} ({p.titular ? "Titular" : "Suplente"})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPilotoEditando(p.id_piloto);
                          setNuevoNombrePiloto(p.nombre);
                          setNuevoApellidoPiloto(p.apellido);
                          setNuevaFechaNacimientoPiloto(p.fecha_nacimiento);
                          setNuevoTitularPiloto(p.titular);
                          setNuevaFotoPiloto(p.foto);
                        }}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarPiloto(p)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Formulario para agregar piloto */}
          {escuderiaSeleccionada === e.id_escuderia ? (
            <div className="bg-secondary text-secondary-foreground p-3 rounded">
              <input
                type="text"
                value={nombrePiloto}
                onChange={(ev) => setNombrePiloto(ev.target.value)}
                placeholder="Nombre"
                className="w-full p-2 border rounded mb-2 bg-input text-foreground"
              />
              <input
                type="text"
                value={apellidoPiloto}
                onChange={(ev) => setApellidoPiloto(ev.target.value)}
                placeholder="Apellido"
                className="w-full p-2 border rounded mb-2 bg-input text-foreground"
              />
              <input
                type="date"
                value={fechaNacimientoPiloto}
                onChange={(ev) => setFechaNacimientoPiloto(ev.target.value)}
                className="w-full p-2 border rounded mb-2 bg-input text-foreground"
              />
              <select
                value={titularPiloto ? "Titular" : "Suplente"}
                onChange={(ev) => setTitularPiloto(ev.target.value === "Titular")}
                className="w-full p-2 border rounded mb-2 bg-input text-foreground"
              >
                <option value="Titular">Titular</option>
                <option value="Suplente">Suplente</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFotoChange(e, setFotoPiloto)}
                className="mb-2"
              />
              <button
                onClick={() => agregarPiloto(e.id_escuderia)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Guardar Piloto
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEscuderiaSeleccionada(e.id_escuderia)}
              className="bg-primary text-primary-foreground px-3 py-1 rounded hover:opacity-80"
            >
              Añadir Piloto
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
