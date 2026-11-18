import React from 'react';
import { sound } from '../../audio/soundSynth';
import { useGameStore } from '../../store/useGameStore';
import { translations } from '../i18n';
import { X, Rocket, Target, CheckCircle2, BookOpen, Sparkles } from 'lucide-react';
import season1Data from '../../data/seasons/season1_moon.json';
import season2Data from '../../data/seasons/season2_mars.json';

interface LevelBriefingModalProps {
  levelNumber: number;
  onClose: () => void;
  onProceedToPlanner: () => void;
}

export const LevelBriefingModal: React.FC<LevelBriefingModalProps> = ({
  levelNumber,
  onClose,
  onProceedToPlanner,
}) => {
  const { selectedSeasonId, locale } = useGameStore();
  const t = translations[locale];
  const seasonData = selectedSeasonId === 2 ? season2Data : season1Data;
  const level = seasonData.levels.find(l => l.levelNumber === levelNumber) || seasonData.levels[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-space-darker border border-space-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-space-border flex items-center justify-between bg-space-dark">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              NASA MISSION DIRECTIVE
            </span>
            <span className="text-xs font-mono text-gray-400">ARTEMIS BASE CAMP</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded hover:bg-space-card text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-sans text-gray-200 overflow-y-auto max-h-[75vh]">
          <div>
            <h2 className="text-xl font-bold text-white font-sans">{level.title}</h2>
            <div className="flex items-center space-x-3 mt-1 text-gray-400 font-mono text-[11px]">
              <span className="flex items-center space-x-1">
                <Target className="w-3.5 h-3.5 text-telemetry-cyan" />
                <span>Shackleton Crater Rim (89.9&deg;S)</span>
              </span>
              <span>&bull;</span>
              <span>Duration: {level.missionDurationDays} Days</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-semibold">${(level.startingBudgetCredits / 1000).toFixed(0)}k Budget</span>
            </div>
          </div>

          {/* Mission Objectives */}
          <div className="bg-space-darkest p-3.5 rounded-lg border border-space-border/80 space-y-2">
            <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold tracking-wider">
              Primary Flight Objectives
            </div>
            <ul className="space-y-2">
              {level.objectives.map((obj, i) => (
                <li key={i} className="flex items-start space-x-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-telemetry-emerald shrink-0 mt-0.5" />
                  <span className="text-gray-300 leading-snug">{obj.description}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* NASA Science Reference */}
          {level.realDataReference && (
            <div className="bg-space-dark/80 p-3.5 rounded-lg border border-space-border space-y-1.5">
              <div className="flex items-center space-x-1.5 text-telemetry-cyan font-semibold text-[11px]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t.whyThisIsReal}: {level.realDataReference.title}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {level.realDataReference.explanation}
              </p>
              <div className="text-[10px] text-gray-500 font-mono pt-1">
                Source: {level.realDataReference.source}
              </div>
            </div>
          )}

          {/* Flight Dynamics Guidance */}
          <div className="bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/20 text-cyan-300/90 text-[11px] space-y-1">
            <div className="font-semibold flex items-center space-x-1 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1: Mission Trajectory Planner</span>
            </div>
            <p className="text-gray-400">
              Before landing, calculate payload mass vs rocket propellant using the Tsiolkovsky equation and verify translunar injection &Delta;v.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-space-border bg-space-dark flex items-center justify-between">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="text-xs text-gray-400 hover:text-white font-mono px-3 py-2"
          >
            {t.back}
          </button>

          <button
            onClick={() => {
              sound.playSuccess();
              onProceedToPlanner();
            }}
            className="py-2.5 px-5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-space-darkest font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition"
          >
            <Rocket className="w-4 h-4" />
            <span>{t.missionPlanner}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
