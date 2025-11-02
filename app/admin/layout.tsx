// app/admin/layout.tsx
import { ToastProvider } from "@/components/toast-provider";
import MainHeader, {NavItem} from '../../components/main-header-user-view';

  const adminNavItems: NavItem[] = [
  { name: 'ESCUDERIAS', href: '/admin/escuderias' },
  { name: 'PILOTOS', href: '/admin/pilotos' },
  { name: 'PUNTOS', href: '/admin/puntos' },
  { name: 'EVENTOS', href: '/admin/eventos' },
  { name: 'SANCIONES', href: '/admin/sanciones' },
];

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
      <div>
        <MainHeader navItems={adminNavItems} />
          <main>
            <ToastProvider>{children}</ToastProvider>
          </main>
      </div>
  );
}
