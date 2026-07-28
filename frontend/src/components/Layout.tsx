import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  Settings, 
  User, 
  Shield, 
  LogOut, 
  Sun, 
  Moon, 
  BarChart3, 
  Mic, 
  Grid, 
  Compass, 
  CircleDot,
  Accessibility
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = React.useState<string>(() => {
    return localStorage.getItem('insight_theme') || 'dark';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(theme);
    localStorage.setItem('insight_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'high-contrast';
      return 'dark';
    });
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Grid },
    { name: 'Calibration', path: '/calibration', icon: Compass },
    { name: 'Voice Commands', path: '/voice-commands', icon: Mic },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: Shield });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] transition-all duration-300">
      {/* Sidebar */}
      <aside className="w-64 glass-card m-4 mr-0 rounded-2xl flex flex-col justify-between overflow-hidden z-20">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-[var(--card-border)]">
            <div className="bg-gradient-to-tr from-blue-600 to-sky-400 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
              <Eye className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-accent to-brand-glow bg-clip-text text-transparent">
                InSight
              </h1>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium tracking-wide uppercase">
                AI Vision HCI
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-accent/20 to-brand-glow/10 text-brand-glow border-l-4 border-brand-accent'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--card-border)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-glow' : 'text-[var(--text-secondary)]'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-[var(--card-border)] space-y-3">
          {/* Theme toggler */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-border)] transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' && <Moon className="w-4 h-4 text-sky-400" />}
              {theme === 'light' && <Sun className="w-4 h-4 text-yellow-500" />}
              {theme === 'high-contrast' && <Accessibility className="w-4 h-4 text-yellow-300" />}
              Theme: {theme.toUpperCase()}
            </span>
            <CircleDot className="w-3.5 h-3.5" />
          </button>

          {/* User profile brief & Logout */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--card-border)] bg-opacity-30">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate text-[var(--text-primary)]">{user?.username}</span>
              <span className="text-[10px] text-[var(--text-secondary)] capitalize">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 overflow-x-hidden">
        {/* Header */}
        <header className="h-16 glass-card rounded-2xl mb-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-[var(--text-primary)]">
              {navItems.find(item => item.path === location.pathname)?.name || 'InSight'}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              API Online
            </span>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
