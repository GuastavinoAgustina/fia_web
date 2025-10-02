"use client";

import { useState } from "react";

type Piloto = {
  id: number;
  nombre: string;
  rol: "Titular" | "Suplente";
  escuderiaId: number;
};

type Escuderia = {
  id: number;
  nombre: string;
  pilotos: Piloto[];
};

export default function PerfilesPage() {
  const [escuderias, setEscuderias] = useState<Escuderia[]>([]);
  const [nombreEscuderia, setNombreEscuderia] = useState("");
  const [nombrePiloto, setNombrePiloto] = useState("");
  const [rolPiloto, setRolPiloto] = useState<"Titular" | "Suplente">("Titular");
  const [escuderiaSeleccionada, setEscuderiaSeleccionada] = useState<number | null>(null);

  // Estados de edición
  const [escuderiaEditando, setEscuderiaEditando] = useState<number | null>(null);
  const [nuevoNombreEscuderia, setNuevoNombreEscuderia] = useState("");

  const [pilotoEditando, setPilotoEditando] = useState<number | null>(null);
  const [nuevoNombrePiloto, setNuevoNombrePiloto] = useState("");
  const [nuevoRolPiloto, setNuevoRolPiloto] = useState<"Titular" | "Suplente">("Titular");

  // Agregar escudería
  const agregarEscuderia = () => {
    if (!nombreEscuderia.trim()) return alert("El nombre no puede estar vacío");
    const nueva: Escuderia = {
      id: Date.now(),
      nombre: nombreEscuderia,
      pilotos: [],
    };
    setEscuderias([...escuderias, nueva]);
    setNombreEscuderia("");
  };

  // Editar escudería
  const guardarEdicionEscuderia = (id: number) => {
    setEscuderias(
      escuderias.map((e) =>
        e.id === id ? { ...e, nombre: nuevoNombreEscuderia } : e
      )
    );
    setEscuderiaEditando(null);
    setNuevoNombreEscuderia("");
  };

  // Agregar piloto
  const agregarPiloto = (escuderiaId: number) => {
    if (!nombrePiloto.trim()) return alert("El nombre no puede estar vacío");
    const nuevo: Piloto = {
      id: Date.now(),
      nombre: nombrePiloto,
      rol: rolPiloto,
      escuderiaId,
    };
    setEscuderias(
      escuderias.map((e) =>
        e.id === escuderiaId ? { ...e, pilotos: [...e.pilotos, nuevo] } : e
      )
    );
    setNombrePiloto("");
    setRolPiloto("Titular");
    setEscuderiaSeleccionada(null);
  };

  // Editar piloto
  const guardarEdicionPiloto = (escuderiaId: number, pilotoId: number) => {
    setEscuderias(
      escuderias.map((e) =>
        e.id === escuderiaId
          ? {
              ...e,
              pilotos: e.pilotos.map((p) =>
                p.id === pilotoId
                  ? { ...p, nombre: nuevoNombrePiloto, rol: nuevoRolPiloto }
                  : p
              ),
            }
          : e
      )
    );
    setPilotoEditando(null);
    setNuevoNombrePiloto("");
    setNuevoRolPiloto("Titular");
  };

  // Eliminar piloto
  const eliminarPiloto = (escuderiaId: number, pilotoId: number) => {
    setEscuderias(
      escuderias.map((e) =>
        e.id === escuderiaId
          ? { ...e, pilotos: e.pilotos.filter((p) => p.id !== pilotoId) }
          : e
      )
    );
  };

  // Eliminar escudería
  const eliminarEscuderia = (id: number) => {
    setEscuderias(escuderias.filter((e) => e.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestión de Escuderías y Pilotos</h1>

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

      {/* Lista de Escuderías */}
      {escuderias.map((e) => (
        <div key={e.id} className="bg-card text-card-foreground shadow p-4 rounded mb-4">
          <div className="flex justify-between items-center mb-2">
            {escuderiaEditando === e.id ? (
              <div className="flex w-full gap-2">
                <input
                  type="text"
                  value={nuevoNombreEscuderia}
                  onChange={(ev) => setNuevoNombreEscuderia(ev.target.value)}
                  placeholder="Nuevo nombre"
                  className="flex-1 p-2 border rounded bg-input text-foreground"
                />
                <button
                  onClick={() => guardarEdicionEscuderia(e.id)}
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
                      setEscuderiaEditando(e.id);
                      setNuevoNombreEscuderia(e.nombre);
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarEscuderia(e.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Lista de Pilotos */}
          <ul className="mb-3">
            {e.pilotos.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center bg-muted p-2 rounded mb-1"
              >
                {pilotoEditando === p.id ? (
                  <div className="flex w-full gap-2">
                    <input
                      type="text"
                      value={nuevoNombrePiloto}
                      onChange={(ev) => setNuevoNombrePiloto(ev.target.value)}
                      placeholder="Nuevo nombre"
                      className="flex-1 p-2 border rounded bg-input text-foreground"
                    />
                    <select
                      value={nuevoRolPiloto}
                      onChange={(ev) =>
                        setNuevoRolPiloto(ev.target.value as "Titular" | "Suplente")
                      }
                      className="p-2 border rounded bg-input text-foreground"
                    >
                      <option value="Titular">Titular</option>
                      <option value="Suplente">Suplente</option>
                    </select>
                    <button
                      onClick={() => guardarEdicionPiloto(e.id, p.id)}
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
                ) : (
                  <>
                    <span>
                      {p.nombre} ({p.rol})
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPilotoEditando(p.id);
                          setNuevoNombrePiloto(p.nombre);
                          setNuevoRolPiloto(p.rol);
                        }}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarPiloto(e.id, p.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          {/* Formulario para agregar pilotos */}
          {escuderiaSeleccionada === e.id ? (
            <div className="bg-secondary text-secondary-foreground p-3 rounded">
              <input
                type="text"
                value={nombrePiloto}
                onChange={(ev) => setNombrePiloto(ev.target.value)}
                placeholder="Nombre del piloto"
                className="w-full p-2 border rounded mb-2 bg-input text-foreground"
              />
              <select
                value={rolPiloto}
                onChange={(ev) =>
                  setRolPiloto(ev.target.value as "Titular" | "Suplente")
                }
                className="w-full p-2 border rounded mb-2 bg-input text-foreground"
              >
                <option value="Titular">Titular</option>
                <option value="Suplente">Suplente</option>
              </select>
              <button
                onClick={() => agregarPiloto(e.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Guardar Piloto
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEscuderiaSeleccionada(e.id)}
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
