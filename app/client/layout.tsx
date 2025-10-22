// app/client/layout.tsx
import MainHeader, {NavItem} from '@/components/main-header-user-view';

const clientNavItems: NavItem[] = [
  { name: 'PILOTOS', href: '/client/pilotos' },
  { name: 'ESCUDERÍAS', href: '/client/escuderias' },
  { name: 'CALENDARIO', href: '/client/calendario' },
  //{ name: 'CARRERAS', href: '/carreras' },
  //{ name: 'CATEGORÍAS', href: '/categorias' },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <MainHeader navItems={clientNavItems} />
        <main>
          {children}
        </main>
    </div>
  );
}