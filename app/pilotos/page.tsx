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
    activo: boolean
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
            .eq("activo", true) // solo activos
            .order("id_piloto")

        if (!error && data) setPilotos(data)
        setLoading(false)
    }

    // 🔹 Validación de inputs
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

    // 🔹 Añadir piloto (con verificación duplicados)
    async function addPiloto() {
        if (!validarInputs()) return

        // Verificar si existe ya
        const { data: existentes, error: errorCheck } = await supabase
            .from("Piloto")
            .select("*")
            .eq("nombre", nombre.trim())
            .eq("fecha_nacimiento", fecha)

        if (errorCheck) {
            addToast("Error al verificar duplicados")
            return
        }

        if (existentes && existentes.length > 0) {
            const existente = existentes[0]
            if (existente.activo) {
                addToast("Ya existe un piloto con ese nombre y fecha de nacimiento.")
                return
            } else {
                // reactivar
                const { error } = await supabase
                    .from("Piloto")
                    .update({ activo: true })
                    .eq("id_piloto", existente.id_piloto)
                if (!error) {
                    setPilotos((prev) => [...prev, { ...existente, activo: true }])
                    setNombre("")
                    setFecha("")
                }
                return
            }
        }

        // insertar nuevo
        const nuevo = { nombre, fecha_nacimiento: fecha, activo: true }
        const { data, error } = await supabase.from("Piloto").insert([nuevo]).select().single()

        if (!error && data) {
            setPilotos((prev) => [...prev, data]) // agregar al final sin recargar lista
            setNombre("")
            setFecha("")
            addToast(`Piloto "${nuevo.nombre}" añadido exitosamente`)
        } else {
            addToast("Error al añadir el piloto")
        }
    }

    // 🔹 Editar piloto
    async function updatePiloto(p: Piloto, newNombre: string, newFecha: string) {
        if (newNombre === p.nombre && newFecha === p.fecha_nacimiento) return

        const { error } = await supabase
            .from("Piloto")
            .update({ nombre: newNombre, fecha_nacimiento: newFecha })
            .eq("id_piloto", p.id_piloto)

        if (!error) {
            setPilotos((prev) =>
                prev.map((x) =>
                    x.id_piloto === p.id_piloto
                        ? { ...x, nombre: newNombre, fecha_nacimiento: newFecha }
                        : x
                )
            )
            if (newNombre !== p.nombre) {
                addToast(
                    `Cambio de nombre de piloto ${p.nombre} (${p.id_piloto}) a ${newNombre}`
                )
            } else if (newFecha !== p.fecha_nacimiento) {
                addToast(
                    `Cambio de fecha de nacimiento para el piloto ${p.nombre} (${p.id_piloto}), ${p.fecha_nacimiento} a ${newFecha}`
                )
            }
        }
    }

    // 🔹 Eliminar piloto (borrado lógico si falla el físico)
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
                // marcar como inactivo
                const { error: softError } = await supabase
                    .from("Piloto")
                    .update({ activo: false })
                    .eq("id_piloto", p.id_piloto)
                if (!softError) {
                    setPilotos((prev) => prev.filter((x) => x.id_piloto !== p.id_piloto))
                    addToast(`Piloto "${p.nombre}" (${p.id_piloto}) eliminado`)
                }
            } else {
                addToast("Error durante la eliminación del piloto")
                console.log(error)
            }
        }
    }

    return (
        <div className="flex justify-center min-h-screen">
            <div className="w-full max-w-xl p-6 rounded-2xl shadow-lg space-y-6">
                {/* Encabezado */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Gestión de pilotos</h1>
                    <Link href="/" className="text-blue-600 hover:underline">
                        Página principal
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
                        <div className="flex justify-center items-center h-40">
                            <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        </div>
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
