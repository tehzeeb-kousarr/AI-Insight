import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calibrationApi } from '../services/api';
import { Crosshair, Play, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CalibrationWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

interface TargetPoint {
  label: string;
  rx: number; // relative X (0 to 1)
  ry: number; // relative Y (0 to 1)
}

const TARGETS: TargetPoint[] = [
  { label: 'Center', rx: 0.5, ry: 0.5 },
  { label: 'Top Left', rx: 0.1, ry: 0.1 },
  { label: 'Top Right', rx: 0.9, ry: 0.1 },
  { label: 'Bottom Left', rx: 0.1, ry: 0.9 },
  { label: 'Bottom Right', rx: 0.9, ry: 0.9 },
];

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState<'intro' | 'calibrating' | 'fitting' | 'success' | 'error'>('intro');
  const [targetIndex, setTargetIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentTarget = TARGETS[targetIndex];

  const handleNextPoint = useCallback(async () => {
    if (isRecording) return;
    setIsRecording(true);

    try {
      // Calculate actual pixel coordinates based on user screen sizes
      const screenX = currentTarget.rx * window.screen.width;
      const screenY = currentTarget.ry * window.screen.height;

      // Submit point coordinate
      await calibrationApi.recordPoint({
        screen_x: screenX,
        screen_y: screenY,
        eye_x: 0, // Backend fills this with current eye ratios automatically
        eye_y: 0,
      });

      if (targetIndex < TARGETS.length - 1) {
        setTargetIndex(prev => prev + 1);
      } else {
        // All points captured, proceed to fitting
        setStep('fitting');
        const fitRes = await calibrationApi.fit();
        if (fitRes) {
          setStep('success');
          onComplete();
        } else {
          throw new Error("Fitting returned empty response");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to register calibration point. Please check webcam connection.');
      setStep('error');
    } finally {
      setIsRecording(false);
    }
  }, [targetIndex, currentTarget, isRecording, onComplete]);

  // Spacebar capture handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'calibrating' && e.code === 'Space') {
        e.preventDefault();
        handleNextPoint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handleNextPoint]);

  const startCalibration = async () => {
    try {
      await calibrationApi.clear();
      setTargetIndex(0);
      setStep('calibrating');
    } catch (err) {
      setErrorMsg('Failed to initialize calibration database.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/98 z-50 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* Intro Step */}
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 bg-brand-accent/20 rounded-2xl flex items-center justify-center text-brand-glow shadow-lg shadow-brand-glow/20">
              <Crosshair className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-white">Gaze Calibration Wizard</h3>
              <p className="text-sm text-slate-400">
                To enable accurate eye tracking, we need to map your eye coordinates. Look directly at each target dot and press <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-200 text-xs border border-slate-700">Spacebar</kbd> to record.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-white/10 rounded-xl hover:bg-white/5 text-slate-300 font-semibold text-sm transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={startCalibration}
                className="flex-1 py-3 px-4 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/30 transition-all duration-300"
              >
                <Play className="w-4 h-4" /> Start
              </button>
            </div>
          </motion.div>
        )}

        {/* Calibrating Target Display */}
        {step === 'calibrating' && (
          <motion.div
            key="calibrating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Instruction Overlay in Center */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none space-y-2 opacity-40">
              <p className="text-white font-bold text-sm tracking-wider uppercase">
                Focus on the target dot and press Spacebar
              </p>
              <p className="text-slate-400 text-xs">
                Target: {targetIndex + 1} of {TARGETS.length} ({currentTarget.label})
              </p>
            </div>

            {/* Glowing Target Target */}
            <motion.div
              style={{
                position: 'absolute',
                left: `${currentTarget.rx * 100}%`,
                top: `${currentTarget.ry * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{ scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-12 h-12 flex items-center justify-center cursor-pointer group"
              onClick={handleNextPoint}
            >
              {/* Outer Glow Ring */}
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }}></span>
              {/* Target boundary circles */}
              <div className="absolute w-8 h-8 rounded-full border-2 border-emerald-400/60 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50"></div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Fitting Wait Step */}
        {step === 'fitting' && (
          <motion.div
            key="fitting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full glass-card p-8 rounded-3xl text-center space-y-4"
          >
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-brand-glow border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-bold text-white">Fitting Gaze Coordinate Mapping</h3>
            <p className="text-slate-400 text-sm">
              Applying regression solvers to map eye landmarks to your monitor coordinates...
            </p>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full glass-card p-8 rounded-3xl text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Calibration Successful!</h3>
              <p className="text-slate-400 text-sm">
                Your custom eye tracking mapping has been fitted and saved to your profile. You can now enable Gaze Tracking in the dashboard.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all duration-300"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full glass-card p-8 rounded-3xl text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Calibration Failed</h3>
              <p className="text-rose-400 text-sm">
                {errorMsg}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-white/10 rounded-xl hover:bg-white/5 text-slate-300 font-semibold text-sm transition-all duration-300"
              >
                Close
              </button>
              <button
                onClick={startCalibration}
                className="flex-1 py-3 px-4 bg-brand-accent hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
