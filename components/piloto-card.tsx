// components/PilotoCard.tsx
import Image from 'next/image';
import { Piloto } from '../app/client/pilotos/page';

type PilotoCardProps = {
  piloto: Piloto;
  escuderiaContexto?: string;
  colorFondo?: string
};

export default function PilotoCard({ piloto, escuderiaContexto , colorFondo}: PilotoCardProps) {
  const escuderiasMostrar = escuderiaContexto
  ? [escuderiaContexto]
  : (piloto.escuderias && piloto.escuderias.length > 0 ? piloto.escuderias : ["Sin escudería"]);
 
 
  const rol = piloto.titular === true ? "Titular" : (piloto.titular === false ? "Suplente" : "No asignado");
  const fotoUrl = piloto.foto || '/icon.png'; 
  const edad = piloto.edad || 'N/A'; 
  const pais = piloto.pais || 'N/A';
  const proximaCarrera =  piloto.proximaCarrera || "Sin próxima carrera";
  const bgColor = colorFondo? '#' + colorFondo : "#ec0000";
  const textColor = escuderiaContexto? '#000000ff' : '#ffffffff';
  const categoria = piloto.categoria || "Sin categoría";

  return (
    <div 
      className="relative w-full overflow-hidden rounded-lg shadow-lg flex items-stretch"
      style={{
        background: `linear-gradient(to right, ${bgColor}ff, ${bgColor}e5, ${bgColor}b3, ${bgColor}80)`,
        color: textColor,
      }}
    >
      
        {/* Lado Izquierdo: Información del Piloto */}
        <div className="p-8 space-y-3 flex-grow z-10">
          <p className="text-xl font-semibold">Nombre: {piloto.nombre}</p>
          <p className="text-xl font-semibold">Edad: {edad} años</p> 
          <p className="text-xl font-semibold">País: {pais}</p>
          <p className="text-xl font-semibold">Escudería: {escuderiasMostrar.join(", ")}</p>
          <p className="text-xl font-semibold">Rol : {rol}</p>
          <p className="text-xl font-semibold">Categoría : {categoria}</p>
          <p className="text-xl font-semibold">Próxima Carrera : {proximaCarrera}</p>
        </div>
        
        {/* Lado Derecho: Foto del Piloto */}
        <div className="relative flex-shrink-0 basis-70 h-auto">
          {fotoUrl.startsWith('data:') ? (
            <img
                src={fotoUrl}
                alt={`Foto de ${piloto.nombre}`}
                className="object-cover object-bottom w-full h-full"
            />
            ) : (
            <Image
                src={fotoUrl}
                alt={`Foto de ${piloto.nombre}`}
                width={256}
                height={400}
                className="object-cover object-bottom w-full h-full"
            />
            )}
        </div>
      </div>
  );
}