import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../audio/soundSynth';
import modulesData from '../../data/modules.json';
import technologiesData from '../../data/technologies.json';
import season1Data from '../../data/seasons/season1_moon.json';
import { 
  Hammer, 
  X, 
  Info,
  Lock
} from 'lucide-react';

export const ModuleBuildMenu: React.FC = () => {
  const {
    selectedModuleIdForBuild,
    selectModuleForBuild,
    budgetCredits,
    placedModules,
    setEngineerPanelModuleId,
    selectedLevelNumber,
    unlockedTechnologies,
    setScreen,
    locale,
  } = useGameStore();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Power', 'Habitation', 'LifeSupport', 'ISRU', 'Logistics'];

  const currentLevel = season1Data.levels.find(l => l.levelNumber === selectedLevelNumber);
  const levelModules = currentLevel?.availableModules || [];

  const techUnlockedModules = new Set<string>();
  technologiesData.technologies.forEach(tech => {
    if (unlockedTechnologies.includes(tech.id)) {
      tech.unlocksModules.forEach(mid => techUnlockedModules.add(mid));
    }
  });

  const isModuleUnlocked = (moduleId: string) => {
    return levelModules.includes(moduleId) || techUnlockedModules.has(moduleId);
  };

  const filteredModules = modulesData.modules.filter(m => 
    activeCategory === 'All' ? true : m.category.toLowerCase() === activeCategory.toLowerCase()
  );

  const activeBuilders = placedModules.filter(m => m.isConstructing).length;
  const maxBuilders = 2;

  const handleSelectModule = (moduleId: string) => {
    sound.playClick();
    selectModuleForBuild(moduleId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Bottom Build Menu Button & Placement Indicator */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2">
        {selectedModuleIdForBuild ? (
          <div className="flex items-center space-x-2 bg-cyan-950/90 border border-cyan-400 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md animate-bounce">
            <Hammer className="w-4 h-4 text-cyan-300" />
            <span className="text-xs font-mono font-bold text-white">
              {locale === 'bn' ? 'নির্মাণ করতে টালিতে ক্লিক করুন: ' : 'CLICK TILE TO CONSTRUCT: '}
              {modulesData.modules.find(m => m.id === selectedModuleIdForBuild)?.name}
            </span>
            <button
              onClick={() => {
                sound.playClick();
                selectModuleForBuild(null);
              }}
              className="p-1 rounded-full bg-space-dark hover:bg-space-card text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              sound.playClick();
              setIsOpen(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-space-darkest font-extrabold text-xs uppercase font-mono tracking-wider shadow-xl shadow-cyan-500/25 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Hammer className="w-4 h-4" />
            <span>{locale === 'bn' ? 'বিল্ড ক্যাটালগ [B]' : 'Open Build Catalog [B]'}</span>
          </button>
        )}
      </div>

      {/* Slide-Up Build Catalog Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end justify-center p-2 sm:p-4">
          <div className="bg-space-darker border border-space-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-space-border flex items-center justify-between bg-space-dark">
              <div className="flex items-center space-x-2">
                <Hammer className="w-4 h-4 text-telemetry-cyan" />
                <h2 className="font-bold text-sm tracking-wide text-white font-mono uppercase">
                  Artemis Surface Module Catalog
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-darkest text-yellow-400 border border-yellow-500/30">
                  Builders: {activeBuilders}/{maxBuilders} Active
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded hover:bg-space-card text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="px-4 py-2 border-b border-space-border/60 flex items-center space-x-2 overflow-x-auto bg-space-darkest/50">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    sound.playClick();
                    setActiveCategory(cat);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                    activeCategory === cat
                      ? 'bg-cyan-500 text-space-darkest font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-space-card'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Module Cards Grid */}
            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredModules.map(mod => {
                const unlocked = isModuleUnlocked(mod.id);
                const canAfford = budgetCredits >= mod.costCredits;

                return (
                  <div
                    key={mod.id}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      !unlocked
                        ? 'bg-space-dark/20 border-space-border/30 opacity-50'
                        : canAfford
                        ? 'bg-space-card hover:bg-space-muted border-space-border hover:border-cyan-400'
                        : 'bg-space-dark/40 border-space-border/50 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-space-darkest text-cyan-300 border border-cyan-500/20">
                          {mod.category}
                        </span>
                        <span className="font-mono text-xs font-bold text-telemetry-amber">
                          ${(mod.costCredits / 1000).toFixed(0)}k
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-2 font-sans">{mod.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {mod.whyThisIsReal}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-space-border/60 mt-3 space-y-2">
                      {/* Telemetry specs */}
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-gray-400">
                        <div>
                          Power: {mod.powerGenerationWatts ? (
                            <span className="text-telemetry-cyan font-bold">+{(mod.powerGenerationWatts / 1000).toFixed(1)} kW</span>
                          ) : (
                            <span className="text-telemetry-rose">-{(mod.powerConsumptionWatts / 1000).toFixed(1)} kW</span>
                          )}
                        </div>
                        <div>
                          Build: <span className="text-white font-bold">{mod.constructionTimeHours} h</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        {!unlocked ? (
                          <button
                            onClick={() => {
                              sound.playClick();
                              setIsOpen(false);
                              setScreen('TECH_TREE');
                            }}
                            title="Unlock this technology using Science Points in the Tech Tree"
                            className="flex-1 py-1.5 px-3 rounded-lg text-[11px] font-mono font-bold uppercase transition bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 flex items-center justify-center space-x-1"
                          >
                            <Lock className="w-3 h-3 text-purple-400" />
                            <span>{locale === 'bn' ? 'টেক ট্রিতে আনলক করুন' : 'Unlock in Tech Tree'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectModule(mod.id)}
                            disabled={!canAfford}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition ${
                              canAfford
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-space-darkest cursor-pointer'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? (locale === 'bn' ? 'নির্মাণ' : 'Construct') : (locale === 'bn' ? 'তহবিল নেই' : 'Need Funds')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            sound.playClick();
                            setEngineerPanelModuleId(mod.id);
                          }}
                          title="View NASA Science & Formulas"
                          className="p-1.5 rounded-lg bg-space-dark hover:bg-space-darkest border border-space-border text-gray-400 hover:text-cyan-300"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
