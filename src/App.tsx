import { useState, useEffect, useRef } from 'react';
import { useGameStore } from './store/useGameStore';
import { HeaderHUD } from './ui/components/HeaderHUD';
import { EngineersPanel } from './ui/components/EngineersPanel';
import { MainMenu } from './ui/screens/MainMenu';
import { SeasonSelect } from './ui/screens/SeasonSelect';
import { MissionPlanner } from './ui/screens/MissionPlanner';
import { DataCreditsModal } from './ui/screens/DataCreditsModal';
import { LevelBriefingModal } from './ui/components/LevelBriefingModal';
import { sound } from './audio/soundSynth';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export function App() {
  const {
    currentScreen,
    setScreen,
    tickMissionTime,
    togglePause,
    setTimeScale,
    setEngineerPanelModuleId,
    engineerPanelModuleId,
  } = useGameStore();

  const [briefingLevelNumber, setBriefingLevelNumber] = useState<number | null>(null);

  // Real-time Mission Ticker Loop
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (deltaSec > 0 && deltaSec < 1.0) {
        tickMissionTime(deltaSec);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tickMissionTime]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.key === '1') {
        setTimeScale(1);
      } else if (e.key === '2') {
        setTimeScale(10);
      } else if (e.key === '3') {
        setTimeScale(60);
      } else if (e.key === '4') {
        setTimeScale(1440);
      } else if (e.key === 'e' || e.key === 'E') {
        setEngineerPanelModuleId(engineerPanelModuleId ? null : 'general_telemetry');
      } else if (e.key === 'Escape') {
        if (briefingLevelNumber !== null) {
          setBriefingLevelNumber(null);
        } else if (engineerPanelModuleId) {
          setEngineerPanelModuleId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, setTimeScale, engineerPanelModuleId, setEngineerPanelModuleId, briefingLevelNumber]);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-space-darkest text-gray-100 select-none">
      {/* Space Agency Top Telemetry HUD */}
      <HeaderHUD />

      {/* Main Screen Router */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden flex">
        {currentScreen === 'MAIN_MENU' && <MainMenu />}

        {currentScreen === 'SEASON_SELECT' && (
          <SeasonSelect
            onSelectLevelBriefing={(lvlNum) => setBriefingLevelNumber(lvlNum)}
          />
        )}

        {currentScreen === 'MISSION_PLANNER' && <MissionPlanner />}

        {currentScreen === 'DATA_CREDITS' && <DataCreditsModal />}

        {/* Phase 2 Transit / Base Builder Holding View */}
        {currentScreen === 'BASE_BUILDER' && (
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-space-darker to-space-darkest space-y-4">
            <div className="p-4 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-white font-mono">
              PHASE 2 COMPLETE: MISSION TRANSLUNAR INJECTION SUCCESSFUL
            </h2>
            <p className="text-sm text-gray-300 max-w-lg leading-relaxed">
              Spacecraft is on nominal Hohmann transfer trajectory to Shackleton Crater Rim.
              Base Builder initialization will commence in Phase 3 upon user approval.
            </p>
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => {
                  sound.playClick();
                  setScreen('MISSION_PLANNER');
                }}
                className="py-2.5 px-5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-space-darkest font-bold text-xs uppercase font-mono transition flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Mission Planner</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Level Briefing Modal Popup */}
      {briefingLevelNumber !== null && (
        <LevelBriefingModal
          levelNumber={briefingLevelNumber}
          onClose={() => setBriefingLevelNumber(null)}
          onProceedToPlanner={() => {
            setBriefingLevelNumber(null);
            setScreen('MISSION_PLANNER');
          }}
        />
      )}

      {/* Engineer's Panel Drawer */}
      <EngineersPanel />
    </div>
  );
}

export default App;
