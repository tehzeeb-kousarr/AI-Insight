import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 text-center space-y-6 relative z-10 shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-brand-accent/15 rounded-2xl flex items-center justify-center text-brand-glow shadow-lg shadow-brand-glow/20">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white">404 - Page Lost</h2>
          <p className="text-xs text-slate-400">
            The screen or routing path you are trying to access does not exist on this console.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="w-full py-3.5 px-4 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-all duration-300 shadow-lg shadow-brand-accent/25 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
export default NotFound;
