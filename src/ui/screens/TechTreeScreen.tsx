import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../audio/soundSynth';
import technologiesData from '../../data/technologies.json';
import modulesData from '../../data/modules.json';
import { 
  Atom, 
  CheckCircle2, 
  Lock, 
  ArrowLeft, 
  Sparkles,
  Zap
} from 'lucide-react';

export const TechTreeScreen: React.FC = () => {
  const {
    sciencePoints,
    unlockedTechnologies,
    unlockTechnology,
    setScreen,
  } = useGameStore();

  const handleResearch = (techId: string) => {
    const success = unlockTechnology(techId);
    if (success) {
      sound.playSuccess();
    } else {
      sound.playWarning();
    }
  };

  const tiers = [1, 2, 3];

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-space-darkest via-space-darker to-[#02040a] p-4 md:p-8 text-gray-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-space-border/60 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              sound.playClick();
              setScreen('BASE_BUILDER');
            }}
            className="p-2 rounded-lg bg-space-card hover:bg-space-muted border border-space-border text-gray-300 hover:text-white transition flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-mono">BASE</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <Atom className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl md:text-2xl font-extrabold tracking-wide text-white uppercase font-sans">
                TECHNOLOGY READINESS TREE
              </h1>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              NASA Office of the Chief Technologist (OCT) Taxonomy & TRL Pipeline
            </p>
          </div>
        </div>

        {/* Science Balance Pill */}
        <div className="flex items-center space-x-3 bg-cyan-950/40 border border-cyan-500/40 px-4 py-2 rounded-xl backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
          <div>
            <div className="text-[10px] text-cyan-300/80 font-mono uppercase tracking-wider">AVAILABLE SCIENCE POINTS</div>
            <div className="text-lg md:text-xl font-bold font-mono text-cyan-200">
              {sciencePoints} <span className="text-xs text-cyan-400/80">SP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tech Grid By Tiers */}
      <div className="max-w-6xl w-full mx-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {tiers.map(tier => {
          const techInTier = technologiesData.technologies.filter(t => t.tier === tier);
          return (
            <div key={tier} className="space-y-4 flex flex-col">
              {/* Tier Header */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-space-card/60 border border-space-border/80">
                <span className="text-xs font-bold font-mono text-cyan-300 uppercase">
                  TIER {tier}: {tier === 1 ? 'SURFACE FOUNDATIONS' : tier === 2 ? 'ISRU & SINTERING' : 'NUCLEAR & PROPULSION'}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {techInTier.filter(t => unlockedTechnologies.includes(t.id)).length}/{techInTier.length} RESEARCHED
                </span>
              </div>

              {/* Cards in this Tier */}
              <div className="space-y-4 flex-1">
                {techInTier.map(tech => {
                  const isUnlocked = unlockedTechnologies.includes(tech.id);
                  const prereqsMet = tech.prerequisites.every(p => unlockedTechnologies.includes(p));
                  const canAfford = sciencePoints >= tech.scienceCost;
                  const canResearch = !isUnlocked && prereqsMet && canAfford;

                  // Find module names
                  const unlockedModNames = tech.unlocksModules.map(mid => {
                    const found = modulesData.modules.find(m => m.id === mid);
                    return found?.name || mid;
                  });

                  return (
                    <div
                      key={tech.id}
                      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                        isUnlocked
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                          : prereqsMet
                          ? 'bg-space-card/90 border-space-border hover:border-cyan-500/50 hover:bg-space-muted'
                          : 'bg-space-card/30 border-space-border/40 opacity-60'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Status & TRL Badge */}
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 text-blue-300 font-bold">
                            TRL {tech.trl}
                          </span>
                          {isUnlocked ? (
                            <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ACTIVE</span>
                            </span>
                          ) : !prereqsMet ? (
                            <span className="flex items-center space-x-1 text-gray-500">
                              <Lock className="w-3.5 h-3.5" />
                              <span>LOCKED</span>
                            </span>
                          ) : (
                            <span className="text-cyan-400 font-bold">
                              {tech.scienceCost} SP
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300">
                          {tech.name}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {tech.description}
                        </p>

                        {/* Prerequisites Warning */}
                        {!prereqsMet && tech.prerequisites.length > 0 && (
                          <div className="text-[10px] text-amber-400/80 font-mono bg-amber-950/20 p-1.5 rounded border border-amber-500/20">
                            Requires: {tech.prerequisites.map(p => {
                              const found = technologiesData.technologies.find(t => t.id === p);
                              return found?.name || p;
                            }).join(', ')}
                          </div>
                        )}

                        {/* Unlocks Modules */}
                        <div className="pt-2 border-t border-space-border/40">
                          <div className="text-[10px] text-gray-400 font-mono uppercase mb-1">Unlocks Hardware:</div>
                          <div className="flex flex-wrap gap-1">
                            {unlockedModNames.map(name => (
                              <span
                                key={name}
                                className="text-[10px] px-2 py-0.5 rounded bg-space-dark border border-space-border text-gray-300 font-mono"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4 mt-2">
                        {isUnlocked ? (
                          <div className="w-full py-1.5 text-center text-xs font-mono text-emerald-400 bg-emerald-950/40 rounded border border-emerald-500/30">
                            TECHNOLOGY COMMISSIONED
                          </div>
                        ) : (
                          <button
                            onClick={() => handleResearch(tech.id)}
                            disabled={!canResearch}
                            className={`w-full py-2 px-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition flex items-center justify-center space-x-1.5 ${
                              canResearch
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-space-darkest shadow-md shadow-cyan-500/20'
                                : 'bg-space-dark text-gray-500 border border-space-border/60 cursor-not-allowed'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>
                              {!prereqsMet
                                ? 'PREREQUISITES REQUIRED'
                                : !canAfford
                                ? `NEED ${tech.scienceCost - sciencePoints} MORE SP`
                                : `RESEARCH (${tech.scienceCost} SP)`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
