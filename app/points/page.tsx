"use client";
import { useEffect, useState } from "react";
import GranPrixDropdown from "@/components/gp-dropdown-list";
import { createClient } from "@supabase/supabase-js";
import Autocomplete from "@/components/autocomplete";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!)

//TODO manejar errores en las consultas a la DB. También se prodría notificar cuando los datos se guardan exitosamente
export default function Home() {
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null)
  const [listaCategorias, setListaCategorias] = useState<string[]>([]);
  const [listaCarreras, setListaCarreras] = useState<Carrera[]>([]);
  const [listaPilotos, setListaPilotos] = useState<Piloto[]>([]);
  const [listaPilotosAPuntear, setListaPilotosAPuntear] = useState<Piloto[]>([]);
  
type Piloto = {
  id_piloto: number;
  nombre: string;
  puntos: number;
}

type Carrera = {
  id_carrera: number;
  nombre:string;
}

  
  const handleSelectCategoria = async (item: string) => {
    setSelectedCategoria(item);
    const { data, error } = await supabase
      .from('Carrera')
      .select(
        `
        id_carrera,
        nombre
        `,
      )
      .ilike('id_categoria', `${selectedCategoria}`)
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
  
  useEffect(() => {
    async function fetchCategorias() {
      const { data: categorias, error } = await supabase
        .from("Categoria")
        .select('nombre');
      if (categorias) {
        setListaCategorias(categorias.map((it: any) => it.nombre));
      }
    }
    fetchCategorias();
  }, []);

  

    const handleSelectCarrera = async (item: String) => {
      const carreraSeleccionada = listaCarreras.find((carrera)=> carrera.nombre === item)
      setSelectedCarrera(carreraSeleccionada!)
      const { data, error } = await supabase
        .from('Piloto')
        .select(
          `
          *,
          ...corre!inner()
          `,
        )
       .eq('corre.id_carrera', `${selectedCarrera}`);
      if(data)
        setListaPilotos(data.map((it: any) => ({
          id_piloto: it.id_piloto, 
          nombre: it.nombre  ,
          puntos: it.puntos     
          }))
        );
    console.log("Selected carrera:", item);
  };

  const handleSelectPiloto = (item: string) => {
    const pilotoSeleccionado = listaPilotos.find(piloto => piloto.nombre === item);
    if (pilotoSeleccionado) {
      setListaPilotosAPuntear([...listaPilotosAPuntear, pilotoSeleccionado]);
      setListaPilotos(listaPilotos.filter(piloto => piloto.nombre !== item));
    }
    console.log(pilotoSeleccionado)
  }
  
  const eliminarPilotoDeListaAPuntear = (item: Piloto) => {
    setListaPilotosAPuntear(listaPilotosAPuntear.filter(piloto => piloto.id_piloto !== item.id_piloto));
    setListaPilotos([...listaPilotos, item]);
  }


  function handlePuntosChange(id_piloto: number, nuevoValor: number) { //TODO controlar que el valor ingresado es válido
  setListaPilotosAPuntear(listaPilotosAPuntear.map(piloto =>
    piloto.id_piloto === id_piloto ? { ...piloto, puntos: nuevoValor } : piloto
  ));
}


  const cargarPuntosEnDB = ()=>{
    listaPilotosAPuntear.forEach(async piloto =>{
      const { data, error } = await supabase
          .from('corre')                  
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


 // {categorySelected && <GranPrixDropdown label="Seleccione carrera" listaGP={} setSelected={}/>}
  return (
    <main className="p-10">
      <h1> Seleccione una categoría</h1>
      <GranPrixDropdown
        label="Seleccione una categoría"
        listaGP={listaCategorias}
        setSelected={handleSelectCategoria}
      />
      {selectedCategoria && (
        <div className="mt-6">
          <h2>Seleccione una carrera</h2>
          <GranPrixDropdown
            label="Seleccione carrera"
            listaGP={listaCarreras.map(it=>it.nombre)} //debug
            setSelected={handleSelectCarrera}
          />
        </div>
      )}
      {selectedCarrera && (
        <div className="mt-6">
        <h2>Añadir piloto clasificado</h2>
          <Autocomplete 
            items={listaPilotos.map((it) => it.nombre)}
            setSelected={handleSelectPiloto}
            />
        </div>
      )}

      {listaPilotosAPuntear.length > 0 && (
        <div>
          <ul className="mb-3">
            {listaPilotosAPuntear?.map((p) => (
              <li key={p.id_piloto} className="flex justify-between items-center bg-muted p-2 rounded mb-1 w-96">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <span>
                      {p.nombre}
                    </span>
                  </div>
                  <div>
                    <input
                      type="number"
                      onChange={e => handlePuntosChange(p.id_piloto, Number(e.target.value))}
                      className="border px-2 py-1 rounded mb-4 w-16 text-center"
                    />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => eliminarPilotoDeListaAPuntear(p)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => console.log(listaPilotosAPuntear)}
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Guardar Puntaje
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
