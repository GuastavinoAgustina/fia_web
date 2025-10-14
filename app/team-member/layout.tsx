// app/team-member/layout.tsx
import MainHeader, {NavItem} from '@/components/main-header-user-view';

const teamMemberNavItems: NavItem[] = [
  { name: 'CALENDARIO', href: '/client/pilotos' },
  { name: 'PUNTAJE', href: '/client/escuderias' },
  { name: 'SANCIONES', href: '/carreras' },
];

export default function TeamMemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <MainHeader navItems={teamMemberNavItems} />
        <main className="bg-black">
          {children}
        </main>
    </div>
  );
}