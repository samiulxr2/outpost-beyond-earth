import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../audio/soundSynth';
import landingSitesData from '../../data/landingSites.json';
import { 
  Target, 
  Sun, 
  TrendingUp, 
  Droplets, 
  ShieldAlert, 
  Check, 
  ArrowLeft, 
  Rocket, 
  BookOpen 
} from 'lucide-react';

export const LandingSiteSelector: React.FC = () => {
  const { setScreen, landingSiteId, loadLevel, selectedSeasonId, selectedLevelNumber } = useGameStore();

  // Filter sites for active campaign body
  const destinationBody = selectedSeasonId === 2 ? 'mars' : 'moon';
  const availableSites = landingSitesData.sites.filter(s => s.bodyId === destinationBody);

  const [selectedSiteId, setSelectedSiteId] = useState<string>(landingSiteId || availableSites[0].id);

  const activeSite = availableSites.find(s => s.id === selectedSiteId) || availableSites[0];

  const handleConfirmLanding = () => {
    sound.playSuccess();
    sound.playThrusterBurn(1.5);
    // Load level with this specific landing site
    loadLevel(selectedSeasonId, selectedLevelNumber);
    // Ensure the chosen landing site id is persisted in store
    useGameStore.setState({ landingSiteId: selectedSiteId });
    setScreen('BASE_BUILDER');
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-y-auto p-4 md:p-8 bg-space-darkest text-gray-100 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-3 border-b border-space-border">
          <button
            onClick={() => {
              sound.playClick();
              setScreen('MISSION_PLANNER');
            }}
            className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-cyan-300 font-mono transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Mission Planner</span>
          </button>
          <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
            LUNAR LANDING SITE SELECTION (LOLA / MOLA)
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Target className="w-6 h-6 text-telemetry-cyan" />
            <span>Candidate Landing Site Selection</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            Choose touchdown coordinates calibrated from Lunar Reconnaissance Orbiter (LOLA) altimetry. Your choice directly alters surface illumination, slope risk, and cryogenic water ice availability.
          </p>
        </div>

        {/* Candidate Sites Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableSites.map((site) => {
            const isSelected = site.id === selectedSiteId;

            return (
              <div
                key={site.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedSiteId(site.id);
                }}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-space-card border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                    : 'bg-space-darker/80 border-space-border hover:bg-space-dark hover:border-space-border/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-darkest text-cyan-300 border border-cyan-500/20">
                      {site.latitudeDeg}&deg; Lat, {site.longitudeDeg}&deg; Lon
                    </span>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-cyan-500 text-space-darkest font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mt-2 font-sans">
                    {site.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {site.missionRelevance}
                  </p>
                </div>

                {/* Metrics Breakdown */}
                <div className="pt-3 border-t border-space-border/60 mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                  <div className="bg-space-darkest/70 p-1.5 rounded">
                    <div className="flex items-center justify-center space-x-1 text-telemetry-amber">
                      <Sun className="w-3 h-3" />
                      <span className="font-bold">{site.illuminationAnnualPct}%</span>
                    </div>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Sunlight</span>
                  </div>

                  <div className="bg-space-darkest/70 p-1.5 rounded">
                    <div className="flex items-center justify-center space-x-1 text-cyan-400">
                      <Droplets className="w-3 h-3" />
                      <span className="font-bold">{site.iceWaterEstimatePct}%</span>
                    </div>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Ice Water</span>
                  </div>

                  <div className="bg-space-darkest/70 p-1.5 rounded">
                    <div className="flex items-center justify-center space-x-1 text-purple-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-bold">{site.slopeMaxDeg}&deg;</span>
                    </div>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Slope</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Site Deep-Dive Telemetry Box */}
        <div className="bg-space-darker p-5 rounded-xl border border-space-border space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-space-border pb-2.5">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Target Site Tactical Assessment
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">{activeSite.name}</h2>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-mono px-3 py-1 rounded bg-space-darkest border border-amber-500/30 text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{activeSite.hazardRating}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-space-dark p-3 rounded-lg border border-space-border/60">
              <span className="text-gray-400 block text-[10px] uppercase font-mono">Solar Illumination</span>
              <span className="text-amber-300 font-bold text-sm font-mono mt-0.5 block">{activeSite.illuminationAnnualPct}% of Annual Sols</span>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                {activeSite.illuminationAnnualPct > 80 
                  ? "Peak of Eternal Light. Low battery requirement; near-continuous solar energy."
                  : activeSite.illuminationAnnualPct === 0 
                    ? "Permanently Shadowed Region (PSR). Zero sunlight! Requires Kilopower nuclear reactor or heavy battery banks."
                    : "Standard lunar night dips require battery energy reserves."}
              </p>
            </div>

            <div className="bg-space-dark p-3 rounded-lg border border-space-border/60">
              <span className="text-gray-400 block text-[10px] uppercase font-mono">Cryogenic Ice Reserves</span>
              <span className="text-cyan-300 font-bold text-sm font-mono mt-0.5 block">{activeSite.iceWaterEstimatePct}% Weight Percentage</span>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                Higher ice content increases thermal drill water yields for ECLSS life support and propellant liquefaction.
              </p>
            </div>

            <div className="bg-space-dark p-3 rounded-lg border border-space-border/60">
              <span className="text-gray-400 block text-[10px] uppercase font-mono">Terrain Slope & Hazards</span>
              <span className="text-purple-300 font-bold text-sm font-mono mt-0.5 block">Max {activeSite.slopeMaxDeg}&deg; Incline (Elev: {activeSite.elevationMeters}m)</span>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                {activeSite.slopeMaxDeg > 10 
                  ? "Steep escarpments require cautious rover traverses and restrict flat building tiles." 
                  : "Smooth plateau enables wide modular base expansion."}
              </p>
            </div>
          </div>

          <div className="bg-space-darkest p-3 rounded-lg border border-space-border/60 text-[11px] text-gray-400 flex items-start space-x-2">
            <BookOpen className="w-4 h-4 text-telemetry-cyan shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-200">NASA Altimeter Reference:</span> {activeSite.instrument} data calibrated with LRO LOLA and Lunar Prospector neutron spectrometry.
            </div>
          </div>
        </div>

        {/* Action Button: Touchdown */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleConfirmLanding}
            className="w-full sm:w-auto py-3 px-8 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-space-darkest font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            <span>Initiate Touchdown & Deploy Outpost Grid</span>
          </button>
        </div>
      </div>
    </div>
  );
};
