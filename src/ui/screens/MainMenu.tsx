import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { translations } from '../i18n';
import { sound } from '../../audio/soundSynth';
import { Rocket, Compass, BookOpen, ShieldCheck, RotateCcw } from 'lucide-react';

export const MainMenu: React.FC = () => {
  const { setScreen, resetGame, locale } = useGameStore();
  const t = translations[locale];

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-space-darkest via-space-darker to-[#02040a] p-4 text-center">
      {/* Background Subtle Starfield Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Main Content Box */}
      <div className="relative z-10 max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* NASA Space Apps Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span>NASA International Space Apps Challenge 2027</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white uppercase font-sans">
            OUTPOST
            <span className="block text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 font-mono mt-1">
              BEYOND EARTH
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Hard-science aerospace base building. Harness real NASA telemetry, orbital Hohmann transfers, and in-situ resources to settle the Solar System.
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col space-y-3 max-w-xs mx-auto pt-4">
          <button
            onClick={() => {
              sound.playSuccess();
              setScreen('SEASON_SELECT');
            }}
            className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-space-darkest font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
          >
            <Rocket className="w-4 h-4" />
            <span>{t.newGame}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setScreen('SEASON_SELECT');
            }}
            className="w-full py-3 px-6 rounded-lg bg-space-card hover:bg-space-muted border border-space-border text-gray-200 font-semibold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition"
          >
            <Compass className="w-4 h-4 text-telemetry-purple" />
            <span>{t.seasonSelect}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setScreen('DATA_CREDITS');
            }}
            className="w-full py-3 px-6 rounded-lg bg-space-card/60 hover:bg-space-card border border-space-border/80 text-gray-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition"
          >
            <BookOpen className="w-4 h-4 text-telemetry-emerald" />
            <span>{t.credits}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm("Reset all game data and start a completely fresh campaign from Level 1?")) {
                sound.playSuccess();
                resetGame();
              }
            }}
            title="Clear all saved progress and reset to Level 1 fresh state"
            className="w-full py-2 px-6 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500/60 text-red-300 font-mono text-[11px] uppercase tracking-wider flex items-center justify-center space-x-2 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Reset Game (Fresh Start)</span>
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div className="pt-6 grid grid-cols-3 gap-2 text-[10px] text-gray-400 font-mono border-t border-space-border/60 max-w-md mx-auto">
          <div>
            <span className="text-cyan-400 block font-bold">100% OFFLINE</span>
            Pre-cached JSON
          </div>
          <div>
            <span className="text-emerald-400 block font-bold">TSIOLKOVSKY</span>
            Pure Physics
          </div>
          <div>
            <span className="text-purple-400 block font-bold">ARTEMIS BASE</span>
            Shackleton Rim
          </div>
        </div>
      </div>
    </div>
  );
};
