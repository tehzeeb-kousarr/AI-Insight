import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import type { Setting } from '../services/api';
import { Settings as SettingsIcon, Sliders, Monitor, AlertCircle, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const [_settings, setSettings] = useState<Setting | null>(null);
  
  // Inputs state
  const [eyeSens, setEyeSens] = useState(1.0);
  const [headSens, setHeadSens] = useState(1.0);
  const [blinkSens, setBlinkSens] = useState(0.20);
  const [dwellTime, setDwellTime] = useState(2.0);
  const [cursorSpeed, setCursorSpeed] = useState(10.0);
  const [smoothness, setSmoothness] = useState(0.5);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [theme, setTheme] = useState('dark');
  const [cameraDevice, setCameraDevice] = useState(0);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
      
      setEyeSens(data.eye_sensitivity);
      setHeadSens(data.head_sensitivity);
      setBlinkSens(data.blink_sensitivity);
      setDwellTime(data.dwell_time);
      setCursorSpeed(data.cursor_speed);
      setSmoothness(data.smoothness);
      setVoiceLanguage(data.voice_language);
      setTheme(data.theme);
      setCameraDevice(data.camera_device);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    try {
      const res = await settingsApi.update({
        eye_sensitivity: eyeSens,
        head_sensitivity: headSens,
        blink_sensitivity: blinkSens,
        dwell_time: dwellTime,
        cursor_speed: cursorSpeed,
        smoothness: smoothness,
        voice_language: voiceLanguage,
        theme: theme,
        camera_device: cameraDevice
      });
      setSettings(res);
      setSuccess(true);
      
      // Update theme classes instantly
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark', 'high-contrast');
      root.classList.add(theme);
      localStorage.setItem('insight_theme', theme);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update system settings.');
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
    <div className="max-w-4xl space-y-6 pb-10">
      
      <div className="glass-card p-6 rounded-3xl space-y-6">
        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-brand-glow" /> System Configurations
          </h3>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
            ✓ Settings successfully saved and synced with running engines!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          
          {/* Section 1: Cursor Sensitivity */}
          <div className="space-y-4">
            <h4 className="font-bold text-white flex items-center gap-2 border-b border-[var(--card-border)] pb-2">
              <Sliders className="w-4 h-4 text-sky-400" /> Tracking Sensitivities & Speeds
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Eye Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Eye Gaze Sensitivity</span>
                  <span className="font-mono text-white">{eyeSens.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-glow"
                  value={eyeSens}
                  onChange={e => setEyeSens(parseFloat(e.target.value))}
                />
              </div>

              {/* Head Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Head Gesture Sensitivity</span>
                  <span className="font-mono text-white">{headSens.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-glow"
                  value={headSens}
                  onChange={e => setHeadSens(parseFloat(e.target.value))}
                />
              </div>

              {/* Blink Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Blink Close Threshold (EAR)</span>
                  <span className="font-mono text-white">{blinkSens.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.35"
                  step="0.01"
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-glow"
                  value={blinkSens}
                  onChange={e => setBlinkSens(parseFloat(e.target.value))}
                />
              </div>

              {/* Dwell Time */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Dwell Delay (Seconds)</span>
                  <span className="font-mono text-white">{dwellTime.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-glow"
                  value={dwellTime}
                  onChange={e => setDwellTime(parseFloat(e.target.value))}
                />
              </div>

              {/* Cursor Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Cursor Speed Modifier</span>
                  <span className="font-mono text-white">{cursorSpeed.toFixed(0)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-glow"
                  value={cursorSpeed}
                  onChange={e => setCursorSpeed(parseInt(e.target.value))}
                />
              </div>

              {/* Smoothness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Pointer Smoothness (EMA filter)</span>
                  <span className="font-mono text-white">{smoothness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.95"
                  step="0.05"
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-glow"
                  value={smoothness}
                  onChange={e => setSmoothness(parseFloat(e.target.value))}
                />
              </div>

            </div>
          </div>

          {/* Section 2: Layout & Devices */}
          <div className="space-y-4 pt-4">
            <h4 className="font-bold text-white flex items-center gap-2 border-b border-[var(--card-border)] pb-2">
              <Monitor className="w-4 h-4 text-purple-400" /> Device, Language & UI Theme
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">Webcam Device ID</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full glass-input py-2 px-3 text-xs"
                  value={cameraDevice}
                  onChange={e => setCameraDevice(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">Voice Speech Language</label>
                <select
                  className="w-full glass-input py-2 px-3 text-xs cursor-pointer"
                  value={voiceLanguage}
                  onChange={e => setVoiceLanguage(e.target.value)}
                >
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German (Germany)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">Contrast & Visual Mode</label>
                <select
                  className="w-full glass-input py-2 px-3 text-xs cursor-pointer"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                >
                  <option value="dark">Dark Theme</option>
                  <option value="light">Light Theme</option>
                  <option value="high-contrast">High Contrast Mode</option>
                </select>
              </div>

            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="px-6 py-3 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-accent/25 transition-all duration-300"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
