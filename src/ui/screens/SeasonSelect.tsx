import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { translations, getLocalizedLevelTitle, getLocalizedObjectiveDescription, getLocalizedSeasonTitle } from '../i18n';
import { sound } from '../../audio/soundSynth';
import { ArrowLeft, Lock, ChevronRight, Globe, Star } from 'lucide-react';
import season1Data from '../../data/seasons/season1_moon.json';
import season2Data from '../../data/seasons/season2_mars.json';

interface SeasonSelectProps {
  onSelectLevelBriefing: (levelNumber: number) => void;
}

export const SeasonSelect: React.FC<SeasonSelectProps> = ({ onSelectLevelBriefing }) => {
  const { setScreen, selectedSeasonId, locale, unlockedLevels, levelHighScores } = useGameStore();
  const t = translations[locale];
  const [activeTabSeasonId, setActiveTabSeasonId] = useState<number>(selectedSeasonId || 1);

  const seasonsList = [
    { id: 1, name: "Season 1: Artemis Outpost", target: "The Moon", status: "ACTIVE (Levels 1-5 Playable)", color: "from-blue-500/20 to-cyan-500/20", borderColor: "border-cyan-500/50" },
    { id: 2, name: "Season 2: The Red Frontier", target: "Mars", status: "PLAYABLE PREVIEW", color: "from-red-500/20 to-amber-500/20", borderColor: "border-red-500/30" },
    { id: 3, name: "Season 3: Asteroid Belt", target: "Ceres & Psyche", status: "SCAFFOLDED (Data Cached)", color: "from-purple-500/20 to-pink-500/20", borderColor: "border-purple-500/30" },
    { id: 4, name: "Season 4: Thermal Extremes", target: "Venus & Mercury", status: "SCAFFOLDED (Data Cached)", color: "from-amber-500/20 to-yellow-500/20", borderColor: "border-amber-500/30" },
    { id: 5, name: "Season 5: Ocean Worlds", target: "Europa & Ganymede", status: "SCAFFOLDED (Data Cached)", color: "from-teal-500/20 to-emerald-500/20", borderColor: "border-teal-500/30" },
    { id: 6, name: "Season 6: Methane Seas", target: "Titan & Enceladus", status: "SCAFFOLDED (Data Cached)", color: "from-indigo-500/20 to-blue-500/20", borderColor: "border-indigo-500/30" },
  ];

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-y-auto p-4 md:p-8 bg-space-darkest text-gray-100 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-4 border-b border-space-border">
          <button
            onClick={() => {
              sound.playClick();
              setScreen('MAIN_MENU');
            }}
            className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-cyan-300 font-mono transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
          <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
            NASA EXPEDITION REGISTRY
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {t.seasonSelect}
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            Choose an exploration destination. Each campaign presents real environmental hazards and NASA data.
          </p>
        </div>

        {/* Season Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {seasonsList.map(s => (
            <button
              key={s.id}
              onClick={() => {
                sound.playClick();
                setActiveTabSeasonId(s.id);
              }}
              className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                activeTabSeasonId === s.id
                  ? 'bg-space-card border-cyan-400 shadow-md shadow-cyan-950/50'
                  : 'bg-space-darker/60 border-space-border hover:bg-space-dark text-gray-400'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Season {s.id}</span>
                <div className="font-bold text-xs text-white mt-0.5 truncate">{s.target}</div>
              </div>
              <span className="text-[9px] font-mono mt-2 text-gray-400 truncate">{s.status}</span>
            </button>
          ))}
        </div>

        {/* Active Season Detail & Level Grid */}
        {activeTabSeasonId === 1 ? (
          /* Season 1: Moon */
          <div className="bg-space-darker p-5 rounded-xl border border-space-border space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-space-border/80 pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-telemetry-emerald tracking-wider font-semibold">
                  Artemis Campaign • 10 Levels
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {getLocalizedSeasonTitle(1, season1Data.seasonName, locale)}
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  {season1Data.description}
                </p>
              </div>
            </div>

            {/* Level Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {season1Data.levels.map((lvl) => {
                const isUnlocked = (unlockedLevels || [1]).includes(lvl.levelNumber);
                const highScore = levelHighScores?.[lvl.levelNumber];

                return (
                  <div
                    key={lvl.levelNumber}
                    onClick={() => {
                      if (isUnlocked) {
                        sound.playClick();
                        onSelectLevelBriefing(lvl.levelNumber);
                      } else {
                        sound.playWarning();
                      }
                    }}
                    className={`p-4 rounded-lg border text-left transition relative flex flex-col justify-between ${
                      isUnlocked
                        ? 'bg-space-card hover:bg-space-muted border-cyan-500/40 cursor-pointer hover:border-cyan-400 shadow-sm'
                        : 'bg-space-dark/40 border-space-border/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-darkest text-cyan-300 border border-cyan-500/20">
                          SOL {lvl.missionDurationDays} EXPEDITION
                        </span>
                        {isUnlocked ? (
                          <div className="flex items-center space-x-1.5">
                            {highScore && highScore.stars > 0 && (
                              <div className="flex space-x-0.5">
                                {[1, 2, 3].map(s => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${s <= highScore.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                                  />
                                ))}
                              </div>
                            )}
                            <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{highScore ? 'CLEARED' : 'UNLOCKED'}</span>
                            </span>
                          </div>
                        ) : (
                          <span className="flex items-center space-x-1 text-gray-500 text-[10px] font-mono">
                            <Lock className="w-3 h-3" />
                            <span>LOCKED</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white mt-2 font-sans">
                        {getLocalizedLevelTitle(1, lvl.levelNumber, lvl.title, locale)}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                        {lvl.objectives[0] ? getLocalizedObjectiveDescription(lvl.objectives[0].id, lvl.objectives[0].description, locale) : ''}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-space-border/60 mt-3 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-gray-400">${(lvl.startingBudgetCredits / 1000).toFixed(0)}k {t.budget}</span>
                      {isUnlocked ? (
                        <span className="text-cyan-400 flex items-center space-x-1 font-semibold">
                          <span>{t.briefing}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[10px]">{t.locked}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTabSeasonId === 2 ? (
          /* Season 2: Mars (Playable Level 1 + Scaffolded Levels 2-10) */
          <div className="bg-space-darker p-5 rounded-xl border border-red-500/40 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-space-border/80 pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-red-400 tracking-wider font-semibold">
                  Mars Exploration Campaign • Level 1 Playable (Levels 2-10 Scaffolded)
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {getLocalizedSeasonTitle(2, season2Data.seasonName, locale)}
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  {season2Data.description}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/30">
                  {t.lightLag}: 3.0 to 22.3 min
                </span>
              </div>
            </div>

            {/* Level Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {season2Data.levels.map((lvl) => {
                const isPlayable = lvl.levelNumber === 1;

                return (
                  <div
                    key={lvl.levelNumber}
                    onClick={() => {
                      if (isPlayable) {
                        sound.playClick();
                        useGameStore.setState({ selectedSeasonId: 2 });
                        onSelectLevelBriefing(lvl.levelNumber);
                      } else {
                        sound.playWarning();
                      }
                    }}
                    className={`p-4 rounded-lg border text-left transition relative flex flex-col justify-between ${
                      isPlayable
                        ? 'bg-space-card hover:bg-space-muted border-red-500/50 cursor-pointer hover:border-red-400 shadow-sm'
                        : 'bg-space-dark/40 border-space-border/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-darkest text-red-300 border border-red-500/20">
                          SOL {lvl.missionDurationDays} EXPEDITION
                        </span>
                        {isPlayable ? (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{t.unlocked}</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-gray-500 text-[10px] font-mono">
                            <Lock className="w-3 h-3" />
                            <span>{t.locked}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white mt-2 font-sans">
                        {getLocalizedLevelTitle(2, lvl.levelNumber, lvl.title, locale)}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                        {lvl.objectives[0] ? getLocalizedObjectiveDescription(lvl.objectives[0].id, lvl.objectives[0].description, locale) : ''}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-space-border/60 mt-3 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-gray-400">${(lvl.startingBudgetCredits / 1000).toFixed(0)}k {t.budget}</span>
                      {isPlayable ? (
                        <span className="text-red-400 flex items-center space-x-1 font-semibold">
                          <span>{t.briefing}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[10px]">{t.locked}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Season 3-6 Preview Card */
          <div className="bg-space-darker p-8 rounded-xl border border-space-border text-center space-y-4 max-w-xl mx-auto my-6">
            <Globe className="w-12 h-12 text-telemetry-purple mx-auto animate-pulse" />
            <h2 className="text-xl font-bold text-white">
              {seasonsList.find(s => s.id === activeTabSeasonId)?.name}
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Full data-driven configuration cached in <code className="text-cyan-300">/src/data/seasons</code>. Season 1 (Moon) and Season 2 (Mars) are playable destinations.
            </p>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTabSeasonId(1);
              }}
              className="py-2 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-space-darkest font-bold text-xs uppercase font-mono transition"
            >
              Return to Season 1 (Moon)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
