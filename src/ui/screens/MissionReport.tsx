import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../audio/soundSynth';
import { translations, getLocalizedLevelTitle } from '../i18n';
import { 
  Trophy, 
  AlertOctagon, 
  Star, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Compass, 
  BookOpen, 
  ExternalLink 
} from 'lucide-react';
import season1Data from '../../data/seasons/season1_moon.json';
import season2Data from '../../data/seasons/season2_mars.json';

export const MissionReport: React.FC = () => {
  const { 
    setScreen, 
    selectedSeasonId,
    selectedLevelNumber, 
    loadLevel, 
    missionReport, 
    locale,
  } = useGameStore();

  const t = translations[locale];
  const seasonData = selectedSeasonId === 2 ? season2Data : season1Data;
  const levelData = seasonData.levels.find(l => l.levelNumber === selectedLevelNumber) || seasonData.levels[0];

  const isVictory = missionReport?.status === 'VICTORY';
  const stars = missionReport?.stars ?? (isVictory ? 3 : 0);
  const totalScore = missionReport?.score ?? (isVictory ? 2350 : 350);
  const scienceEarned = missionReport?.sciencePointsEarned ?? (isVictory ? 150 : 25);
  const crewSafetyScore = missionReport?.crewSafetyScore ?? (isVictory ? 480 : 100);
  const efficiencyScore = missionReport?.efficiencyScore ?? (isVictory ? 420 : 150);

  React.useEffect(() => {
    if (isVictory) {
      sound.playSuccess();
    } else {
      sound.playError();
    }
  }, [isVictory]);

  const handleNextLevel = () => {
    sound.playClick();
    const nextLvl = selectedLevelNumber + 1;
    const maxLvl = selectedSeasonId === 2 ? 1 : 10;
    if (nextLvl <= maxLvl) {
      loadLevel(selectedSeasonId, nextLvl);
    } else {
      setScreen('SEASON_SELECT');
    }
  };

  const handleRetry = () => {
    sound.playClick();
    loadLevel(1, selectedLevelNumber);
  };

  const handleSeasonSelect = () => {
    sound.playClick();
    setScreen('SEASON_SELECT');
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-y-auto p-4 md:p-8 bg-space-darkest text-gray-100 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-6 my-auto">
        {/* Status Header Banner */}
        <div className={`p-6 rounded-2xl border backdrop-blur-xl text-center space-y-3 relative overflow-hidden shadow-2xl ${
          isVictory 
            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/40' 
            : 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/40'
        }`}>
          <div className="flex justify-center">
            {isVictory ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center animate-bounce">
                <Trophy className="w-8 h-8 text-emerald-400" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center animate-pulse">
                <AlertOctagon className="w-8 h-8 text-rose-400" />
              </div>
            )}
          </div>

          <div>
            <span className={`text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${
              isVictory ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40' : 'bg-rose-900/60 text-rose-300 border-rose-500/40'
            }`}>
              {isVictory ? t.statusNominal : t.statusWarning}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 font-sans tracking-tight">
              {isVictory ? t.missionVictory : t.missionDefeat}
            </h1>
            <p className="text-sm text-gray-300 mt-1 font-mono">
              {getLocalizedLevelTitle(selectedSeasonId || 1, levelData.levelNumber, levelData.title, locale)} • {levelData.landingSiteId.replace('_', ' ').toUpperCase()}
            </p>
            {!isVictory && missionReport?.defeatReason && (
              <p className="text-xs text-rose-300 mt-2 font-mono bg-rose-950/80 p-2 rounded border border-rose-500/40 inline-block">
                {t.cause}: {missionReport.defeatReason}
              </p>
            )}
          </div>

          {/* Star Rating Display */}
          {isVictory && (
            <div className="flex justify-center space-x-2 pt-1">
              {[1, 2, 3].map((starNum) => (
                <Star
                  key={starNum}
                  className={`w-7 h-7 transition-all ${
                    starNum <= stars 
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' 
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Telemetry Scoring Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="bg-space-darker p-3.5 rounded-xl border border-space-border flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase">{t.totalScore}</span>
            <div className="text-xl font-bold text-white mt-1">{totalScore}</div>
            <span className="text-[10px] text-cyan-400">{t.flightEvaluation}</span>
          </div>

          <div className="bg-space-darker p-3.5 rounded-xl border border-space-border flex flex-col justify-between">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400 uppercase">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{t.crewSafety}</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              +{crewSafetyScore}
            </div>
            <span className="text-[10px] text-gray-400">HIDH Compliant</span>
          </div>

          <div className="bg-space-darker p-3.5 rounded-xl border border-space-border flex flex-col justify-between">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400 uppercase">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{t.efficiency}</span>
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              +{efficiencyScore}
            </div>
            <span className="text-[10px] text-gray-400">{t.powerAndBudget}</span>
          </div>

          <div className="bg-space-darker p-3.5 rounded-xl border border-space-border flex flex-col justify-between">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400 uppercase">
              <Sparkles className="w-3 h-3 text-telemetry-purple" />
              <span>{t.scienceEarned}</span>
            </div>
            <div className="text-xl font-bold text-purple-300 mt-1">
              +{scienceEarned} SP
            </div>
            <span className="text-[10px] text-purple-400">{t.techUnlocks}</span>
          </div>
        </div>

        {/* Space Weather & Hazard Survival Telemetry (Phase 5) */}
        <div className="bg-space-darker p-4 rounded-xl border border-space-border grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2 rounded bg-space-dark border border-space-border/60">
            <div className="text-[10px] text-gray-400 uppercase">{t.stormsEndured}</div>
            <div className="text-base font-bold text-cyan-300 mt-0.5">
              {missionReport?.hazardsSurvivedCount ?? 0}
            </div>
            <div className="text-[9px] text-gray-500">DONKI SPE / MM</div>
          </div>
          <div className="p-2 rounded bg-space-dark border border-space-border/60">
            <div className="text-[10px] text-gray-400 uppercase">{t.totalRadDose}</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {(missionReport?.cumulativeDoseMSv ?? 0).toFixed(1)} <span className="text-[10px]">mSv</span>
            </div>
            <div className="text-[9px] text-gray-500">&lt;600 mSv Career Limit</div>
          </div>
          <div className="p-2 rounded bg-space-dark border border-space-border/60">
            <div className="text-[10px] text-gray-400 uppercase">Base Repairs</div>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              {missionReport?.repairsPerformedCount ?? 0}
            </div>
            <div className="text-[9px] text-gray-500">Integrity Restored</div>
          </div>
        </div>

        {/* What Was Real Debrief Card */}
        <div className="bg-space-darker p-5 rounded-2xl border border-space-border space-y-3 font-sans">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>{locale === 'bn' ? 'মিশন পর্যালোচনা: বিজ্ঞানের সত্যতা (নাসা গবেষণা)' : 'Mission Debrief: What Was Real (NASA Science)'}</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white font-mono">
              {levelData.realDataReference.title}
            </h3>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
              {levelData.realDataReference.explanation}
            </p>
          </div>

          <div className="border-t border-space-border/80 pt-2.5 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Reference: {levelData.realDataReference.source}</span>
            <span className="text-cyan-400 flex items-center space-x-1">
              <span>NASA Artemis Data</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 font-mono text-xs">
          <button
            onClick={handleSeasonSelect}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-space-dark hover:bg-space-card border border-space-border text-gray-300 hover:text-white transition"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>{t.seasonSelect}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRetry}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-space-dark hover:bg-space-card border border-space-border text-gray-300 hover:text-white transition"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>{t.retryMission}</span>
            </button>

            {isVictory && selectedLevelNumber < (selectedSeasonId === 2 ? 1 : 10) && (
              <button
                onClick={handleNextLevel}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-space-darkest font-bold uppercase shadow-lg shadow-emerald-950/60 transition"
              >
                <span>{t.nextMission} (L{selectedLevelNumber + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
