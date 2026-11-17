import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { translations } from '../i18n';
import { sound } from '../../audio/soundSynth';
import { 
  Play, 
  Pause, 
  FastForward, 
  Volume2, 
  VolumeX, 
  Globe, 
  Cpu, 
  ChevronRight,
  Clock
} from 'lucide-react';
import type { TimeScale } from '../../types/game';

export const HeaderHUD: React.FC = () => {
  const {
    missionElapsedDays,
    missionElapsedSeconds,
    gameTimeScale,
    setTimeScale,
    togglePause,
    fastForwardDays,
    locale,
    toggleLanguage,
    soundEnabled,
    toggleSound,
    setEngineerPanelModuleId,
    engineerPanelModuleId,
  } = useGameStore();

  const t = translations[locale];

  const handleTimeScaleChange = (scale: TimeScale) => {
    sound.playClick();
    setTimeScale(scale);
  };

  const handleSkipDays = (days: number) => {
    sound.playSuccess();
    fastForwardDays(days);
  };

  const handleToggleSound = () => {
    toggleSound();
    sound.enabled = !soundEnabled;
    if (!soundEnabled) sound.playClick();
  };

  const handleToggleEngineer = () => {
    sound.playClick();
    setEngineerPanelModuleId(engineerPanelModuleId ? null : 'general_telemetry');
  };

  return (
    <header className="h-14 bg-space-darker/95 backdrop-blur border-b border-space-border px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Branding & Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-telemetry-cyan animate-pulse shadow-sm shadow-telemetry-cyan" />
          <span className="font-bold text-sm tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            {t.gameTitle}
          </span>
        </div>
        <span className="text-[10px] hidden md:inline-block px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-950/40">
          NASA SPACE APPS 2027
        </span>
      </div>

      {/* Center: Mission Clock & Simulation Time Controls */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Mission Elapsed Time */}
        <div className="flex items-center space-x-2 bg-space-dark px-3 py-1 rounded border border-space-border text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span className="text-gray-400">SOL:</span>
          <span className="text-telemetry-cyan font-semibold">{missionElapsedDays}</span>
          <span className="text-gray-500 text-[10px]">
            ({Math.floor((missionElapsedSeconds % 86400) / 3600)}h {Math.floor((missionElapsedSeconds % 3600) / 60)}m)
          </span>
        </div>

        {/* Time Scale Multipliers */}
        <div className="hidden sm:flex items-center space-x-1 bg-space-dark p-0.5 rounded border border-space-border">
          <button
            onClick={togglePause}
            title="Pause / Resume (Space)"
            className={`p-1.5 rounded transition ${
              gameTimeScale === 0 ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            {gameTimeScale === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => handleTimeScaleChange(1)}
            title="1x (1s = 1m)"
            className={`px-2 py-1 text-xs font-mono rounded transition ${
              gameTimeScale === 1 ? 'bg-telemetry-cyan text-space-darkest font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            1m
          </button>

          <button
            onClick={() => handleTimeScaleChange(10)}
            title="10x (1s = 10m)"
            className={`px-2 py-1 text-xs font-mono rounded transition ${
              gameTimeScale === 10 ? 'bg-telemetry-cyan text-space-darkest font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            10m
          </button>

          <button
            onClick={() => handleTimeScaleChange(60)}
            title="60x (1s = 1h)"
            className={`px-2 py-1 text-xs font-mono rounded transition ${
              gameTimeScale === 60 ? 'bg-telemetry-cyan text-space-darkest font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            1h
          </button>

          <button
            onClick={() => handleTimeScaleChange(1440)}
            title="1440x (1s = 1d)"
            className={`px-2 py-1 text-xs font-mono rounded transition ${
              gameTimeScale === 1440 ? 'bg-telemetry-cyan text-space-darkest font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            1d
          </button>
        </div>

        {/* Skip / Fast Forward Buttons for Demo Constraint 5 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleSkipDays(1)}
            title="Fast-forward 1 Day"
            className="flex items-center space-x-1 text-xs bg-space-card hover:bg-space-muted text-gray-200 px-2 py-1 rounded border border-space-border transition"
          >
            <FastForward className="w-3 h-3 text-telemetry-amber" />
            <span className="font-mono text-[11px]">{t.skip1Day}</span>
          </button>

          <button
            onClick={() => handleSkipDays(7)}
            title="Fast-forward 7 Days (1 Week)"
            className="hidden md:flex items-center space-x-1 text-xs bg-space-card hover:bg-space-muted text-gray-200 px-2 py-1 rounded border border-space-border transition"
          >
            <FastForward className="w-3 h-3 text-telemetry-amber" />
            <span className="font-mono text-[11px]">{t.skip7Days}</span>
          </button>
        </div>
      </div>

      {/* Right: Controls & Engineer's Panel */}
      <div className="flex items-center space-x-2">
        {/* Engineer's Panel Trigger */}
        <button
          onClick={handleToggleEngineer}
          className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded border transition font-mono ${
            engineerPanelModuleId 
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
              : 'bg-space-dark hover:bg-space-card border-space-border text-gray-300'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span className="hidden sm:inline">{t.engineersPanel}</span>
          <ChevronRight className={`w-3 h-3 transition-transform ${engineerPanelModuleId ? 'rotate-90' : ''}`} />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          title={soundEnabled ? "Mute Telemetry Sound" : "Enable Sound"}
          className="p-1.5 rounded bg-space-dark hover:bg-space-card border border-space-border text-gray-300 transition"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-telemetry-emerald" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
        </button>

        {/* Language Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            toggleLanguage();
          }}
          title="Switch Language (English / Bangla)"
          className="flex items-center space-x-1 text-xs px-2 py-1 rounded bg-space-dark hover:bg-space-card border border-space-border text-gray-300 transition font-mono"
        >
          <Globe className="w-3.5 h-3.5 text-telemetry-purple" />
          <span className="font-bold">{locale.toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
};
