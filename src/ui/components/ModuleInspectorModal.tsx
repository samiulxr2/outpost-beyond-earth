import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../audio/soundSynth';
import modulesData from '../../data/modules.json';
import { calculateRepairCost } from '../../core/economy/hazardEngine';
import type { PlacedModule } from '../../types/game';
import { 
  X, 
  Wrench, 
  Trash2, 
  FastForward, 
  BookOpen, 
  Activity 
} from 'lucide-react';

interface ModuleInspectorModalProps {
  module: PlacedModule | null;
  onClose: () => void;
}

export const ModuleInspectorModal: React.FC<ModuleInspectorModalProps> = ({ module, onClose }) => {
  const {
    budgetCredits,
    setEngineerPanelModuleId,
    repairModule,
  } = useGameStore();

  if (!module) return null;

  const def = modulesData.modules.find(m => m.id === module.moduleId);
  if (!def) return null;

  const repairCost = calculateRepairCost(def.costCredits, module.durabilityPct);
  const speedUpCost = 10000;
  const deconstructRefund = Math.round(def.costCredits * 0.5);

  const handleRepair = () => {
    if (budgetCredits < repairCost) {
      sound.playWarning();
      return;
    }
    const success = repairModule(module.instanceId);
    if (success) {
      sound.playSuccess();
    } else {
      sound.playWarning();
    }
  };

  const handleSpeedUp = () => {
    sound.playSuccess();
    useGameStore.setState(state => ({
      budgetCredits: Math.max(0, state.budgetCredits - speedUpCost),
      placedModules: state.placedModules.map(m =>
        m.instanceId === module.instanceId 
          ? { ...m, isConstructing: false, constructionProgressPct: 100, constructionTimeRemainingHours: 0 } 
          : m
      ),
    }));
  };

  const handleDeconstruct = () => {
    sound.playWarning();
    useGameStore.setState(state => ({
      budgetCredits: state.budgetCredits + deconstructRefund,
      placedModules: state.placedModules.filter(m => m.instanceId !== module.instanceId),
      gridTiles: state.gridTiles.map(t =>
        t.occupiedByInstanceId === module.instanceId ? { ...t, occupiedByInstanceId: undefined } : t
      ),
    }));
    onClose();
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 bg-space-darker/95 backdrop-blur-md border border-space-border w-80 md:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs font-sans animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-space-border flex items-center justify-between bg-space-dark">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-telemetry-cyan" />
          <span className="font-mono font-bold text-white uppercase tracking-wider">
            Module Telemetry & Maintenance
          </span>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="p-1 rounded hover:bg-space-card text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3.5 text-gray-200">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-space-darkest text-cyan-300 border border-cyan-500/20">
              {def.category}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Grid: ({module.x}, {module.y})
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">{def.name}</h3>
        </div>

        {/* Health / Durability Bar */}
        <div className="space-y-1 font-mono">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Durability (Structural Integrity):</span>
            <span className={`font-bold ${
              module.durabilityPct > 70 ? 'text-telemetry-emerald' : module.durabilityPct > 30 ? 'text-telemetry-amber' : 'text-telemetry-rose'
            }`}>
              {module.durabilityPct}%
            </span>
          </div>
          <div className="w-full h-2 rounded bg-space-darkest overflow-hidden border border-space-border/60">
            <div
              className={`h-full transition-all duration-300 ${
                module.durabilityPct > 70 ? 'bg-telemetry-emerald' : module.durabilityPct > 30 ? 'bg-telemetry-amber' : 'bg-telemetry-rose'
              }`}
              style={{ width: `${module.durabilityPct}%` }}
            />
          </div>
        </div>

        {/* Under Construction Notice */}
        {module.isConstructing && (
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center font-bold">
              <span>Construction in Progress:</span>
              <span className="text-yellow-300">{module.constructionProgressPct}%</span>
            </div>
            <p className="text-[10px] text-amber-300/80 font-sans">
              Robotic builders are assembling pressure vessels and thermal radiators.
            </p>
            <button
              onClick={handleSpeedUp}
              className="w-full py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-space-darkest font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Speed-Up ($10k)</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
          <button
            onClick={handleRepair}
            disabled={module.durabilityPct >= 100 || budgetCredits < repairCost}
            className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              module.durabilityPct < 100 && budgetCredits >= repairCost
                ? 'bg-cyan-600 hover:bg-cyan-500 text-space-darkest font-bold cursor-pointer'
                : 'bg-space-dark text-gray-500 cursor-not-allowed border border-space-border/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Repair ($5k)</span>
          </button>

          <button
            onClick={handleDeconstruct}
            className="py-2 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 flex items-center justify-center space-x-1.5 transition cursor-pointer font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove (+${deconstructRefund / 1000}k)</span>
          </button>
        </div>

        {/* Engineer's Panel Link */}
        <button
          onClick={() => {
            sound.playClick();
            setEngineerPanelModuleId(module.moduleId);
          }}
          className="w-full py-2 px-3 rounded-lg bg-space-dark hover:bg-space-card border border-space-border text-cyan-300 flex items-center justify-center space-x-1.5 text-xs font-mono transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Why This Is Real (Formulas & NASA Papers)</span>
        </button>
      </div>
    </div>
  );
};
