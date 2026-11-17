import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { translations } from '../i18n';
import { sound } from '../../audio/soundSynth';
import { ArrowLeft, ExternalLink, Database, Award } from 'lucide-react';
import creditsData from '../../data/credits.json';

export const DataCreditsModal: React.FC = () => {
  const { setScreen, locale } = useGameStore();
  const t = translations[locale];

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-y-auto p-4 md:p-8 bg-space-darkest text-gray-100 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full space-y-6">
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
            OPEN SCIENCE & DATA ATTRIBUTION
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <Award className="w-6 h-6 text-telemetry-cyan" />
            <span>NASA Data Sources & Citations</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            Built for the NASA International Space Apps Challenge 2027. All datasets are cached locally for offline accessibility.
          </p>
        </div>

        {/* Citation Cards */}
        <div className="space-y-3">
          {creditsData.credits.map((c, i) => (
            <div
              key={i}
              className="p-4 bg-space-darker rounded-xl border border-space-border/80 hover:border-cyan-500/40 transition space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-cyan-300">{c.role}</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-telemetry-cyan hover:underline text-[11px] font-mono"
                >
                  <span>NASA Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-gray-200 font-semibold">{c.source}</div>
              <p className="text-gray-400 font-mono text-[11px] bg-space-darkest p-2 rounded border border-space-border/60">
                {c.citation}
              </p>
            </div>
          ))}
        </div>

        {/* Technical Registry Info */}
        <div className="bg-space-darker p-4 rounded-xl border border-space-border flex items-start space-x-3 text-xs text-gray-400">
          <Database className="w-5 h-5 text-telemetry-emerald shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white font-mono text-xs uppercase">
              Offline Data Registry Integrity
            </div>
            <p className="leading-relaxed">
              Every data file in <code className="text-cyan-300">/src/data</code> contains standardized provenance attributes including <code className="text-emerald-300">dataOrigin: "factsheet-manual"</code>, <code className="text-emerald-300">retrievedOn: "2026-11-17"</code>, and SI units. See <code className="text-cyan-300">DATA_SOURCES.md</code> in the repository root for the full mapping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
