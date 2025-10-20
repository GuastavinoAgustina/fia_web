// app/admin/layout.tsx
import { ToastProvider } from "@/components/toast-provider";
import MainHeader, {NavItem} from '../../components/main-header-user-view';

  const adminNavItems: NavItem[] = [
  { name: 'PERFILES', href: '/admin/perfiles' },
  { name: 'PILOTOS', href: '/admin/pilotos' },
  { name: 'PUNTOS', href: '/admin/puntos' },
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
