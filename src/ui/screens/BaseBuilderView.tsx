import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../audio/soundSynth';
import { translations, getLocalizedLevelTitle, getLocalizedObjectiveDescription } from '../i18n';
import { ResourceBarHUD } from '../components/ResourceBarHUD';
import { IsometricBaseCanvas } from '../../scenes/canvas/IsometricBaseCanvas';
import { ModuleBuildMenu } from '../components/ModuleBuildMenu';
import { ModuleInspectorModal } from '../components/ModuleInspectorModal';
import { MarsCommsQueueHUD } from '../components/MarsCommsQueueHUD';
import type { PlacedModule } from '../../types/game';
import { 
  Save, 
  Download, 
  CheckCircle2, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft 
} from 'lucide-react';

// Dedicated Objectives Card component with isolated subscription
const ObjectivesCard: React.FC = () => {
  const objectives = useGameStore((s) => s.objectives);
  const powerStoredKWh = useGameStore((s) => s.powerStoredKWh);
  const waterKg = useGameStore((s) => s.waterKg);
  const placedModules = useGameStore((s) => s.placedModules);
  const levelTitle = useGameStore((s) => s.levelTitle);
  const locale = useGameStore((s) => s.locale);
  const selectedSeasonId = useGameStore((s) => s.selectedSeasonId);
  const selectedLevelNumber = useGameStore((s) => s.selectedLevelNumber);
  const t = translations[locale];
  const [showObjectives, setShowObjectives] = useState<boolean>(true);

  return (
    <div className="absolute top-4 left-4 z-20 w-72 sm:w-80 bg-space-darker/90 backdrop-blur-md border border-space-border rounded-xl shadow-xl overflow-hidden font-sans text-xs select-none">
      <div
        onClick={() => setShowObjectives(s => !s)}
        className="p-3 bg-space-dark/80 border-b border-space-border/60 flex items-center justify-between cursor-pointer hover:bg-space-dark"
      >
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-telemetry-cyan" />
          <span className="font-bold text-white font-mono uppercase text-[11px] truncate">
            {getLocalizedLevelTitle(selectedSeasonId || 1, selectedLevelNumber, levelTitle, locale)}
          </span>
        </div>
        {showObjectives ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </div>

      {showObjectives && (
        <div className="p-3 space-y-2.5 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pb-1 border-b border-space-border/40">
            <span>{t.missionDirectives}</span>
            <span className="text-cyan-300 font-bold">
              {objectives.filter(o => o.completed).length} / {objectives.length} {t.completed}
            </span>
          </div>
          {objectives.map((obj, i) => {
            const liveProgress = !obj.completed && (
              obj.type === 'BUILD_MODULE'
                ? `${placedModules.filter(m => m.moduleId === obj.moduleId).length}/${obj.targetCount || 1}`
                : obj.resource === 'powerStoredKWh'
                ? `${powerStoredKWh.toFixed(0)}/${obj.targetValue} kWh`
                : obj.resource === 'waterKg'
                ? `${waterKg.toFixed(0)}/${obj.targetValue} kg`
                : null
            );

            return (
              <div key={i} className="flex items-start space-x-2 text-[11px] leading-snug">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                  obj.completed ? 'text-telemetry-emerald' : 'text-gray-500'
                }`} />
                <div className="flex-1">
                  <span className={obj.completed ? 'text-emerald-300 font-semibold' : 'text-gray-300'}>
                    {getLocalizedObjectiveDescription(obj.id, obj.description, locale)}
                  </span>
                  {liveProgress && (
                    <span className="block text-[10px] font-mono text-cyan-400 mt-0.5">
                      {t.progress}: {liveProgress}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const BaseBuilderView: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const locale = useGameStore((s) => s.locale);
  const t = translations[locale];
  const [selectedModule, setSelectedModule] = useState<PlacedModule | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Periodic LocalStorage Auto-Save
  const handleSaveGame = () => {
    try {
      const s = useGameStore.getState();
      const saveData = {
        gridTiles: s.gridTiles,
        placedModules: s.placedModules,
        missionElapsedSeconds: s.missionElapsedSeconds,
        missionElapsedDays: s.missionElapsedDays,
        powerStoredKWh: s.powerStoredKWh,
        oxygenKg: s.oxygenKg,
        waterKg: s.waterKg,
        foodDaysRemaining: s.foodDaysRemaining,
        regolithOreKg: s.regolithOreKg,
        propellantKg: s.propellantKg,
        budgetCredits: s.budgetCredits,
        landingSiteId: s.landingSiteId,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('outpost_base_save', JSON.stringify(saveData));
      sound.playSuccess();
      setSaveNotification('Base state saved to LocalStorage!');
      setTimeout(() => setSaveNotification(null), 2500);
    } catch {
      sound.playWarning();
    }
  };

  const handleLoadGame = () => {
    try {
      const raw = localStorage.getItem('outpost_base_save');
      if (!raw) {
        sound.playWarning();
        setSaveNotification('No saved outpost data found.');
        setTimeout(() => setSaveNotification(null), 2500);
        return;
      }
      const data = JSON.parse(raw);
      const s = useGameStore.getState();
      useGameStore.setState({
        gridTiles: data.gridTiles || s.gridTiles,
        placedModules: data.placedModules || s.placedModules,
        missionElapsedSeconds: data.missionElapsedSeconds || s.missionElapsedSeconds,
        missionElapsedDays: data.missionElapsedDays || s.missionElapsedDays,
        powerStoredKWh: data.powerStoredKWh ?? s.powerStoredKWh,
        oxygenKg: data.oxygenKg ?? s.oxygenKg,
        waterKg: data.waterKg ?? s.waterKg,
        foodDaysRemaining: data.foodDaysRemaining ?? s.foodDaysRemaining,
        regolithOreKg: data.regolithOreKg ?? s.regolithOreKg,
        propellantKg: data.propellantKg ?? s.propellantKg,
        budgetCredits: data.budgetCredits ?? s.budgetCredits,
      });
      sound.playSuccess();
      setSaveNotification('Base state restored from LocalStorage!');
      setTimeout(() => setSaveNotification(null), 2500);
    } catch {
      sound.playWarning();
    }
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] flex flex-col relative overflow-hidden bg-space-darkest text-gray-100">
      {/* Upper Comprehensive Resource Bar HUD */}
      <ResourceBarHUD />

      {/* Main Base Canvas Viewport */}
      <div className="flex-1 w-full h-full relative">
        <IsometricBaseCanvas onSelectPlacedModule={setSelectedModule} />

        {/* Top-Left Floating Mission Objectives Card */}
        <ObjectivesCard />

        {/* Top-Right Save / Load Quick Action Bar */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={handleSaveGame}
            title="Save base to local storage"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-darker/90 hover:bg-space-card border border-space-border text-gray-300 hover:text-white backdrop-blur shadow-md transition"
          >
            <Save className="w-3.5 h-3.5 text-telemetry-cyan" />
            <span className="hidden sm:inline">{t.saveBase}</span>
          </button>

          <button
            onClick={handleLoadGame}
            title="Load base from local storage"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-darker/90 hover:bg-space-card border border-space-border text-gray-300 hover:text-white backdrop-blur shadow-md transition"
          >
            <Download className="w-3.5 h-3.5 text-telemetry-emerald" />
            <span className="hidden sm:inline">{t.loadBase}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setScreen('MISSION_PLANNER');
            }}
            title="Return to Mission Planner"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-space-darker/90 hover:bg-space-card border border-space-border text-gray-400 hover:text-white backdrop-blur shadow-md transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{locale === 'bn' ? 'প্ল্যানার' : 'Planner'}</span>
          </button>
        </div>

        {/* Toast Save Notification */}
        {saveNotification && (
          <div className="absolute top-16 right-4 z-30 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-3.5 py-1.5 rounded-lg shadow-xl text-xs font-mono animate-in fade-in slide-in-from-top-2">
            {saveNotification}
          </div>
        )}

        {/* Selected Module Maintenance / Repair Drawer Modal */}
        <ModuleInspectorModal
          module={selectedModule}
          onClose={() => setSelectedModule(null)}
        />

        {/* Mars Relativistic Light-Time Command Queue HUD */}
        <MarsCommsQueueHUD />

        {/* Bottom Build Catalog Floating Trigger & Catalog Drawer */}
        <ModuleBuildMenu />
      </div>
    </div>
  );
};
