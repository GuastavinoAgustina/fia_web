"use client";

import Image from 'next/image';
import Link from "next/link";
import { usePathname } from "next/navigation";
import "@/app/globals.css"

export type NavItem = {
  name: string;
  href: string;
};

type MainHeaderProps = {
  navItems: NavItem[];
};

export default function MainHeader({navItems}:MainHeaderProps) {
  const pathname = usePathname();
  const colorSeleccion= "#ec0000ff";
  return (
    <div className="bg-white">
      <header className="flex justify-center p-3 bg-white">
        <Image
          src="/client/icon.png"
          alt="Logotipo de Formula 1"
          width={320}
          height={80}
          priority
        />
      </header>

      <nav className="bg-black text-white">
        <div>  
          <div className="grid grid-flow-col auto-cols-fr h-12"> 
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

                return (
                  <div
                    key={item.name}
                    className={`relative flex items-center justify-center border-r-2 border-gray-500 last:border-r-0 transition-colors duration-200 ${
                      isActive
                        ? "bg-red-600"
                        : "bg-black text-white hover:text-red-600"
                    }`}
                    style={isActive ? { backgroundColor: colorSeleccion}: {}}
                    >
                    <Link
                      href={item.href}
                       className="f1-regular text-lg font-bold tracking-widest uppercase"
                    >
                      {item.name}
                    </Link>
                  </div>
                );
              })}
          </div>
        </div>
      </nav>
    </div>
  );
}