"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Escuderia } from "@/app/client/escuderias/page";
import { Piloto } from "../pilotos/page";

export type Categoria = {
  id_categoria: number;
  nombre: string;
}

export type Carrera = {
    id_carrera: number;
    nombre: string;
    lugar : string;
    id_categoria : number;
    fecha:string;
}

const supabase = createClient()
const tiposEventos = ["Prueba de Neumáticos", "Control Técnico"]

export default function CreateEventosPage() {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]);
  const [listaCarreras, setListaCarreras] = useState<Carrera[]>([]);
  const [escuderiasConPilotos, setEscuderiasConPilotos] = useState<any[]>([]);
  const [pilotosSeleccionados, setPilotosSeleccionados] = useState<Piloto[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<string | null>(null);
  const [selectedEscuderia, setSelectedEscuderia] = useState<Escuderia | null>(null);
  const [carreraEnEdicion, setCarreraEnEdicion] = useState<Carrera | null>(null);

  useEffect(() => {
    setSelectedCategoria(null);
  }, [tipoSeleccionado]);

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

    if(!selectedCategoria) return;

    const fetchPilotosConEscuderiaDeCategoriaSelecionada = async() =>{
      try{
        const { data: carrerasCat, error: errorCat } = await supabase
          .from("Carrera")
          .select("id_carrera, nombre")
          .eq("id_categoria", selectedCategoria.id_categoria);

        if (errorCat) throw errorCat.message;
        
        setListaCarreras(carrerasCat as Carrera[]);

        const idsCarrerasCat = carrerasCat.map(c => c.id_carrera);

        if (idsCarrerasCat.length === 0) {
          setEscuderiasConPilotos([]);
          return;
        }

        const { data: corre, error: errorCorre } = await supabase
          .from("Corre")
          .select("id_piloto, id_escuderia, id_carrera")
          .in("id_carrera", idsCarrerasCat);

        if (errorCorre) throw errorCorre.message;

        const idsPilotos = [...new Set(corre.map(c => c.id_piloto))];
        const { data: pilotos, error: errorPil } = await supabase
          .from("Piloto")
          .select("id_piloto, nombre, foto")
          .in("id_piloto", idsPilotos);

        if (errorPil) throw errorPil.message;

        
        const { data: escuderias, error: errorEsc } = await supabase
          .from("Escuderia")
          .select("id_escuderia, nombre, logo, color");

        if (errorEsc) throw errorEsc.message;

        const resultado = escuderias.map(esc => {
          const pilotosDeEsc = Array.from(
            new Map(
              corre
                .filter(c => c.id_escuderia === esc.id_escuderia)
                .map(c => {
                  const piloto = pilotos.find(p => p.id_piloto === c.id_piloto);
                  return piloto ? [piloto.id_piloto, piloto] : null;
                })
                .filter(Boolean) as [number, any][]
            ).values()
          );

          return { ...esc, pilotos: pilotosDeEsc };

        })
        
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

        setEscuderiasConPilotos(resultado);
      }
      catch (error) {
        console.error("Error al cargar pilotos por categoría:", error);
      }
    }

    fetchPilotosConEscuderiaDeCategoriaSelecionada();
  }, [selectedCategoria]);

  async function handleEliminarCarrera(carrera: Carrera){
    console.log(carrera)
  }

   async function handleEditarCarrera(carrera: Carrera){
    console.log(carrera)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto p-6 space-y-6">
        {Encabezado()}

        <SelectorTipoEvento onSeleccionar={setTipoSeleccionado} />

        {/* Formularios */}
        {tipoSeleccionado && (
          <div className="mt-10 flex justify-center">
            {tipoSeleccionado === "carrera" ? (
              <div className="flex flex-row gap-6 w-full items-start justify-center">
                <MostrarPilotosCheckbox 
                  escuderiasConPilotos={escuderiasConPilotos} 
                  selectedCategoria={selectedCategoria}
                  pilotosSeleccionados={pilotosSeleccionados}
                  setPilotosSeleccionados={setPilotosSeleccionados}
                />
                <MostrarFormularioCarrera
                  listaCategorias={listaCategorias}
                  selectedCategoria={selectedCategoria}
                  setSelectedCategoria={setSelectedCategoria}
                  pilotosSeleccionados={pilotosSeleccionados}
                  carreraEnEdicion={carreraEnEdicion}
                  setCarreraEnEdicion={setCarreraEnEdicion}
                />
                <MostrarListaCarreras
                  selectedCategoria={selectedCategoria}
                  listaCarreras={listaCarreras}
                  onEditar={setCarreraEnEdicion}
                  onEliminar={(carrera) => {
                    handleEliminarCarrera(carrera)
                  }}
                />
              </div>
              ) : (
              <MostrarFormularioEvento
                listaCategorias={listaCategorias}
                selectedCategoria={selectedCategoria}
                setSelectedCategoria={setSelectedCategoria}
                listaEventos={tiposEventos}
                selectedEvento={selectedEvento}
                setSelectedEvento={setSelectedEvento}
                escuderias={escuderiasConPilotos}
                selectedEscuderia={selectedEscuderia}
                setSelectedEscuderia={setSelectedEscuderia}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function Encabezado(){
  return(
    <div className="bg-white border-b border-gray-200 pb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos Deportivos y Carreras</h1>
          <p className="text-gray-600 mt-1">Crea eventos deportivos o Carreras</p>
        </div>
          <Link 
            href="/admin" 
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            ← Página principal
          </Link>
      </div>
    </div>
  );
}

function SelectorTipoEvento({ onSeleccionar }: { onSeleccionar: (tipo: string) => void }) {
  return (
    <div className="text-xl flex justify-center mt-10">
      <div className="flex gap-6">
        <button
          onClick={() => onSeleccionar("evento")}
          className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all"
        >
          Evento
        </button>

        <button
          onClick={() => onSeleccionar("carrera")}
          className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all"
        >
          Carrera
        </button>
      </div>
    </div>
  );
}

function CategoriasDropdown({
  listaCategorias,
  selectedCategoria,
  setSelectedCategoria,
}: {
  listaCategorias: Categoria[];
  selectedCategoria: Categoria | null;
  setSelectedCategoria: (cat: Categoria) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedCategoria ? selectedCategoria.nombre : "Categoría"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        {listaCategorias.map((cat) => (
          <DropdownMenuItem
            key={cat.id_categoria}
            onClick={() => setSelectedCategoria(cat)}
            className="cursor-pointer"
          >
            {cat.nombre}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MostrarPilotosCheckbox({
  escuderiasConPilotos,
  selectedCategoria,
  pilotosSeleccionados,
  setPilotosSeleccionados,
} : {
  escuderiasConPilotos: any[];
  selectedCategoria: Categoria | null;
  pilotosSeleccionados: Piloto[];
  setPilotosSeleccionados: (pils: Piloto[]) => void;
}){
    return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md w-auto">
      <h3 className="text-lg font-semibold mb-3">Pilotos de la categoría {selectedCategoria?.nombre}</h3>
      {escuderiasConPilotos.map((esc) => (
        <div key={esc.id_escuderia} className="mb-4">
          <h4 className="font-semibold">{esc.nombre}</h4>
          <div className="flex flex-col gap-2 mt-1">
            {esc.pilotos.map((p: any) => (
              <div 
                key={p.id_piloto} 
                className="bg-white flex items-center justify-between border p-2 rounded"
              >
                <div className="flex items-center gap-2">
                  {p.foto && (
                    <img
                      src={p.foto}
                      alt={p.nombre}
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                  )}
                  <span>{p.nombre}</span>
                </div>
                <input 
                  type="checkbox" 
                  className="form-checkbox"
                  checked={pilotosSeleccionados.some(pil => pil.id_piloto === p.id_piloto)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPilotosSeleccionados([...pilotosSeleccionados, p]);
                    } else {
                      setPilotosSeleccionados(
                        pilotosSeleccionados.filter(pil => pil.id_piloto !== p.id_piloto)
                      );
                    }
                  }} 
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MostrarFormularioCarrera({
  listaCategorias,
  selectedCategoria,
  setSelectedCategoria,
  pilotosSeleccionados,
  carreraEnEdicion,
  setCarreraEnEdicion,
}: {
  listaCategorias: Categoria[];
  selectedCategoria: Categoria | null;
  setSelectedCategoria: (cat: Categoria) => void;
  pilotosSeleccionados: Piloto[];
  carreraEnEdicion: Carrera | null;
  setCarreraEnEdicion: (c: Carrera | null) => void;
}) {
    const [error, setError] = useState<string | null>(null);
    const [nombre, setNombre] = useState("");
    const [lugar, setLugar] = useState("");
    const [fecha, setFecha] = useState("");

      useEffect(() => {
    if (carreraEnEdicion) {
      setNombre(carreraEnEdicion.nombre ?? "");
      setLugar(carreraEnEdicion.lugar ?? "");
      setFecha(carreraEnEdicion.fecha ?? "");
    } else {
      setNombre("");
      setLugar("");
      setFecha("");
    }
  }, [carreraEnEdicion]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedCategoria || !nombre || !lugar || !fecha) {
      setError(`Por favor, complete todos los campos`);
      return;
    }

    console.log(pilotosSeleccionados);

    if (pilotosSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un piloto.");
      return;
    }

  if (carreraEnEdicion) {
      console.log("Guardar cambios en carrera:", carreraEnEdicion.id_carrera, {
        nombre,
        lugar,
        fecha,
      });
    } else {
      console.log("Crear nueva carrera:", { nombre, lugar, fecha, categoria: selectedCategoria });
    }

    setCarreraEnEdicion(null);
    setNombre("");
    setLugar("");
    setFecha("");
  };

  return(
    <div className="bg-gray-100 p-6 rounded-lg shadow-md w-full max-w-xl">
      <h2 className="text-xl font-semibold mb-4">{carreraEnEdicion ? "Editar carrera" : "Formulario de Carrera"}</h2>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <CategoriasDropdown
          listaCategorias={listaCategorias}
          selectedCategoria={selectedCategoria}
          setSelectedCategoria={setSelectedCategoria}
        />
        <input name = "nombre" type="text" placeholder="Nombre de la carrera" 
          className="border p-2 rounded" value={nombre ?? ""} onChange={(e) => setNombre(e.target.value)}/>
        <input name = "lugar" type="text" placeholder="Lugar de la carrera" 
          className="border p-2 rounded" value={lugar ?? ""} onChange={(e) => setLugar(e.target.value)}/>
        <input name = "fecha" type="date" 
          className="border p-2 rounded" value={fecha ?? ""} onChange={(e) => setFecha(e.target.value)}/>

        {error && <p className="text-red-600 font-semibold">{error}</p>}

        <button type="submit" 
          className={`${
            carreraEnEdicion
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-green-600 hover:bg-green-700"
          } text-white font-semibold py-2 rounded`}>
            {carreraEnEdicion ? "Guardar cambios" : "Crear carrera"}
        </button>
      </form>
    </div>

  );
}

function MostrarListaCarreras({
  selectedCategoria,
  listaCarreras,
  onEditar,
  onEliminar,
}: {
  selectedCategoria: Categoria | null;
  listaCarreras: Carrera[];
  onEditar: (car: Carrera) => void;
  onEliminar?: (carrera: Carrera) => void;
}) {
   return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md w-1/4">
      <h3 className="text-lg font-semibold mb-3">Carreras {selectedCategoria?.nombre}</h3>
      {listaCarreras.length === 0 ? (
        <p className="text-gray-600">No hay carreras disponibles.</p>
      ) : (
        listaCarreras.map((car) => (
          <div
            key={car.id_carrera}
            className="bg-white flex items-center justify-between border p-2 rounded mb-4"
          >
            <span>{car.nombre}</span>
            <div className="flex gap-2">
              <button
                className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                onClick={() => onEditar(car)}
              >
                Editar
              </button>
              <button
                onClick={() => onEliminar && onEliminar(car)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TipoEventoDropdown({
  listaEventos,
  selectedEvento,
  setSelectedEvento,
}: {
  listaEventos: string[];
  selectedEvento: string | null;
  setSelectedEvento: (ev:string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedEvento ? selectedEvento : "Tipo de Evento"}
        </Button>
      </DropdownMenuTrigger>
     <DropdownMenuContent className="w-full">
        {listaEventos.map((ev) => (
          <DropdownMenuItem
            key={ev}
            onClick={() => setSelectedEvento(ev)}
            className="cursor-pointer"
          >
            {ev}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EscuderiasDropdown({
  escuderias,
  selectedEscuderia,
  setSelectedEscuderia,
}: {
  escuderias: Escuderia[];
  selectedEscuderia: Escuderia | null;
  setSelectedEscuderia: (esc:Escuderia) => void;
}){
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedEscuderia ? selectedEscuderia.nombre : "Escudería"}
        </Button>
      </DropdownMenuTrigger>
     <DropdownMenuContent className="w-full">
        {escuderias.map((esc) => (
          <DropdownMenuItem
            key={esc.id_escuderia}
            onClick={() => setSelectedEscuderia(esc)}
            className="cursor-pointer"
          >
            {esc.nombre}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MostrarFormularioEvento({
  listaCategorias,
  selectedCategoria,
  setSelectedCategoria,
  listaEventos,
  selectedEvento,
  setSelectedEvento,
  escuderias,
  selectedEscuderia,
  setSelectedEscuderia,
}: {
  listaCategorias: Categoria[];
  selectedCategoria: Categoria | null;
  setSelectedCategoria: (cat: Categoria) => void;
  listaEventos: string[];
  selectedEvento: string | null;
  setSelectedEvento: (ev:string) => void;
  escuderias: Escuderia[];
  selectedEscuderia: Escuderia | null;
  setSelectedEscuderia: (esc:Escuderia) => void;
}) {
  return(
    <div className="bg-gray-100 p-6 rounded-lg shadow-md w-full max-w-xl">
      <h2 className="text-xl font-semibold mb-4">Formulario de Evento Deportivo</h2>
      <form className="flex flex-col gap-3">
        <CategoriasDropdown
          listaCategorias={listaCategorias}
          selectedCategoria={selectedCategoria}
          setSelectedCategoria={setSelectedCategoria}
        />
        <TipoEventoDropdown
          listaEventos={listaEventos}
          selectedEvento={selectedEvento}
          setSelectedEvento={setSelectedEvento}
        />
        <EscuderiasDropdown
          escuderias={escuderias}
          selectedEscuderia={selectedEscuderia}
          setSelectedEscuderia={setSelectedEscuderia}
        />
        <input type="text" placeholder="Nombre del evento" className="border p-2 rounded" />
        <input type="date" className="border p-2 rounded" />
        <button className="bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700">Crear evento</button>
      </form>
    </div>
  );
}
