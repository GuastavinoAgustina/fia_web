// app/team-member/layout.tsx
import MainHeader, {NavItem} from '@/components/main-header-user-view';

const teamMemberNavItems: NavItem[] = [
  { name: 'CALENDARIO', href: '/team-member/calendario' },
  { name: 'PUNTAJE', href: '/team-member/puntaje' },
  { name: 'SANCIONES', href: '/team-member/sanciones' },
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