"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/toast-provider"

const supabase = createClient()

type Piloto = {
  id_piloto: number
  nombre: string
  fecha_nacimiento: string
}

export default function PilotosPage() {
  const [pilotos, setPilotos] = useState<Piloto[]>([])
  const [loading, setLoading] = useState(true)

  const [nombre, setNombre] = useState("")
  const [fecha, setFecha] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const { addToast } = useToast()

  // 🔹 Cargar pilotos al inicio
  useEffect(() => {
    fetchPilotos()
  }, [])

  async function fetchPilotos() {
    setLoading(true)
    const { data, error } = await supabase
      .from("Piloto")
      .select("*")
      .order("id_piloto")

    if (!error && data) setPilotos(data)
    setLoading(false)
  }

  // 🔹 Validación
  function validarInputs(): boolean {
    if (!nombre.trim()) {
      setErrorMsg("El nombre no puede estar vacío.")
      return false
    }
    if (!fecha) {
      setErrorMsg("Debe ingresar una fecha de nacimiento válida.")
      return false
    }
    setErrorMsg("")
    return true
  }

  // 🔹 Añadir piloto
  async function addPiloto() {
    if (!validarInputs()) return
    const nuevo = { nombre, fecha_nacimiento: fecha }
    const { error } = await supabase.from("Piloto").insert([nuevo])
    if (!error) {
      setNombre("")
      setFecha("")
      fetchPilotos()
      addToast(`Piloto "${nuevo.nombre}" añadido exitosamente`)
    } else {
      addToast("Error al añadir el piloto")
    }
  }

  // 🔹 Editar piloto (con feedback)
  async function updatePiloto(p: Piloto, newNombre: string, newFecha: string) {
    if (newNombre === p.nombre && newFecha === p.fecha_nacimiento) return

    const { error } = await supabase
      .from("Piloto")
      .update({ nombre: newNombre, fecha_nacimiento: newFecha })
      .eq("id_piloto", p.id_piloto)

    if (!error) {
      fetchPilotos()
      if (newNombre !== p.nombre) {
        addToast(
          `Cambio de nombre de piloto ${p.nombre} (${p.id_piloto}) a ${newNombre}`
        )
      } else if (newFecha !== p.fecha_nacimiento) {
        addToast(
          `Cambio de fecha de nacimiento para el piloto ${p.nombre} (${p.id_piloto}), ${p.fecha_nacimiento} -> ${newFecha}`
        )
      }
    }
  }

  // 🔹 Eliminar piloto (con feedback y FK constraint)
  async function deletePiloto(p: Piloto) {
    const { error } = await supabase
      .from("Piloto")
      .delete()
      .eq("id_piloto", p.id_piloto)

    if (!error) {
      setPilotos((prev) => prev.filter((x) => x.id_piloto !== p.id_piloto))
      addToast(`Piloto "${p.nombre}" (${p.id_piloto}) eliminado`)
    } else {
      if (error.message.includes("foreign key constraint")) {
        addToast(
          `No se puede eliminar el piloto ${p.nombre} (${p.id_piloto}) porque tiene entradas en la tabla corre.`
        )
      } else {
        addToast("Error durante la eliminación del piloto")
      }
      console.log(error)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-xl p-6 rounded-2xl shadow-lg space-y-6">
        {/* Encabezado */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestión de Pilotos</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>

        {/* Formulario añadir */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <input
              type="date"
              placeholder="Fecha de nacimiento"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={addPiloto}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Añadir
            </button>
          </div>
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
        </div>

        {/* Lista de pilotos */}
        <div className="min-h-[200px] transition-all duration-300">
          {loading ? (
            <p className="text-gray-500">Cargando pilotos...</p>
          ) : (
            <ul className="space-y-3">
              {pilotos.map((p) => (
                <li
                  key={p.id_piloto}
                  className="flex gap-2 items-center transition-all"
                >
                  <input
                    type="text"
                    defaultValue={p.nombre}
                    onBlur={(e) =>
                      updatePiloto(p, e.target.value, p.fecha_nacimiento)
                    }
                    className="border p-1 rounded flex-1"
                  />
                  <input
                    type="date"
                    defaultValue={p.fecha_nacimiento}
                    onBlur={(e) =>
                      updatePiloto(p, p.nombre, e.target.value)
                    }
                    className="border p-1 rounded"
                  />
                  <button
                    onClick={() => deletePiloto(p)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
