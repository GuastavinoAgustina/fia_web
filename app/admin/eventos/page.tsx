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
import { useToast } from "@/components/toast-provider"
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
  const { addToast } = useToast()

  useEffect(() => {
    setSelectedCategoria(null);  
    setCarreraEnEdicion(null);
    setPilotosSeleccionados([]);
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

    if (tipoSeleccionado !== "carrera") return;
    if(!selectedCategoria) return;

    const fetchPilotosConEscuderiaDeCategoriaSelecionada = async() =>{
      try{
        const { data: carrerasCat, error: errorCat } = await supabase
          .from("Carrera")
          .select("id_carrera, nombre, lugar, fecha")
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

  async function handleEditarCarrera(carrera: Carrera){
     setCarreraEnEdicion(carrera);

    // Traer pilotos de esta carrera
    const { data: corre, error } = await supabase
      .from("Corre")
      .select("id_piloto")
      .eq("id_carrera", carrera.id_carrera);

    if (error) {
      console.error("Error al traer pilotos de la carrera:", error);
      return;
    }

    const idsPilotos = corre.map(c => c.id_piloto);
    const pilotos = escuderiasConPilotos.flatMap(esc => esc.pilotos)
      .filter(p => idsPilotos.includes(p.id_piloto));

    setPilotosSeleccionados(pilotos);
  }

   async function handleEliminarCarrera(carrera: Carrera){
    if (!confirm(`¿Seguro que querés eliminar la carrera "${carrera.nombre}"? Esto no se puede deshacer.`)) {
      return;
    }
    try {
      // 1. Borrar los registros en Corre relacionados con la carrera
      const { error: errorDeleteCorre } = await supabase
        .from("Corre")
        .delete()
        .eq("id_carrera", carrera.id_carrera);
      if (errorDeleteCorre) throw errorDeleteCorre;

      // 2. Borrar la carrera
      const { error: errorDeleteCarrera } = await supabase
        .from("Carrera")
        .delete()
        .eq("id_carrera", carrera.id_carrera);
      if (errorDeleteCarrera) throw errorDeleteCarrera;

      // 3. Actualizar lista local de carreras para la categoría
      setListaCarreras(prev => prev.filter(c => c.id_carrera !== carrera.id_carrera));

      if (carreraEnEdicion?.id_carrera === carrera.id_carrera) {
        setCarreraEnEdicion(null);
        setPilotosSeleccionados([]);
      }

      console.log("Carrera eliminada con éxito.");
      addToast("Carrera eliminada con éxito.")
    } catch (err) {
      console.error("Error al eliminar la carrera:", err);
      alert("Ocurrió un error al eliminar la carrera.");
    }
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
                  escuderiasConPilotos={escuderiasConPilotos} 
                  pilotosSeleccionados={pilotosSeleccionados}
                  setPilotosSeleccionados={setPilotosSeleccionados}
                  carreraEnEdicion={carreraEnEdicion}
                  setCarreraEnEdicion={setCarreraEnEdicion}
                  setListaCarreras={setListaCarreras}
                />
                <MostrarListaCarreras
                  selectedCategoria={selectedCategoria}
                  listaCarreras={listaCarreras}
                  onEditar={handleEditarCarrera}
                  onEliminar={handleEliminarCarrera}
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
    <div className="bg-gray-100 p-6 rounded-lg shadow-md w-1/4">
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
  escuderiasConPilotos,
  pilotosSeleccionados,
  setPilotosSeleccionados,
  carreraEnEdicion,
  setCarreraEnEdicion,
  setListaCarreras,
}: {
  listaCategorias: Categoria[];
  selectedCategoria: Categoria | null;
  setSelectedCategoria: (cat: Categoria) => void;
  escuderiasConPilotos: any[];
  pilotosSeleccionados: Piloto[];
  setPilotosSeleccionados: (pils: Piloto[]) => void;
  carreraEnEdicion: Carrera | null;
  setCarreraEnEdicion: (c: Carrera | null) => void;
  setListaCarreras: (carreras: Carrera[]) => void;
}) {
    const [error, setError] = useState<string | null>(null);
    const [nombre, setNombre] = useState("");
    const [lugar, setLugar] = useState("");
    const [fecha, setFecha] = useState("");

    useEffect(() => {
      setError(null);
      if (carreraEnEdicion) {
        setNombre(carreraEnEdicion.nombre);
        setLugar(carreraEnEdicion.lugar); 
        setFecha(carreraEnEdicion.fecha);
        
        const pilotosDeCarrera: Piloto[] = [];
        escuderiasConPilotos.forEach(esc => {
          esc.pilotos.forEach((p: Piloto) => {
            if (pilotosSeleccionados.some(ps => ps.id_piloto === p.id_piloto)) {
              pilotosDeCarrera.push(p);
            }
          });
        });
        setPilotosSeleccionados(pilotosDeCarrera);

      } else {
        setNombre("");
        setLugar("");
        setFecha("");
      }
  }, [carreraEnEdicion]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedCategoria || !nombre || !lugar || !fecha) {
      setError(`Por favor, complete todos los campos`);
      return;
    }

    if (pilotosSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un piloto.");
      return;
    }

    try {
      if (carreraEnEdicion) {
        // ---- EDITAR CARRERA ----
        const { error: errorUpdate } = await supabase
          .from("Carrera")
          .update({ nombre, lugar, fecha, id_categoria: selectedCategoria.id_categoria })
          .eq("id_carrera", carreraEnEdicion.id_carrera);

        if (errorUpdate) throw errorUpdate.message;

        // Actualizar pilotos en Corre
        // 1. Borrar los pilotos que ya no están
        const { error: errorDelete } = await supabase
          .from("Corre")
          .delete()
          .eq("id_carrera", carreraEnEdicion.id_carrera)
          .not("id_piloto", "in", `(${pilotosSeleccionados.map(p => p.id_piloto).join(",")})`);
        if (errorDelete) throw errorDelete.message;

        // 2. Insertar pilotos nuevos que no estaban
        const { data: existingCorre } = await supabase
          .from("Corre")
          .select("id_piloto")
          .eq("id_carrera", carreraEnEdicion.id_carrera);

        const existingIds = existingCorre?.map((c: any) => c.id_piloto) ?? [];
        const nuevosPilotos = pilotosSeleccionados.filter(p => !existingIds.includes(p.id_piloto));

        if (nuevosPilotos.length > 0) {
          const inserts = nuevosPilotos.map(p => ({
            id_carrera: carreraEnEdicion.id_carrera,
            id_piloto: p.id_piloto,
            id_escuderia: escuderiasConPilotos.find(esc => esc.pilotos.some((pi: { id_piloto: number; }) => pi.id_piloto === p.id_piloto))?.id_escuderia
          }));
          const { error: errorInsert } = await supabase
            .from("Corre")
            .insert(inserts);
          if (errorInsert) throw errorInsert;
        }

        console.log("Carrera actualizada con éxito.");

      } else {
        // ---- NUEVA CARRERA ----
        const { data: newCarrera, error: errorInsertCarrera } = await supabase
          .from("Carrera")
          .insert({ nombre, lugar, fecha, id_categoria: selectedCategoria.id_categoria })
          .select()
          .single();

        if (errorInsertCarrera) throw errorInsertCarrera.message;

        const inserts = pilotosSeleccionados.map(p => ({
          id_carrera: newCarrera.id_carrera,
          id_piloto: p.id_piloto,
          id_escuderia: escuderiasConPilotos.find(esc => esc.pilotos.some((pi: { id_piloto: number; }) => pi.id_piloto === p.id_piloto))?.id_escuderia
        }));

        const { error: errorInsertCorre } = await supabase
          .from("Corre")
          .insert(inserts);

        if (errorInsertCorre) throw errorInsertCorre.message;

        console.log("Carrera creada con éxito.");
      }

      // Limpiar formulario
      setCarreraEnEdicion(null);
      setNombre("");
      setLugar("");
      setFecha("");
      setPilotosSeleccionados([]);

      // Recargar la lista de carreras
      if(selectedCategoria) {
        const { data: carrerasCat, error: errorCat } = await supabase
          .from("Carrera")
          .select("*")
          .eq("id_categoria", selectedCategoria.id_categoria);
        if (!errorCat) setListaCarreras(carrerasCat as Carrera[]);
      }

    } catch (err) {
      console.error("Error al guardar la carrera:", err);
      setError("Ocurrió un error al guardar la carrera.");
    }
    };

    const handleCancelarEdicion = () => {
      // Limpiar los campos del formulario y los pilotos seleccionados
      setCarreraEnEdicion(null);
      setNombre("");
      setLugar("");
      setFecha("");
      setPilotosSeleccionados([]);
    };

  return(
    <div className="bg-gray-100 p-6 rounded-lg shadow-md w-2/4 max-w-xl">
      <h2 className="text-xl font-semibold mb-4">{carreraEnEdicion ? "Editar carrera" : "Formulario de Carrera"}</h2>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <CategoriasDropdown
          listaCategorias={listaCategorias}
          selectedCategoria={selectedCategoria}
          setSelectedCategoria={setSelectedCategoria}
        />
        <input name = "nombre" type="text" placeholder="Nombre de la carrera" 
          className="border p-2 rounded" value={nombre} onChange={(e) => setNombre(e.target.value)}/>
        <input name = "lugar" type="text" placeholder="Lugar de la carrera" 
          className="border p-2 rounded" value={lugar} onChange={(e) => setLugar(e.target.value)}/>
        <input name = "fecha" type="date" 
          className="border p-2 rounded" value={fecha} onChange={(e) => setFecha(e.target.value)}/>

        {error && <p className="text-red-600 font-semibold">{error}</p>}

        <div className="flex justify-center gap-2">
          <button
            type="submit"
            className={`${
              carreraEnEdicion
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white font-semibold py-2 px-4 rounded w-full`}
          >
            {carreraEnEdicion ? "Guardar cambios" : "Crear carrera"}
          </button>

          {carreraEnEdicion && (
            <button
              type="button"
              onClick={handleCancelarEdicion}
              className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded w-full"
            >
              Cancelar
            </button>
          )}
        </div>
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
  onEliminar: (carrera: Carrera) => void;
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
                onClick={() => onEliminar(car)}
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
