import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { LayoutDashboard, Users, BookOpen, GraduationCap, ClipboardList, BarChart3, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { to: '/', label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/streams',  label: 'Streams',  icon: GraduationCap },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/scores',   label: 'Scores',   icon: ClipboardList },
  { to: '/results',  label: 'Results',  icon: BarChart3 },
  { to: '/reports',  label: 'Reports',  icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const handleLogout = () => { logout(); nav('/login'); };

  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-brand-800 to-brand-900 text-white flex flex-col transition-transform ${open ? '' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 grid place-items-center font-bold">IA</div>
          <div>
            <div className="font-bold text-base leading-tight">Ikonex Academy</div>
            <div className="text-xs text-brand-100/80">Student Management System</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive ? 'bg-white text-brand-800 font-semibold shadow' : 'hover:bg-white/10'}`}>
              <l.icon size={18} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 text-xs text-brand-100/80 truncate">{user?.email}</div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden bg-white border-b border-brand-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="p-2 -ml-2"><Menu size={22}/></button>
          <div className="font-bold text-brand-800">Ikonex Academy</div>
          <div className="w-8" />
        </header>
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
