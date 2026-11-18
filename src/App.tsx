import { useState, useEffect, useRef } from 'react';
import { useGameStore } from './store/useGameStore';
import { HeaderHUD } from './ui/components/HeaderHUD';
import { EngineersPanel } from './ui/components/EngineersPanel';
import { MainMenu } from './ui/screens/MainMenu';
import { SeasonSelect } from './ui/screens/SeasonSelect';
import { MissionPlanner } from './ui/screens/MissionPlanner';
import { LandingSiteSelector } from './ui/screens/LandingSiteSelector';
import { BaseBuilderView } from './ui/screens/BaseBuilderView';
import { MissionReport } from './ui/screens/MissionReport';
import { TechTreeScreen } from './ui/screens/TechTreeScreen';
import { DataCreditsModal } from './ui/screens/DataCreditsModal';
import { LevelBriefingModal } from './ui/components/LevelBriefingModal';
import { InteractiveTutorialOverlay } from './ui/components/InteractiveTutorialOverlay';

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
      } else if (e.key === 'b' || e.key === 'B') {
        // Toggle build menu or selection
        const buildBtn = document.querySelector('button:has-text("Build"), button:has-text("Open Build")') as HTMLButtonElement;
        if (buildBtn) buildBtn.click();
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

        {currentScreen === 'LANDING_SELECTOR' && <LandingSiteSelector />}

        {currentScreen === 'BASE_BUILDER' && <BaseBuilderView />}

        {currentScreen === 'MISSION_REPORT' && <MissionReport />}

        {currentScreen === 'TECH_TREE' && <TechTreeScreen />}

        {currentScreen === 'DATA_CREDITS' && <DataCreditsModal />}
      </main>

      {/* Flight Director Interactive Tutorial Overlay */}
      <InteractiveTutorialOverlay />

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
