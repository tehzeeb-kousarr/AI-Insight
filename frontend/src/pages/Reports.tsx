import React, { useState, useEffect } from 'react';
import { reportsApi } from '../services/api';
import type { ReportStats } from '../services/api';
import api from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  FileText, 
  Table, 
  Clock, 
  Mic, 
  MousePointerClick, 
  CheckCircle2 
} from 'lucide-react';

const COLORS = ['#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fb7185'];

export const Reports: React.FC = () => {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await reportsApi.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load reports statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const response = await api.get('/reports/export/pdf', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `InSight_Report_${new Date().toISOString().slice(0,10)}.pdf`;
      link.click();
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const response = await api.get('/reports/export/excel', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `InSight_Report_${new Date().toISOString().slice(0,10)}.xlsx`;
      link.click();
    } catch (err) {
      console.error("Failed to export Excel", err);
    } finally {
      setExportingExcel(false);
    }
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600.0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Export Header Control Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-[var(--card-border)]">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-glow" /> Analytics & Reports
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">Export system utilization and command execution metrics.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-5 py-3 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-brand-accent/20 transition-all duration-300 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" /> {exportingPdf ? 'Generating PDF...' : 'Export PDF'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="flex items-center gap-2 px-5 py-3 border border-white/10 hover:bg-white/5 text-white rounded-xl font-semibold text-xs transition-all duration-300 disabled:opacity-50"
          >
            <Table className="w-4 h-4" /> {exportingExcel ? 'Generating Sheet...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today Active Time */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-brand-glow">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Today's Duration</p>
            <h5 className="text-base font-extrabold text-white">
              {formatHours(stats?.today_usage_seconds ?? 0)} <span className="text-[10px] text-slate-500 font-medium">hrs</span>
            </h5>
          </div>
        </div>

        {/* Voice Trigger counts */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Speech Commands</p>
            <h5 className="text-base font-extrabold text-white">
              {stats?.voice_commands_today ?? 0}
            </h5>
          </div>
        </div>

        {/* Blink Clicks counts */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Blink Clicks</p>
            <h5 className="text-base font-extrabold text-white">
              {stats?.clicks_today ?? 0}
            </h5>
          </div>
        </div>

        {/* Accuracy Estimation */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Gaze Accuracy</p>
            <h5 className="text-base font-extrabold text-white">
              {stats?.estimated_accuracy ?? 0.0}%
            </h5>
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Bar Chart */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h4 className="font-bold text-sm text-white">Weekly Usage Time</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weekly_chart_data}>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="hours" name="Active Time (Hrs)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voice Command distribution */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h4 className="font-bold text-sm text-white">Top Voice Commands</h4>
          <div className="h-64 flex flex-col md:flex-row items-center justify-between">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.voice_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats?.voice_distribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="w-full md:w-1/2 space-y-2 mt-4 md:mt-0 text-xs">
              {stats?.voice_distribution.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-400 capitalize">"{item.name}":</span>
                  <span className="font-bold text-white">{item.value} runs</span>
                </div>
              ))}
              {stats?.voice_distribution.length === 0 && (
                <p className="text-slate-500 italic text-center">No commands triggered yet</p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
