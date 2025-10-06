"use client";
import { useEffect, useState } from "react";
import GranPrixDropdown from "@/components/gp-dropdown-list";
import { createClient } from "@supabase/supabase-js";
import Autocomplete from "@/components/autocomplete";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!)

//TODO manejar errores en las consultas a la DB. También se prodría notificar cuando los datos se guardan exitosamente
export default function Home() {
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null)
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]);
  const [listaCarreras, setListaCarreras] = useState<Carrera[]>([]);
  const [listaPilotos, setListaPilotos] = useState<Piloto[]>([]);
  const [listaPilotosOriginal, setListaPilotosOriginal] = useState<Piloto[]>([]);
  var copiaListaPilotos: Piloto[];
type Piloto = {
  id_piloto: number;
  nombre: string;
  puntos: number;
}

type Carrera = {
  id_carrera: number;
  nombre:string;
}

type Categoria = {
  id_categoria:number;
  nombre:string
}

useEffect(() => {
  async function fetchCategorias() {
    const { data: categorias, error } = await supabase
      .from("Categoria")
      .select('nombre, id_categoria');
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
    const categoriaSeleccionada = listaCategorias.find((categoria)=> categoria.nombre === item)
    if(categoriaSeleccionada)
      setSelectedCategoria(categoriaSeleccionada);
    const { data, error } = await supabase
      .from('Carrera')
      .select('id_carrera, nombre')
      .eq('id_categoria', categoriaSeleccionada?.id_categoria)
    if(error)
        console.log(error)
    if (data) {
      setListaCarreras(data.map((it: any) => (
        {
          id_carrera: it.id_carrera, 
          nombre: it.nombre  ,   
          }
      )));
      console.log(listaCarreras)
    }
      
  };

    const handleSelectCarrera = async (item: String) => {
      const carreraSeleccionada = listaCarreras.find((carrera)=> carrera.nombre === item)
      setSelectedCarrera(carreraSeleccionada!)
      console.log(carreraSeleccionada)
      const { data, error } = await supabase
        .from('Corre')
        .select(`
          id_piloto,
          puntaje,
          Piloto (
            nombre
          )
        `)
        .eq('id_carrera', carreraSeleccionada?.id_carrera);
      if(data){
        const pilotos = data.map((it: any) => ({
          id_piloto: it.id_piloto, 
          nombre: it.Piloto?.nombre  ,
          puntos: it.puntaje     
          })).sort((a,b) => b.puntos - a.puntos);
          setListaPilotos(pilotos);
          setListaPilotosOriginal(pilotos.map(p => ({ ...p })));
        }
    console.log("Selected carrera:", item);
  };

function handlePuntosChange(p: Piloto, nuevoValor: number) {
  setListaPilotos(listaPilotos.map(piloto =>
    piloto.id_piloto === p.id_piloto ? { ...piloto, puntos: nuevoValor } : piloto
  ));
}


  const cargarPuntosEnDB = ()=>{
    listaPilotos.forEach(async piloto =>{
      const { data, error } = await supabase
          .from('Corre')                  
          .update({ puntaje: piloto.puntos })   
          .eq('id_piloto', piloto.id_piloto)     
          .eq('id_carrera', selectedCarrera?.id_carrera); 
        if (error) {
          console.error('Error updating puntaje:', error);
        } else {
          console.log('Updated data:', data);
        }
      }
    )
  } 

  return (
    <main className="p-10 min-h-screen flex flex-col items-center">
      <title>Asignación de puntos</title>
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-1"> Seleccione una categoría</h1>
        <GranPrixDropdown
          label="Seleccione una categoría"
          listaGP={listaCategorias.map(it=>it.nombre)}
          setSelected={handleSelectCategoria}
        />
      </div>
      {selectedCategoria && (
        <div className="flex flex-col items-center justify-center mt-6">
          <h1 className="mb-1">Seleccione una carrera</h1>
          <GranPrixDropdown
            label="Seleccione carrera"
            listaGP={listaCarreras.map(it=>it.nombre)} 
            setSelected={handleSelectCarrera}
          />
        </div>
      )}
      {/*selectedCarrera && (
        <div className="flex flex-col items-center justify-center mt-6">
        <h2 className="mb-1">Añadir piloto clasificado</h2>
          <Autocomplete 
            items={listaPilotos.map((it) => it.nombre)}
            setSelected={handleSelectPiloto}
            />
        </div>
      )*/}

      {listaPilotos.length > 0 && (
        <div>
          <ul className="mb-3 mt-4">
            {listaPilotos?.map((p) => (
              <li key={p.id_piloto} className="flex justify-between items-center bg-muted p-2 rounded mb-1 w-96">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <span>
                      {p.nombre}
                    </span>
                  </div>
                  <div className="flex items-center h-full">
                    <input
                      type="number"
                      min="0"
                      value={p.puntos}
                      onChange={e => handlePuntosChange(p, Number(e.target.value))}
                      className="border px-2 py-1 rounded mt-1 mb-1 w-16 text-center"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between w-96 mt-2">
            <button
              onClick={() => cargarPuntosEnDB()}
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
            >
              Guardar Puntaje
            </button>
            <button
              onClick={() => setListaPilotos(listaPilotosOriginal)}
              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Resetear
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
