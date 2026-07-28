import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  Compass, 
  Mic, 
  Accessibility, 
  FileLock2, 
  ArrowRight, 
  Camera, 
  Sparkles, 
  Cpu, 
  ChevronDown
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'eye' | 'head' | 'voice'>('eye');
  
  const faqs = [
    { q: "Do I need special hardware like Tobii tracker?", a: "No. InSight works with standard, built-in laptop webcams or USB webcams. It uses advanced computer vision to compute landmarks directly from RGB frames." },
    { q: "Is voice recognition done locally?", a: "InSight supports offline fallbacks, but utilizes Google Web Speech recognition for the highest accuracy, which requires active internet connection." },
    { q: "How does blink detection map to clicking?", a: "Left eye aspect ratios are checked against thresholds. Standard closure yields a Left Click, double-closure triggers a Double Click, and long-closure triggers a Right Click." },
    { q: "Who is InSight designed for?", a: "Mainly users with motor-impairments or disabilities like ALS, RSI, or paralysis, but it is also a highly productive tool for developer hands-free control." }
  ];

  return (
    <div className="min-h-screen text-[var(--text-primary)] bg-[var(--bg-primary)] overflow-x-hidden relative font-sans">
      
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[var(--card-border)] relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-600 to-sky-400 p-2.5 rounded-xl">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-extrabold text-xl bg-gradient-to-r from-brand-accent to-brand-glow bg-clip-text text-transparent">
            InSight
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-semibold hover:text-brand-glow transition-all duration-300">
            Sign In
          </Link>
          <Link to="/register" className="text-sm font-semibold bg-brand-accent hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-brand-accent/20 transition-all duration-300">
            Register Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-brand-glow text-xs font-bold mb-6 animate-pulse-slow">
          <Sparkles className="w-3.5 h-3.5" /> Next-Generation HCI Software
        </div>
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Control Your Computer, <br />
          <span className="bg-gradient-to-r from-brand-accent to-brand-glow bg-clip-text text-transparent">
            Hands-Free
          </span>
        </h2>
        <p className="text-lg text-[var(--text-secondary)] mt-6 max-w-2xl">
          An AI-powered assistive desktop platform allowing you to control cursor navigation, perform mouse clicks, and issue system commands using eyes, head gestures, blinks, and voice.
        </p>
        <div className="mt-10 flex gap-4">
          <Link to="/register" className="px-8 py-4 bg-brand-accent hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-brand-accent/25 transition-all duration-300">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="px-8 py-4 glass-card border border-white/10 hover:bg-white/5 rounded-2xl font-bold transition-all duration-300">
            Explore Features
          </a>
        </div>
      </header>

      {/* Interactive Tabs Module Showcase */}
      <section className="max-w-5xl mx-auto px-6 pb-28" id="features">
        <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="flex border-b border-white/5 pb-6 justify-center gap-4">
            {(['eye', 'head', 'voice'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                    : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab === 'eye' && 'Eye Iris Tracking'}
                {tab === 'head' && 'Head Gesture Joystick'}
                {tab === 'voice' && 'Voice Commands'}
              </button>
            ))}
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              {activeTab === 'eye' && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <Eye className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Deep Gaze Estimation</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Uses MediaPipe Face Mesh refined eye models to track iris movements relative to corner anchors. Gaze vector values map to coordinates through a fast Ridge Regression model trained on a 5-point calibration grid.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2 pt-2">
                    <li className="flex items-center gap-2">✓ Real-time high accuracy</li>
                    <li className="flex items-center gap-2">✓ Dwell Click support (2.0s holding)</li>
                  </ul>
                </>
              )}
              {activeTab === 'head' && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Nose Joystick Controller</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    For users who prefer relative steering, InSight maps nose tip displacement to mouse displacement vectors. If your nose coordinates cross a center deadzone, the cursor drifts smoothly in that direction.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2 pt-2">
                    <li className="flex items-center gap-2">✓ Adjustable center deadzone</li>
                    <li className="flex items-center gap-2">✓ Linear cursor speed mapping</li>
                  </ul>
                </>
              )}
              {activeTab === 'voice' && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Mic className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Local Macro Executions</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Trigger operations like scroll commands ("Scroll Down"), media control ("Mute"), window manipulation ("Minimize Window"), browser launching ("Open Chrome"), and custom keyboard sequences using voice commands.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2 pt-2">
                    <li className="flex items-center gap-2">✓ Customizable database mappings</li>
                    <li className="flex items-center gap-2">✓ Multi-threaded listener</li>
                  </ul>
                </>
              )}
            </div>
            <div className="flex-1 glass-card border border-white/5 p-4 rounded-2xl bg-slate-900/40 w-full aspect-video flex items-center justify-center">
              <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
              <span className="text-xs text-slate-500 ml-2 font-mono">Webcam Feed Overlay Demo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[var(--card-border)] grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
            <Accessibility className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold">Assistive Assistances</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Engineered targeting WCAG accessibility design templates, including high contrast variables, larger click zones, keyboard shortcuts, and voice audio notifications.
          </p>
        </div>
        <div className="glass-card p-8 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold">Ultralight Compute</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Powered by MediaPipe Face Mesh model. No massive Neural Nets running on GPU. Negligible CPU and RAM overhead, ideal for standard hardware.
          </p>
        </div>
        <div className="glass-card p-8 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
            <FileLock2 className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold">Secure Local Auth</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Fully offline database profiles (SQLite) and local settings database ensures credentials, settings, and custom voice commands remain private.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-extrabold text-center mb-10">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl border border-white/5 space-y-2">
              <h5 className="font-bold text-sm flex items-center justify-between text-white">
                {faq.q}
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] bg-slate-950/20 py-12 text-center text-xs text-slate-500 space-y-4">
        <div className="flex justify-center gap-4">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">API Reference</a>
          <a href="#" className="hover:text-white">WCAG Accessibility</a>
        </div>
        <p>© {new Date().getFullYear()} InSight AI Vision HCI System. All rights reserved.</p>
      </footer>
      
    </div>
  );
};
