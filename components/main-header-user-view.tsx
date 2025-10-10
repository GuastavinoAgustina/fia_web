import Image from 'next/image';
import Link from "next/link";

const navItems = [
  { name: 'PILOTOS', href: '/client/pilotos' },
  { name: 'ESCUDERÍAS', href: '/client/escuderias' },
  { name: 'CARRERAS', href: '/carreras' },
  { name: 'CATEGORÍAS', href: '/categorias' },
];

export default function HomePage() {
  return (
    // 1. Contenedor principal para centrar el contenido (si es necesario)
    <div className="bg-white">
      
      {/* 2. Sección del Logo de F1 */}
      <header className="flex justify-center p-3 bg-white">
        <Image
          src="/client/icon.png"
          alt="Logotipo de Formula 1"
          width={320}
          height={80}
          priority
        />
      </header>

      {/* 3. Barra de Navegación Negra (Navbar) */}
      <nav className="bg-black text-white">
        <div>  
          <div className="grid grid-flow-col auto-cols-fr h-12"> 
            {navItems.map((item, index) => (
              <div
                key={item.name}
                className="relative flex items-center justify-center border-r-2 border-gray-500 last:border-r-0" // Borde como separador
              >
                <Link
                  href={item.href}
                  className="text-lg font-bold tracking-widest uppercase hover:text-red-600 transition-colors"
                >
                  {item.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}