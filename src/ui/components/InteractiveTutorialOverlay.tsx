import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../audio/soundSynth';
import { Compass, Lightbulb, ChevronRight, X } from 'lucide-react';
import season1Data from '../../data/seasons/season1_moon.json';

export const InteractiveTutorialOverlay: React.FC = () => {
  const { 
    selectedLevelNumber, 
    tutorialStepIndex, 
    tutorialCompleted,
    currentScreen,
    nextTutorialStep 
  } = useGameStore();

  if (selectedLevelNumber !== 1 || tutorialCompleted || currentScreen === 'MISSION_REPORT' || currentScreen === 'MAIN_MENU' || currentScreen === 'SEASON_SELECT') return null;

  const level1 = season1Data.levels[0];
  const steps = level1.tutorialSteps || [];
  const currentStep = steps[tutorialStepIndex] || steps[0];

  if (!currentStep) return null;

  const totalSteps = steps.length;
  const currentStepNum = tutorialStepIndex + 1;

  const handleDismiss = () => {
    sound.playClick();
    useGameStore.setState({ tutorialCompleted: true });
  };

  const handleNext = () => {
    sound.playSuccess();
    if (currentStepNum >= totalSteps) {
      useGameStore.setState({ tutorialCompleted: true });
    } else {
      nextTutorialStep();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className="bg-space-darker/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 md:p-5 shadow-2xl shadow-cyan-950/60 text-white font-sans space-y-3">
        {/* Step Indicator & Dismiss */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              Flight Director Tutorial • Step {currentStepNum} of {totalSteps}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            title="Skip Tutorial"
            className="text-xs font-mono text-gray-400 hover:text-white flex items-center space-x-1 transition"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title & Instruction */}
        <div>
          <h3 className="text-sm md:text-base font-bold text-white flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>{currentStep.title}</span>
          </h3>
          <p className="text-xs text-gray-200 mt-1.5 leading-relaxed font-sans">
            {currentStep.instruction}
          </p>
        </div>

        {/* Why This Is Real Aerospace Insight Card */}
        {currentStep.whyThisIsReal && (
          <div className="bg-space-darkest/80 border border-emerald-500/30 rounded-xl p-2.5 text-[11px] text-emerald-200/90 space-y-1">
            <div className="flex items-center space-x-1.5 text-telemetry-emerald font-semibold font-mono text-[10px] uppercase">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Why This Is Real (NASA Science)</span>
            </div>
            <p className="text-[11px] text-emerald-300/80 font-sans leading-normal">
              {currentStep.whyThisIsReal}
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex space-x-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`w-5 h-1 rounded-full transition-colors ${
                  idx === tutorialStepIndex ? 'bg-cyan-400' : idx < tutorialStepIndex ? 'bg-emerald-400' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="py-1.5 px-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-space-darkest font-bold text-xs uppercase font-mono flex items-center space-x-1 transition shadow-md"
          >
            <span>{currentStepNum >= totalSteps ? 'Got It' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
