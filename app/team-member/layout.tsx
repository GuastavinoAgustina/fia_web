// app/team-member/layout.tsx
import MainHeader, {NavItem} from '@/components/main-header-user-view';

const teamMemberNavItems: NavItem[] = [
  { name: 'CALENDARIO', href: '/team-member/calendario' },
  { name: 'PUNTAJES', href: '/team-member/puntos' },
  { name: 'CAMPEONATO' , href: '/team-member/campeonato'},
  { name: 'SANCIONES', href: '/team-member/sanciones' },
];

export default function TeamMemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <MainHeader navItems={teamMemberNavItems} />
        <main className="bg-white">
          {children}
        </main>
    </div>
  );
}