"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/toast-provider"
import { subirFotoPiloto } from "@/lib/supabase/storage"

const supabase = createClient()

// Force dynamic rendering to avoid build-time Supabase calls
export const dynamic = 'force-dynamic';

export type Piloto = {
    id_piloto: number
    nombre: string
    fecha_nacimiento: string
    pais: string
    foto?: string
    activo: boolean
}

// Componente para editar piloto
function EditarPiloto({ 
    piloto, 
    onGuardar, 
    onCancelar 
}: {
    piloto: Piloto;
    onGuardar: (piloto: Piloto, nombre: string, fecha: string, pais: string, nuevaFoto?: File | null) => void;
    onCancelar: () => void;
}) {
    const [nombre, setNombre] = useState(piloto.nombre);
    const [fecha, setFecha] = useState(piloto.fecha_nacimiento);
    const [pais, setPais] = useState(piloto.pais || '');
    const [nuevaFoto, setNuevaFoto] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string>("");

    const manejarCambioFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNuevaFoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGuardar = () => {
        onGuardar(piloto, nombre, fecha, pais, nuevaFoto);
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="bg-white border border-gray-300 p-2 rounded flex-1 font-medium"
                    placeholder="Nombre del piloto"
                />
                <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="bg-white border border-gray-300 p-2 rounded"
                />
            </div>
            
            <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-800 font-medium">País:</span>
                <input
                    type="text"
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    placeholder="País de origen"
                    className="text-sm bg-white border border-gray-300 px-2 py-1 rounded flex-1"
                />
            </div>

            {/* Sección de edición de foto */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Foto (opcional)
                </label>
                <div className="flex gap-4 items-center">
                    {/* Vista previa solo de la nueva imagen */}
                    {fotoPreview && (
                        <div className="flex-shrink-0">
                            <img 
                                src={fotoPreview} 
                                alt="Preview nueva foto" 
                                className="w-16 h-16 object-cover rounded-full border-2 border-green-500"
                            />
                        </div>
                    )}
                    
                    {/* Input de archivo */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={manejarCambioFoto}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-green-50 file:text-green-600 hover:file:bg-green-100"
                    />
                </div>
                {fotoPreview && (
                    <p className="text-xs text-green-600 mt-1">✓ Nueva foto seleccionada</p>
                )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
                <button
                    onClick={handleGuardar}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                    Guardar
                </button>
                <button
                    onClick={onCancelar}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}

export default function PilotosPage() {
    const [pilotos, setPilotos] = useState<Piloto[]>([])
    const [loading, setLoading] = useState(true)

    const [nombre, setNombre] = useState("")
    const [fecha, setFecha] = useState("")
    const [paisOrigen, setPaisOrigen] = useState("")
    const [fotoFile, setFotoFile] = useState<File | null>(null)
    const [fotoPreview, setFotoPreview] = useState<string>("")
    const [errorMsg, setErrorMsg] = useState("")
    const [uploading, setUploading] = useState(false)

    // Estados para edición y eliminación
    const [editandoPiloto, setEditandoPiloto] = useState<number | null>(null)
    const [pilotoAEliminar, setPilotoAEliminar] = useState<Piloto | null>(null)

    const { addToast } = useToast()

    // 🔹 Cargar pilotos al inicio
    useEffect(() => {
        fetchPilotos()
    }, [])

    async function fetchPilotos() {
        setLoading(true)
        const { data, error } = await supabase
            .from("Piloto")
            .select(`id_piloto, nombre, fecha_nacimiento, pais, foto, activo`)
            .eq("activo", true) // solo activos
            .order("id_piloto")

        if (error) {
            console.error('Error fetching pilotos:', error)
            addToast("Error al cargar pilotos")
        } else if (data) {
            console.log('Pilotos cargados:', data) // Debug para ver qué datos llegan
            setPilotos(data)
        }
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
        if (!paisOrigen.trim()) {
            setErrorMsg("Debe ingresar el país de origen.")
            return false
        }
        setErrorMsg("")
        return true
    }

    // 🔹 Manejar selección de foto
    function manejarFoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setFotoFile(file)
            
            // Crear preview de la imagen
            const reader = new FileReader()
            reader.onloadend = () => {
                setFotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // 🔹 Limpiar formulario
    function limpiarFormulario() {
        setNombre("")
        setFecha("")
        setPaisOrigen("")
        setFotoFile(null)
        setFotoPreview("")
        setErrorMsg("")
    }

    // 🔹 Añadir piloto (con verificación duplicados)
    async function addPiloto() {
        if (!validarInputs()) return
        
        setUploading(true)

        try {
            // Verificar si existe ya
            const { data: existentes, error: errorCheck } = await supabase
                .from("Piloto")
                .select("*")
                .eq("nombre", nombre.trim())
                .eq("fecha_nacimiento", fecha)

            if (errorCheck) {
                addToast("Error al verificar duplicados")
                setUploading(false)
                return
            }

            if (existentes && existentes.length > 0) {
                const existente = existentes[0]
                if (existente.activo) {
                    addToast("Ya existe un piloto con ese nombre y fecha de nacimiento.")
                    setUploading(false)
                    return
                } else {
                    // reactivar piloto existente
                    let fotoUrl = existente.foto
                    
                    // Si hay una nueva foto, subirla
                    if (fotoFile) {
                        const nuevaFotoUrl = await subirFotoPiloto(fotoFile, existente.id_piloto.toString())
                        if (nuevaFotoUrl) {
                            fotoUrl = nuevaFotoUrl
                        }
                    }

                    const { error } = await supabase
                        .from("Piloto")
                        .update({ 
                            activo: true, 
                            pais: paisOrigen.trim(),
                            foto: fotoUrl
                        })
                        .eq("id_piloto", existente.id_piloto)
                        
                    if (!error) {
                        setPilotos((prev) => [...prev, { 
                            ...existente, 
                            activo: true, 
                            pais: paisOrigen.trim(),
                            foto: fotoUrl
                        }])
                        limpiarFormulario()
                        addToast(`Piloto "${existente.nombre}" reactivado exitosamente`)
                    }
                    setUploading(false)
                    return
                }
            }

            // Insertar nuevo piloto
            const nuevo = { 
                nombre: nombre.trim(), 
                fecha_nacimiento: fecha, 
                pais: paisOrigen.trim(),
                activo: true 
            }
            
            const { data, error } = await supabase
                .from("Piloto")
                .insert([nuevo])
                .select()
                .single()

            if (error || !data) {
                addToast("Error al crear el piloto")
                setUploading(false)
                return
            }

            // Subir foto si existe
            let fotoUrl = null
            if (fotoFile) {
                fotoUrl = await subirFotoPiloto(fotoFile, data.id_piloto.toString())
                
                // Actualizar el piloto con la URL de la foto
                if (fotoUrl) {
                    await supabase
                        .from("Piloto")
                        .update({ foto: fotoUrl })
                        .eq("id_piloto", data.id_piloto)
                }
            }

            // Agregar a la lista con la foto URL si existe
            setPilotos((prev) => [...prev, { ...data, foto: fotoUrl }])
            limpiarFormulario()
            addToast(`Piloto "${nuevo.nombre}" añadido exitosamente`)
            
        } catch (error) {
            console.error('Error en addPiloto:', error)
            addToast("Error al procesar el piloto")
        } finally {
            setUploading(false)
        }
    }

    // 🔹 Editar piloto
    async function updatePiloto(p: Piloto, newNombre: string, newFecha: string, newPais?: string, newFoto?: string) {
        const cambios: any = {}
        
        if (newNombre !== p.nombre) cambios.nombre = newNombre
        if (newFecha !== p.fecha_nacimiento) cambios.fecha_nacimiento = newFecha  
        if (newPais && newPais !== p.pais) cambios.pais = newPais
        if (newFoto && newFoto !== p.foto) cambios.foto = newFoto

        // Si no hay cambios, no hacer nada
        if (Object.keys(cambios).length === 0) return

        const { error } = await supabase
            .from("Piloto")
            .update(cambios)
            .eq("id_piloto", p.id_piloto)

        if (!error) {
            setPilotos((prev) =>
                prev.map((x) =>
                    x.id_piloto === p.id_piloto
                        ? { ...x, ...cambios }
                        : x
                )
            )
            
            // Mostrar mensaje apropiado basado en lo que cambió
            if (newFoto && newFoto !== p.foto) {
                addToast(`Foto actualizada para el piloto ${p.nombre}`)
            } else if (newNombre !== p.nombre) {
                addToast(`Cambio de nombre de piloto ${p.nombre} (${p.id_piloto}) a ${newNombre}`)
            } else if (newFecha !== p.fecha_nacimiento) {
                addToast(`Cambio de fecha de nacimiento para el piloto ${p.nombre} (${p.id_piloto}), ${p.fecha_nacimiento} a ${newFecha}`)
            } else if (newPais && newPais !== p.pais) {
                addToast(`País actualizado para el piloto ${p.nombre}`)
            }
        } else {
            addToast("Error al actualizar el piloto")
            console.error('Error actualizando piloto:', error)
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

    // 🔹 Funciones para edición
    const iniciarEdicion = (id: number) => {
        setEditandoPiloto(id)
    }

    const cancelarEdicion = () => {
        setEditandoPiloto(null)
    }

    const guardarEdicion = async (piloto: Piloto, nuevoNombre: string, nuevaFecha: string, nuevoPais: string, nuevaFoto?: File | null) => {
        // Si hay una nueva foto, subirla primero
        let fotoUrl = piloto.foto; // Mantener la foto actual por defecto
        
        if (nuevaFoto) {
            try {
                const nuevaFotoUrl = await subirFotoPiloto(nuevaFoto, piloto.id_piloto.toString());
                if (nuevaFotoUrl) {
                    fotoUrl = nuevaFotoUrl;
                }
            } catch (error) {
                console.error('Error subiendo nueva foto:', error);
                addToast("Error al subir la nueva foto, pero se guardaron los otros cambios");
                // Continúa con la actualización sin cambiar la foto
            }
        }
        
        // Actualizar piloto incluyendo la nueva foto si existe
        await updatePiloto(piloto, nuevoNombre, nuevaFecha, nuevoPais, fotoUrl)
        setEditandoPiloto(null)
    }

    // 🔹 Funciones para confirmación de eliminación
    const confirmarEliminacion = (piloto: Piloto) => {
        setPilotoAEliminar(piloto)
    }

    const cancelarEliminacion = () => {
        setPilotoAEliminar(null)
    }

    const ejecutarEliminacion = async () => {
        if (pilotoAEliminar) {
            await deletePiloto(pilotoAEliminar)
            setPilotoAEliminar(null)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Encabezado */}
                <div className="bg-white border-b border-gray-200 pb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Gestión de Pilotos</h1>
                            <p className="text-gray-600 mt-1">Administra la información de los pilotos de F1</p>
                        </div>
                        <Link 
                            href="/admin" 
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            ← Página principal
                        </Link>
                    </div>
                </div>

                {/* Formulario añadir */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-xl text-gray-900 mb-4">Agregar Nuevo Piloto</h3>
                    
                    {/* Primera fila: Nombre y Fecha */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre completo
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Lewis Hamilton"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de nacimiento
                            </label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Segunda fila: País */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            País de origen
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Reino Unido"
                            value={paisOrigen}
                            onChange={(e) => setPaisOrigen(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                        />
                    </div>

                    {/* Tercera fila: Foto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Foto de perfil (opcional)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={manejarFoto}
                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                            />
                            
                            {/* Preview de la foto */}
                            {fotoPreview && (
                                <div className="flex-shrink-0">
                                    <img 
                                        src={fotoPreview} 
                                        alt="Preview" 
                                        className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botón de agregar */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            onClick={addPiloto}
                            disabled={uploading}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                uploading 
                                ? 'bg-gray-400 cursor-not-allowed text-white' 
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md'
                            }`}
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Guardando...
                                </span>
                            ) : (
                                'Añadir Piloto'
                            )}
                        </button>
                    </div>
                    
                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
                        </div>
                    )}
                </div>

                {/* Lista de pilotos */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Lista de Pilotos ({pilotos.length})
                        </h3>
                    </div>
                    
                    <div className="p-6 min-h-[200px] transition-all duration-300">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-gray-600">Cargando pilotos...</span>
                                </div>
                            </div>
                        ) : pilotos.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">🏎️</div>
                                <p className="text-gray-500 text-lg">No hay pilotos registrados</p>
                                <p className="text-gray-400 text-sm mt-2">Agrega el primer piloto usando el formulario de arriba</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                            {pilotos.map((p) => {
                                const estaEditando = editandoPiloto === p.id_piloto;
                                
                                return (
                                <div
                                    key={p.id_piloto}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 text-gray-800"
                                >
                                    <div className="flex gap-3 items-center">
                                        {/* Foto del piloto */}
                                        <div className="flex-shrink-0">
                                            {p.foto ? (
                                                <img 
                                                    src={p.foto} 
                                                    alt={p.nombre}
                                                    className="w-16 h-16 object-cover rounded-full border-2 border-gray-200 text-gray-800"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs">Sin foto</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Información del piloto */}
                                        <div className="flex-grow space-y-2">
                                            {estaEditando ? (
                                                /* MODO EDICIÓN */
                                                <EditarPiloto 
                                                    piloto={p} 
                                                    onGuardar={guardarEdicion}
                                                    onCancelar={cancelarEdicion}
                                                />
                                            ) : (
                                                /* MODO VISTA */
                                                <div>
                                                    <div className="flex gap-2 items-center">
                                                        <span className="font-medium text-lg">{p.nombre}</span>
                                                        <span className="text-gray-600">({p.fecha_nacimiento})</span>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <span className="text-sm text-gray-600">País:</span>
                                                        <span className="text-sm bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                                                            {p.pais || 'No especificado'}
                                                        </span>
                                                        <span className="text-xs text-gray-500 ml-auto">
                                                            ID: {p.id_piloto}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex-shrink-0 flex gap-2">
                                            {estaEditando ? (
                                                // Botones en modo edición se muestran en el componente EditarPiloto
                                                null
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => iniciarEdicion(p.id_piloto)}
                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded transition-colors"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => confirmarEliminacion(p)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            {pilotoAEliminar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Confirmar eliminación
                        </h3>
                        <p className="text-gray-700 mb-6">
                            ¿Estás seguro de que quieres eliminar al piloto{" "}
                            <span className="font-semibold">{pilotoAEliminar.nombre}</span>?
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelarEliminacion}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ejecutarEliminacion}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
