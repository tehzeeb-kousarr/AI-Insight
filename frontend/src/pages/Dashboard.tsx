import React, { useState, useEffect } from 'react';
import { systemApi, settingsApi } from '../services/api';
import type { Setting, SystemStatus } from '../services/api';
import { 
  Camera, 
  CameraOff, 
  Eye, 
  Compass, 
  Mic, 
  MicOff, 
  Cpu, 
  Activity, 
  Clock, 
  Crosshair, 
  RefreshCw 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { CalibrationWizard } from '../components/CalibrationWizard';

interface ResourceMetrics {
  time: string;
  cpu: number;
  memory: number;
}

export const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [resourceHistory, setResourceHistory] = useState<ResourceMetrics[]>([]);
  
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch status and settings
  const fetchData = async () => {
    try {
      const statusData = await systemApi.getStatus();
      setStatus(statusData);

      const settingsData = await settingsApi.get();
      setSettings(settingsData);

      // Append resource utilization history
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setResourceHistory(prev => {
        const next = [...prev, { time: nowStr, cpu: statusData.cpu_usage, memory: statusData.memory_usage }];
        if (next.length > 10) next.shift(); // keep last 10 points
        return next;
      });
    } catch (err) {
      console.error("Failed to fetch dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1500); // Poll every 1.5 seconds
    return () => clearInterval(interval);
  }, []);

  // Quick module toggle handler
  const handleToggle = async (module: 'eye' | 'head' | 'voice') => {
    if (!settings) return;
    
    let updated: Partial<Setting> = {};
    if (module === 'eye') {
      updated = { is_eye_tracking_enabled: !settings.is_eye_tracking_enabled };
    } else if (module === 'head') {
      updated = { is_head_tracking_enabled: !settings.is_head_tracking_enabled };
    } else if (module === 'voice') {
      updated = { is_voice_commands_enabled: !settings.is_voice_commands_enabled };
    }

    try {
      const res = await settingsApi.update(updated);
      setSettings(res);
    } catch (err) {
      console.error("Failed to update module state", err);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  };

  if (loading && !status) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Calibration Overlay */}
      {isCalibrating && (
        <CalibrationWizard 
          onClose={() => setIsCalibrating(false)} 
          onComplete={() => {
            setIsCalibrating(false);
            fetchData();
          }} 
        />
      )}

      {/* Quick Access Actions Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600/10 to-sky-500/10 p-6 rounded-2xl border border-blue-500/10">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Control Dashboard <Activity className="w-4 h-4 text-brand-glow animate-pulse" />
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">Manage your assistive modules and calibrate gaze models.</p>
        </div>
        <button
          onClick={() => setIsCalibrating(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-brand-accent/20 transition-all duration-300"
        >
          <Crosshair className="w-4 h-4" /> Start Calibration Wizard
        </button>
      </div>

      {/* Main Grid: Stream & Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Webcam Streaming Card */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Camera className="w-4.5 h-4.5 text-brand-glow" /> Camera Feed & Facial Mesh
            </h4>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
              Camera Device: {settings?.camera_device ?? 0}
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-[var(--card-border)] flex items-center justify-center">
            {status?.camera_status ? (
              <img 
                src={systemApi.videoFeedUrl} 
                alt="Webcam Stream" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="text-center space-y-3 p-6">
                <CameraOff className="w-12 h-12 mx-auto text-slate-600" />
                <div>
                  <p className="text-slate-400 font-semibold text-sm">Tracking Camera Offline</p>
                  <p className="text-slate-500 text-xs mt-1">Enable Gaze or Head tracking to start the camera stream.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Modules Toggles */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-bold text-sm border-b border-[var(--card-border)] pb-3 text-white">
              Module Toggles
            </h4>
            
            {/* Eye Tracking Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${settings?.is_eye_tracking_enabled ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Gaze Pointer</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Control mouse with pupils</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('eye')}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                  settings?.is_eye_tracking_enabled ? 'bg-brand-accent' : 'bg-slate-700'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                  settings?.is_eye_tracking_enabled ? 'left-6' : 'left-1'
                }`}></span>
              </button>
            </div>

            {/* Head Tracking Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${settings?.is_head_tracking_enabled ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Head Joystick</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Steer cursor with head tilt</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('head')}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                  settings?.is_head_tracking_enabled ? 'bg-brand-accent' : 'bg-slate-700'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                  settings?.is_head_tracking_enabled ? 'left-6' : 'left-1'
                }`}></span>
              </button>
            </div>

            {/* Voice Control Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${settings?.is_voice_commands_enabled ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                  {settings?.is_voice_commands_enabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Voice Commands</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Speech shortcut executor</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('voice')}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                  settings?.is_voice_commands_enabled ? 'bg-brand-accent' : 'bg-slate-700'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                  settings?.is_voice_commands_enabled ? 'left-6' : 'left-1'
                }`}></span>
              </button>
            </div>

          </div>

          {/* Quick Stats list */}
          <div className="pt-6 border-t border-[var(--card-border)] space-y-2.5 text-xs text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Calibration State:</span>
              <span className={status?.calibration_status ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {status?.calibration_status ? 'Calibrated' : 'Needs Calibration'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Eye Detection:</span>
              <span className={status?.eye_detection_status ? 'text-emerald-400' : 'text-slate-500'}>
                {status?.eye_detection_status ? 'Acquired' : 'Lost'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Voice Service:</span>
              <span className={status?.voice_recognition_status ? 'text-indigo-400' : 'text-slate-500'}>
                {status?.voice_recognition_status ? 'Listening' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Today's Usage Time */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-brand-glow">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Today's Usage</p>
            <h5 className="text-base font-extrabold text-white">
              {formatTime(status?.today_usage_seconds ?? 0)}
            </h5>
          </div>
        </div>

        {/* FPS Indicator */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Stream FPS</p>
            <h5 className="text-base font-extrabold text-white">
              {status?.fps ?? 0.0} <span className="text-[10px] text-slate-500 font-medium">fps</span>
            </h5>
          </div>
        </div>

        {/* Cursor position */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Mouse Coordinates</p>
            <h5 className="text-xs font-mono font-bold text-white">
              X: {status?.current_cursor_pos.x ?? 0} | Y: {status?.current_cursor_pos.y ?? 0}
            </h5>
          </div>
        </div>

        {/* Camera device index */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Core CPU Load</p>
            <h5 className="text-base font-extrabold text-white">
              {status?.cpu_usage ?? 0.0}%
            </h5>
          </div>
        </div>
      </div>

      {/* System Resources Performance Charts */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Cpu className="w-4.5 h-4.5 text-brand-glow" /> System Resources Utilization
        </h4>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={resourceHistory}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Area type="monotone" dataKey="cpu" name="CPU (%)" stroke="#38bdf8" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
              <Area type="monotone" dataKey="memory" name="Memory (%)" stroke="#818cf8" fillOpacity={1} fill="url(#colorMem)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
