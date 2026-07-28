import React, { useState, useEffect } from 'react';
import { logsApi } from '../services/api';
import type { ActivityLog } from '../services/api';
import { Shield, Trash2, Calendar, ClipboardList, Info } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const data = await logsApi.list(100);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all system activity logs? This action is irreversible.")) return;
    try {
      await logsApi.clear();
      fetchLogs();
    } catch (err) {
      console.error("Failed to clear logs", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
      
      {/* Logs Table Area */}
      <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-glow animate-pulse" /> System Audit Logs
          </h3>
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs transition-all duration-300"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Audit Logs
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-10">No system events logged in database.</p>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1 space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-900/40 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between text-xs gap-2">
                <div>
                  <span className="font-bold text-slate-200 capitalize">{log.action.replace(/_/g, ' ')}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{log.details || 'No details provided'}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 whitespace-nowrap self-start md:self-center">
                  <Calendar className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Panel Summary cards */}
      <div className="space-y-6">
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <Shield className="w-4.5 h-4.5 text-brand-glow" /> Admin Analytics
          </h4>
          <div className="space-y-3 text-xs text-[var(--text-secondary)]">
            <div className="flex justify-between py-2 border-b border-[var(--card-border)]">
              <span>Total Audit Records:</span>
              <span className="font-bold text-white">{logs.length} logs</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--card-border)]">
              <span>DB File:</span>
              <span className="font-mono text-white text-[10px]">insight.db</span>
            </div>
            <div className="flex justify-between py-2">
              <span>System Integrity:</span>
              <span className="text-emerald-400 font-bold">Secure</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 text-xs text-[var(--text-secondary)] flex gap-3">
          <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            As an Administrator, you can audit all cursor clicks, calibration configurations, and voice triggers run on this desktop node.
          </p>
        </div>
      </div>

    </div>
  );
};
