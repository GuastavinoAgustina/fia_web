import MainHeader from '../../components/main-header-user-view'; // Importa el nuevo componente

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    // Ya no necesitas <html> o <body> aquí
    <>
      {/* 1. El Header y la Navbar se cargan PRIMERO
        Se mostrará arriba de CUALQUIER página dentro de 'app/client'
      */}
      <MainHeader />
      
      {/* 2. El 'children' es la página actual (Home, Pilotos, Escuderías)
        El contenido de la página se renderiza debajo del Header.
      */}
       <main className="bg-black">
        {children}
      </main>
    </>
  );
}