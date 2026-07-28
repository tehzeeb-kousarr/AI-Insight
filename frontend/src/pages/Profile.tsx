import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, Shield, Calendar } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      
      <div className="glass-card p-6 rounded-3xl space-y-6">
        <div className="flex items-center gap-4 border-b border-[var(--card-border)] pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-1 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white">{user?.username}</h3>
            <p className="text-xs text-[var(--text-secondary)] capitalize">{user?.role} Profile</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Email Row */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-sky-400" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Email Address</span>
                <span className="text-white font-semibold">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Role Row */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-purple-400" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Account Role Privileges</span>
                <span className="text-white font-semibold capitalize">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Member Since Row */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Account Created</span>
                <span className="text-white font-semibold">
                  {user ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
