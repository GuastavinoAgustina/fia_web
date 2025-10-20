"use client";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { FlagIcon, FlagIconCode } from "react-flag-kit"
import { getCountryCode } from '@/lib/country';
import { createClient } from "@supabase/supabase-js";
import GranPrixDropdown from "@/components/gp-dropdown-list";
import EscuderiaCar from "@/components/escuderia-card";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!)

type Piloto = {
    id_piloto: number;
    id_escuderia: number;
    nombre: string;
    pais: string;
    puntos: number;
    nombre_escuderia: string | null;
    color_escuderia: string | null;
    logo_escuderia: string | null;
}


export default function Campeonato() {
    const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
    const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]);
    const [listaCarreras, setListaCarreras] = useState<Carrera[]>([]);
    const [listaPilotos, setListaPilotos] = useState<Piloto[]>([]);
    const [teamMap, setTeamMap] = useState<Map<number, Escuderia>>(new Map());
    const [pilotMap, setPilotMap] = useState<Map<number, Piloto>>(new Map());

    type Piloto = {
        id_piloto: number;
        id_escuderia: number;
        nombre: string;
        pais: string;
        puntos: number;
        nombre_escuderia: string | null;
        color_escuderia: string | null;
        logo_escuderia: string | null;
    }

    type Categoria = {
        id_categoria: number;
        nombre: string
    }

    type Carrera = {
        id_carrera: number;
        nombre: string;
    }

    useEffect(() => {
        async function fetchCategorias() {
            const { data: categorias, error } = await supabase
                .from("Categoria")
                .select('nombre, id_categoria');
            if (error)
                console.error(error);
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
        const categoriaSeleccionada = listaCategorias.find((categoria) => categoria.nombre === item)
        if (categoriaSeleccionada)
            setSelectedCategoria(categoriaSeleccionada);
        const { data, error } = await supabase
            .from('Carrera')
            .select('id_carrera, nombre')
            .eq('id_categoria', categoriaSeleccionada?.id_categoria)
        if (error)
            console.error(error)
        if (data) {
            setListaCarreras(data.map((it: any) => (
                {
                    id_carrera: it.id_carrera,
                    nombre: it.nombre,
                }
            )));
        }

        const carreraIds = (data || []).map((c: any) => c.id_carrera);

        if (carreraIds.length === 0) {
            setListaPilotos([]);
            setPilotMap(new Map());
            setTeamMap(new Map());
            return;
        }

        const { data: pilotos, error: errorPilotos } = await supabase
            .from('Corre')
            .select(`
              id_piloto,
              id_escuderia,
              puntaje,
              Piloto (
                nombre,
                pais
              ),
              Escuderia (
                nombre,
                logo,
                color
              )
            `)
            .in('id_carrera', carreraIds);

        if (errorPilotos) console.error(errorPilotos);
        if (pilotos) {
            const listaP = pilotos.map((it: any) => ({
                id_piloto: it.id_piloto,
                id_escuderia: it.id_escuderia,
                nombre: it.Piloto?.nombre,
                pais: it.Piloto?.pais,
                puntos: it.puntaje,
                nombre_escuderia: it.Escuderia?.nombre,
                color_escuderia: it.Escuderia?.color,
                logo_escuderia: it.Escuderia?.logo,
            })).sort((a, b) => b.puntos - a.puntos);
            setListaPilotos(listaP);
            setPilotMap(accumulatePilotPoints(listaP));
            setTeamMap(accumulateEscuderiaPoints(listaP));
        };
    }

    type Escuderia = {
        id_escuderia: number;
        nombre: string;
        color: string;
        logo: string;
        puntos: number;
    }

    type EscuderiaCardProps = {
        escuderia: Escuderia;
    };

    function EscuderiaCard({ escuderia }:
        EscuderiaCardProps) {

        const nombre = escuderia.nombre || "Sin nombre";
        const bgColor = escuderia.color ? '#' + escuderia.color : '#ec0000ff';
        let logoURL = "/icon.png"; // fallback por defecto

        if (typeof escuderia.logo === "string" && escuderia.logo.trim() !== "") {
            try {
                // Si la URL es válida, la usamos
                new URL(escuderia.logo);
                logoURL = escuderia.logo;
            } catch { }
        }

        return (
            <div
                className="relative w-full overflow-hidden rounded-lg shadow-lg flex items-center justify-between"
                style={{
                    background: `linear-gradient(to right, ${bgColor}ff, ${bgColor}e5, ${bgColor}b3, ${bgColor}80)`,
                    color: "#000000",
                }}
            >


                {/* Nombre a la izquierda */}
                <div className="flex items-center space-x-3 pl-4 flex-1">
                    {logoURL && (
                        <div className="relative h-8 w-8">
                            <Image
                                src={logoURL}
                                alt={`Logo de ${nombre}`}
                                fill
                                className="object-contain max-h-10 max-w-10"
                            />
                        </div>
                    )}
                    <span className="mt-1 mb-1 f1-regular text-xl font-semibold">{nombre}</span>
                </div>
                <div className="flex items-center pr-4">
                    <p className="font-bold px-2 py-1 rounded mt-1 mb-1 w-16 text-center">
                        {escuderia.puntos}
                    </p>
                </div>
            </div>

        );
    }

    function accumulateEscuderiaPoints(pilotos: Piloto[]): Map<number, Escuderia> {
        const m = new Map<number, Escuderia>();
        for (const p of pilotos) {
            const escuderia = {
                id_escuderia: p.id_escuderia,
                nombre: p.nombre_escuderia || "Sin nombre",
                color: p.color_escuderia || "ec0000",
                logo: p.logo_escuderia || "/icon.png"
            };
            const puntos = Number(p.puntos ?? 0);
            if (m.has(escuderia.id_escuderia)) {
                m.get(escuderia.id_escuderia)!.puntos += puntos;
            } else {
                m.set(escuderia.id_escuderia, { ...escuderia, puntos });
            }
        }
        return m;
    }

    function addEscuderiaPoints(m: Map<number, number>, escuderiaId: number, puntosToAdd: number) {
        m.set(escuderiaId, (m.get(escuderiaId) ?? 0) + Number(puntosToAdd ?? 0));
    }

    function accumulatePilotPoints(listaP: { id_piloto: any; id_escuderia: any; nombre: any; pais: any; puntos: any; nombre_escuderia: any; color_escuderia: any; logo_escuderia: any; }[]): import("react").SetStateAction<Map<number, { id_piloto: number; id_escuderia: number; nombre: string; pais: string; puntos: number; nombre_escuderia: string | null; color_escuderia: string | null; logo_escuderia: string | null; }>> {
        const m = new Map<number, Piloto>();
        for (const piloto of listaP) {
            const puntos = Number(piloto.puntos ?? 0);
            if (m.has(piloto.id_piloto)) {
                m.get(piloto.id_piloto)!.puntos += puntos;
            } else {
                m.set(piloto.id_piloto, { ...piloto, puntos });
            }
        }
        return m;
    }



    return (
        <main className="bg-white">
            <div className="flex flex-col items-center justify-center bg-white">
                <h1 className="mb-1 mt-3"> Seleccione una categoría</h1>
                <GranPrixDropdown
                    label="Seleccione una categoría"
                    listaGP={listaCategorias.map(it => it.nombre)}
                    setSelected={handleSelectCategoria}
                />
            </div>
    
            {
                selectedCategoria && (
                    <div className="p-10 min-h-screen flex flex-col items-center">
                        <div className="w-full max-w-4xl p-6 rounded-2xl space-y-3">
                            <p className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-3">
                                 <span className="inline-block w-1.5 h-6 rounded bg-gradient-to-b from-red-500 to-red-500" />
                                 Campeonato de pilotos
                             </p>
                            {Array.from(pilotMap.values()).sort((a, b) => b.puntos - a.puntos).map(piloto => (
                                <PilotoCard key={piloto.id_piloto} piloto={piloto} colorFondo={piloto.color_escuderia!} />
                            ))}
                        </div>
                        <div className="w-full max-w-4xl p-6 rounded-2xl space-y-3">
                            <p className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-3">
                                 <span className="inline-block w-1.5 h-6 rounded bg-gradient-to-b from-red-500 to-red-500" />
                                 Campeonato de constructores
                             </p>
                            {Array.from(teamMap.values()).sort((a, b) => b.puntos - a.puntos).map((escuderia) => (
                                <EscuderiaCard key={escuderia.id_escuderia} escuderia={escuderia} />
                            ))}
                        </div>
                    </div>
                )}
        </main>
    )
}






type PilotoCardProps = {
    piloto: Piloto;
    colorFondo?: string
};

function PilotoCard({ piloto, colorFondo }: PilotoCardProps) {


    const pais = piloto.pais || 'N/A';
    const codigoPais = getCountryCode(pais) || "";
    const bgColor = colorFondo ? '#' + colorFondo : "#ec0000";

    return (
        <div
            className="relative w-full overflow-hidden rounded-lg shadow-lg flex items-center justify-between"
            style={{
                background: `linear-gradient(to right, ${bgColor}ff, ${bgColor}e5, ${bgColor}b3, ${bgColor}80)`,
                color: "#000000",
            }}
        >

            {/* Lado Izquierdo: Información del Piloto */}
            <div className="flex items-center space-x-3 pl-4 flex-1">
                <FlagIcon code={codigoPais as FlagIconCode} size={32} className="rounded border" />
                <p className="mt-1 mb-1 f1-regular text-xl font-semibold">{piloto.nombre}</p>
            </div>
            <div className="flex items-center space-x-3 pl-4 flex-1">
                {piloto.logo_escuderia && (
                    <div className="relative h-8 w-8">
                        <Image
                            src={piloto.logo_escuderia}
                            alt={`Logo de ${piloto.nombre_escuderia}`}
                            fill
                            className="object-contain max-h-10 max-w-10"
                        />
                    </div>)}
            </div>
            <div className="flex items-center pr-4">
                <p className="font-bold px-2 py-1 rounded mt-1 mb-1 w-16 text-center">
                    {piloto.puntos}
                </p>
            </div>

        </div>
    );
}

