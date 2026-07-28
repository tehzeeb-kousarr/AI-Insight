import React, { useState, useEffect } from 'react';
import { calibrationApi } from '../services/api';
import { CalibrationWizard } from '../components/CalibrationWizard';
import { Compass, Trash2, CheckCircle, Crosshair, HelpCircle } from 'lucide-react';

export const Calibration: React.FC = () => {
  const [calibData, setCalibData] = useState<any>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCalibration = async () => {
    try {
      const data = await calibrationApi.get();
      setCalibData(data);
    } catch (err) {
      console.error("Failed to load calibration data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalibration();
  }, []);

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to delete your calibration profile? Gaze tracking will be disabled.")) return;
    try {
      await calibrationApi.clear();
      fetchCalibration();
    } catch (err) {
      console.error("Failed to clear calibration data", err);
    }
  };

  const isCalibrated = calibData?.regression_weights && Object.keys(calibData.regression_weights).length > 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Wizard Portal */}
      {isWizardOpen && (
        <CalibrationWizard 
          onClose={() => setIsWizardOpen(false)} 
          onComplete={() => {
            setIsWizardOpen(false);
            fetchCalibration();
          }} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Status Block */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand-glow" /> Calibration Profile
            </h3>
            {isCalibrated ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> Active Profile
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Not Calibrated
              </span>
            )}
          </div>

          {isCalibrated ? (
            <div className="space-y-6">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Your gaze estimator is calibrated. The system fits linear models using coordinate ratios computed from the camera mesh.
              </p>

              {/* Coordinates map */}
              <div className="border border-[var(--card-border)] rounded-2xl p-4 bg-slate-950/20">
                <h4 className="text-xs font-bold text-slate-400 mb-4 text-center">Fitted Calibration Vectors</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">X Coefficient 1</span>
                    <span className="font-mono text-white font-bold">{calibData.regression_weights.coef_x[0]?.toFixed(4)}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">X Coefficient 2</span>
                    <span className="font-mono text-white font-bold">{calibData.regression_weights.coef_x[1]?.toFixed(4)}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Y Coefficient 1</span>
                    <span className="font-mono text-white font-bold">{calibData.regression_weights.coef_y[0]?.toFixed(4)}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Y Coefficient 2</span>
                    <span className="font-mono text-white font-bold">{calibData.regression_weights.coef_y[1]?.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="flex-1 py-3 px-4 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-brand-accent/25 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Crosshair className="w-4 h-4" /> Recalibrate
                </button>
                <button
                  onClick={handleClear}
                  className="py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl font-semibold text-xs border border-rose-500/20 transition-all duration-300 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Clear Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-6">
              <Crosshair className="w-16 h-16 mx-auto text-slate-600 animate-pulse" />
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-white font-bold text-base">No Gaze Coordinates Configured</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Before launching Gaze tracking, run the 5-point calibration process so the software can capture your eye iris parameters.
                </p>
              </div>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="py-3.5 px-6 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-brand-accent/25 transition-all duration-300"
              >
                Run Calibration Wizard
              </button>
            </div>
          )}
        </div>

        {/* Documentation Sidebar Card */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <HelpCircle className="w-4.5 h-4.5 text-brand-glow" /> Calibration Tips
          </h4>
          <div className="space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed">
            <div className="space-y-1">
              <p className="font-bold text-white">1. Stabilize Head</p>
              <p>Keep your head relatively still during calibration. The software maps pure eye movements to keep parameters consistent.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">2. Good Lighting</p>
              <p>Ensure light illuminates your eyes evenly. Backlight behind your head may decrease pupil recognition accuracy.</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">3. Sit Comfortably</p>
              <p>Position your face 1.5 to 2.5 feet directly in front of the camera before starting the sequence.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
