"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!)

//TODO manejar errores en las consultas a la DB. También se prodría notificar cuando los datos se guardan exitosamente
export default function Home() {
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null)
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]);
  const [listaCarreras, setListaCarreras] = useState<Carrera[]>([]);
  const [listaPilotos, setListaPilotos] = useState<Piloto[]>([]);
  const [listaPilotosOriginal, setListaPilotosOriginal] = useState<Piloto[]>([]);

  type Piloto = {
    id_piloto: number;
    nombre: string;
    foto? : string;
    puntos: number;
  }

  type Carrera = {
    id_carrera: number;
    nombre: string;
  }

  type Categoria = {
    id_categoria: number;
    nombre: string
  }

  useEffect(() => {
    async function fetchCategorias() {
      const { data: categorias, error } = await supabase
        .from("Categoria")
        .select('nombre, id_categoria');
      if (error) 
        console.error(error.message);
      if (categorias) {
        setListaCategorias(categorias.map((it: any) => (
          {
            id_categoria: it.id_categoria,
            nombre: it.nombre,
          }
        )));
      }
    }
    fetchCategorias();
  }, []);


  const handleSelectCategoria = async (item: string) => {
    setSelectedCarrera(null);
    const categoriaSeleccionada = listaCategorias.find((categoria) => categoria.nombre === item)
    if (categoriaSeleccionada)
      setSelectedCategoria(categoriaSeleccionada);
    const { data, error } = await supabase
      .from('Carrera')
      .select('id_carrera, nombre')
      .eq('id_categoria', categoriaSeleccionada?.id_categoria)
    if (error)
      console.error(error.message)
    if (data) {
      setListaCarreras(data.map((it: any) => (
        {
          id_carrera: it.id_carrera,
          nombre: it.nombre,
        }
      )));
    }

  };

   const handleSelectCarrera = async (item: String) => {
    const carreraSeleccionada = listaCarreras.find((carrera) => carrera.nombre === item)
    setSelectedCarrera(carreraSeleccionada!)
    if (carreraSeleccionada)
      await fetchPilotosCarrera(carreraSeleccionada);
  }

  async function fetchPilotosCarrera(carrera : Carrera){
    const { data, error } = await supabase
      .from('Corre')
      .select(`
          id_piloto,
          puntaje,
          Piloto (
            nombre,
            foto
          )
        `)
      .eq('id_carrera', carrera?.id_carrera);
    if (error)
      console.error(error.message);
    if (data) {
      const pilotos = data.map((it: any) => ({
        id_piloto: it.id_piloto,
        nombre: it.Piloto?.nombre,
        foto: it.Piloto?.foto,
        puntos: it.puntaje
      })).sort((a, b) => b.puntos - a.puntos);
      setListaPilotos(pilotos);
      setListaPilotosOriginal(pilotos.map(p => ({ ...p })));
    }
  }


  function handlePuntosChange(p: Piloto, nuevoValor: number) {
    setListaPilotos(listaPilotos.map(piloto =>
      piloto.id_piloto === p.id_piloto ? { ...piloto, puntos: nuevoValor } : piloto
    ));
  }

  const cargarPuntosEnDB = () => {
    setListaPilotosOriginal(listaPilotos.map(p => ({ ...p })))
    listaPilotos.forEach(async piloto => {
      const { data, error } = await supabase
        .from('Corre')
        .update({ puntaje: piloto.puntos })
        .eq('id_piloto', piloto.id_piloto)
        .eq('id_carrera', selectedCarrera?.id_carrera);
      if (error) {
        console.error('Error updating puntaje:', error.message);
      } else {
        console.log('Updated data:', data);
      }
    }
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Encabezado */}
        <div className="bg-white border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Puntaje</h1>
              <p className="text-gray-600 mt-1">Administra el puntaje de los pilotos en una carrera</p>
            </div>
            <Link 
                href="/" 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                ← Página principal
            </Link>
          </div>
        </div>
        
        {/* Selección de categoría */}
        <div className="p-4 bg-white border border-gray-200 space-y-3">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Categoría</label>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex justify-between items-center">
              {selectedCategoria ? selectedCategoria.nombre : "Seleccione una categoría"}
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-full">
              {listaCategorias.map((cat) => (
                <DropdownMenuItem
                  key={cat.id_categoria}
                  onSelect={() => handleSelectCategoria(cat.nombre)}
                  className="cursor-pointer"
                >
                  {cat.nombre}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Selección de carrera */}
        <div className="p-4 bg-white border border-gray-200 space-y-3">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Carrera</label>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`w-full ${
                listaCarreras.length === 0
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              } px-3 py-2 rounded-lg flex justify-between items-center`}
              disabled={listaCarreras.length === 0}
            >
              {selectedCarrera ? selectedCarrera.nombre : "Seleccione una carrera"}
            </DropdownMenuTrigger>

            {listaCarreras.length > 0 && (
              <DropdownMenuContent className="w-full">
                {listaCarreras.map((car) => (
                  <DropdownMenuItem
                    key={car.id_carrera}
                    onSelect={() => handleSelectCarrera(car.nombre)}
                    className="cursor-pointer"
                  >
                    {car.nombre}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </div>

        {/* Lista de pilotos */} 
        {listaPilotos.length > 0 && (
          <div className="p-4 bg-white border border-gray-200 space-y-3">
            <label className="block text-lg font-semibold text-gray-700 mb-2">Puntajes</label>
            {listaPilotos.map((p) => (
                      <div
                        key={p.id_piloto}
                        className="flex justify-between items-center border-b border-gray-100 pb-2"
                      >
                        <div className="flex items-center gap-3">
                          {p.foto && (
                            <Image
                              src={p.foto}
                              alt={p.nombre}
                              width={45}
                              height={45}
                              className="rounded-full object-cover border"
                            />
                          )}
                          <span className="text-gray-800 font-medium">{p.nombre}</span>
                        </div>

                        <input
                          type="number"
                          min="0"
                          value={p.puntos}
                          onChange={(e) =>
                            handlePuntosChange(p, Number(e.target.value))
                          }
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-center focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
              </div>
            ))}

            {/* Botones */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cargarPuntosEnDB}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Guardar Puntaje
              </button>
              <button
                onClick={() => setListaPilotos(listaPilotosOriginal)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Resetear
              </button>
            </div>
          </div>
        )}
      </div> 
    </div>
  )
}
