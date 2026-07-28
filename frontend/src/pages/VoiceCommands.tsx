import React, { useState, useEffect } from 'react';
import { voiceApi } from '../services/api';
import type { VoiceCommand } from '../services/api';
import { Mic, Trash2, Plus, Info, AlertCircle, HelpCircle } from 'lucide-react';

export const VoiceCommands: React.FC = () => {
  const [customCommands, setCustomCommands] = useState<VoiceCommand[]>([]);
  const [predefinedCommands, setPredefinedCommands] = useState<Record<string, string>>({});
  
  // Form State
  const [phrase, setPhrase] = useState('');
  const [actionType, setActionType] = useState<'system' | 'shortcut'>('system');
  const [actionValue, setActionValue] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCommands = async () => {
    try {
      const customs = await voiceApi.list();
      setCustomCommands(customs);

      const predefs = await voiceApi.listPredefined();
      setPredefinedCommands(predefs);
    } catch (err) {
      console.error("Failed to load voice commands", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommands();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phrase.trim() || !actionValue.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const actionString = `${actionType}:${actionValue.trim()}`;

    try {
      await voiceApi.create({
        phrase: phrase.trim(),
        action: actionString
      });
      setPhrase('');
      setActionValue('');
      fetchCommands();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create command. The phrase might be taken.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this voice macro?")) return;
    try {
      await voiceApi.delete(id);
      fetchCommands();
    } catch (err) {
      console.error("Failed to delete voice command", err);
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
      
      {/* Predefined System Commands catalog */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Custom Commands Creator Form */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <Plus className="w-5 h-5 text-brand-glow" /> Add Custom Voice Macro
          </h3>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Trigger Phrase</label>
              <input
                type="text"
                required
                className="w-full glass-input text-xs py-2.5"
                placeholder="e.g., launch browser"
                value={phrase}
                onChange={e => setPhrase(e.target.value)}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Macro Type</label>
              <select
                className="w-full glass-input text-xs py-2.5 cursor-pointer"
                value={actionType}
                onChange={e => setActionType(e.target.value as any)}
              >
                <option value="system">Launch System App (cmd)</option>
                <option value="shortcut">Simulate Keys (e.g. ctrl+alt+t)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Action Value</label>
              <input
                type="text"
                required
                className="w-full glass-input text-xs py-2.5"
                placeholder={actionType === 'system' ? 'e.g., start chrome' : 'e.g., ctrl+shift+esc'}
                value={actionValue}
                onChange={e => setActionValue(e.target.value)}
              />
            </div>

            <div className="md:col-span-3 pt-2">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-brand-accent/25 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Macro
              </button>
            </div>
          </form>
        </div>

        {/* Custom Commands Table */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <Mic className="w-5 h-5 text-brand-glow animate-pulse" /> Custom Commands
          </h3>
          
          {customCommands.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No custom voice macros configured yet.</p>
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {customCommands.map((cmd) => (
                <div key={cmd.id} className="flex justify-between items-center py-3 text-xs">
                  <div>
                    <span className="font-bold text-white block">"{cmd.phrase}"</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{cmd.action}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cmd.id)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Predefined Dictionary Sidebar */}
      <div className="space-y-6">
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <HelpCircle className="w-4.5 h-4.5 text-brand-glow" /> System Dictionary
          </h4>
          <p className="text-[10px] text-slate-400">
            These keywords are supported natively out-of-the-box by the Speech Engine.
          </p>

          <div className="h-96 overflow-y-auto pr-1 space-y-2">
            {Object.entries(predefinedCommands).map(([key, val]) => (
              <div key={key} className="p-3 bg-slate-900/40 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">"{key}"</span>
                <span className="text-[10px] text-slate-500 font-mono capitalize">{val.split(':', 1)[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-blue-500/10 bg-blue-500/5 text-xs text-[var(--text-secondary)] flex gap-3">
          <Info className="w-5 h-5 text-brand-glow shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Ensure your microphone is selected properly under settings and you speak in a clear tone. Custom phrases are fuzzy matched.
          </p>
        </div>
      </div>

    </div>
  );
};
