import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { 
  Zap, 
  Wind, 
  Droplets, 
  Utensils, 
  Mountain, 
  Fuel, 
  Coins, 
  HardHat, 
  Sun, 
  Moon, 
  AlertTriangle,
  Radio,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

export const ResourceBarHUD: React.FC = () => {
  const {
    powerGeneratedWatts,
    powerConsumedWatts,
    netPowerWatts,
    powerStoredKWh,
    maxPowerStorageKWh,
    oxygenKg,
    waterKg,
    foodDaysRemaining,
    regolithOreKg,
    propellantKg,
    budgetCredits,
    placedModules,
    missionElapsedSeconds,
    landingSiteId,
    setEngineerPanelModuleId,
    cumulativeRadiationDoseMSv,
    hourlyDoseRateMSv,
    activeHazards,
    crewSheltered,
    toggleCrewShelter,
    regolithBermThicknessCm,
    buildRegolithBerm,
  } = useGameStore();

  // Active builders count
  const constructingModules = placedModules.filter(m => m.isConstructing);
  const activeBuilders = constructingModules.length;
  const maxBuilders = 2; // Clash-of-Clans style builder capacity

  // Battery drain / reserve hours
  const netPowerKW = netPowerWatts / 1000;
  const isDraining = netPowerKW < 0;
  const batteryReserveHours = isDraining 
    ? (powerStoredKWh / Math.abs(netPowerKW))
    : Infinity;

  // Day/Night status
  const missionHours = missionElapsedSeconds / 3600;
  const isShackleton = landingSiteId.includes('shackleton');
  const isHaworth = landingSiteId.includes('haworth');

  let isDaylight = true;
  let statusText = "☀ DAYLIGHT: Continuous Polar Sun";
  let statusSubtext = "Solar generation nominal (>90% illumination)";

  if (isHaworth) {
    isDaylight = false;
    statusText = "🌙 PERMANENT SHADOW (Cold Trap)";
    statusSubtext = "Zero sunlight (40K). Relying 100% on battery / nuclear power";
  } else if (isShackleton) {
    const dipCycleHours = 120;
    const cyclePhase = (missionHours % dipCycleHours) / dipCycleHours;
    const isDip = cyclePhase > 0.88;
    const hoursToDip = Math.max(1, Math.round((0.88 - cyclePhase) * dipCycleHours));
    if (isDip) {
      isDaylight = false;
      statusText = "🌙 PEAK SHADOW DIP";
      statusSubtext = "Temporary crater rim eclipse. Batteries active";
    } else {
      statusText = "☀ PEAK OF ETERNAL LIGHT";
      statusSubtext = `Next shadow dip in ${hoursToDip} hours`;
    }
  } else {
    // Standard lunar night
    const lunarDayHours = 708.7;
    const hourInCycle = missionHours % lunarDayHours;
    const isDay = hourInCycle < 354.35;
    isDaylight = isDay;
    if (isDay) {
      const hoursToNight = Math.round(354.35 - hourInCycle);
      statusText = "☀ LUNAR DAY";
      statusSubtext = `14-day night begins in ${hoursToNight} hours`;
    } else {
      const hoursToSunrise = Math.round(lunarDayHours - hourInCycle);
      statusText = "🌙 14-DAY LUNAR NIGHT IN PROGRESS";
      statusSubtext = `Solar output 0%. ${hoursToSunrise} hours to sunrise`;
    }
  }

  return (
    <div className="w-full bg-space-darker/95 backdrop-blur-md border-b border-space-border px-4 py-2 text-xs font-mono select-none space-y-1.5 z-20">
      {/* Upper Telemetry Bar: All 7 Resources + Builders */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Power */}
        <div 
          onClick={() => setEngineerPanelModuleId('resource_power')}
          title="Click to view Electrical & Battery Physics in Engineer's Panel"
          className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80 cursor-pointer hover:border-cyan-500/50 hover:bg-space-dark/80 transition"
        >
          <Zap className={`w-3.5 h-3.5 ${isDraining ? 'text-telemetry-rose' : 'text-telemetry-cyan'}`} />
          <div>
            <span className="text-gray-400">PWR: </span>
            <span className={`font-bold ${netPowerKW >= 0 ? 'text-telemetry-cyan' : 'text-telemetry-rose'}`}>
              {(powerGeneratedWatts / 1000).toFixed(1)} / {(powerConsumedWatts / 1000).toFixed(1)} kW
            </span>
            <span className="text-gray-400 text-[10px] ml-1.5">
              ({powerStoredKWh.toFixed(1)}/{maxPowerStorageKWh} kWh)
            </span>
          </div>
        </div>

        {/* Oxygen */}
        <div 
          onClick={() => setEngineerPanelModuleId('eclss_life_support')}
          title="Click to view NASA HIDH Oxygen consumption in Engineer's Panel"
          className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80 cursor-pointer hover:border-blue-500/50 hover:bg-space-dark/80 transition"
        >
          <Wind className="w-3.5 h-3.5 text-blue-400" />
          <div>
            <span className="text-gray-400">O&sup2;: </span>
            <span className="text-white font-bold">{oxygenKg.toFixed(1)} kg</span>
          </div>
        </div>

        {/* Water */}
        <div 
          onClick={() => setEngineerPanelModuleId('thermal_ice_drill_plant')}
          title="Click to view Water Ice Extraction Physics in Engineer's Panel"
          className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80 cursor-pointer hover:border-cyan-500/50 hover:bg-space-dark/80 transition"
        >
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          <div>
            <span className="text-gray-400">H&sup2;O: </span>
            <span className="text-white font-bold">{waterKg.toFixed(1)} kg</span>
          </div>
        </div>

        {/* Food */}
        <div className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80">
          <Utensils className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <span className="text-gray-400">FOOD: </span>
            <span className="text-white font-bold">{foodDaysRemaining.toFixed(0)} Sols</span>
          </div>
        </div>

        {/* Regolith */}
        <div className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80">
          <Mountain className="w-3.5 h-3.5 text-stone-400" />
          <div>
            <span className="text-gray-400">REGOLITH: </span>
            <span className="text-white font-bold">{regolithOreKg} kg</span>
          </div>
        </div>

        {/* Propellant */}
        <div className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80">
          <Fuel className="w-3.5 h-3.5 text-purple-400" />
          <div>
            <span className="text-gray-400">LOX/LH2: </span>
            <span className="text-white font-bold">{propellantKg.toLocaleString()} kg</span>
          </div>
        </div>

        {/* Budget Credits */}
        <div className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80">
          <Coins className="w-3.5 h-3.5 text-telemetry-amber" />
          <div>
            <span className="text-gray-400">BUDGET: </span>
            <span className="text-telemetry-amber font-bold">${(budgetCredits / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Builder Drones (CoC-style Builder Limit) */}
        <div className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80">
          <HardHat className="w-3.5 h-3.5 text-yellow-400" />
          <div>
            <span className="text-gray-400">BUILDERS: </span>
            <span className="text-yellow-400 font-bold">{activeBuilders}/{maxBuilders} Active</span>
          </div>
        </div>

        {/* Radiation Dosimetry Pill (Phase 5) */}
        <div 
          onClick={() => setEngineerPanelModuleId('radiation_protection')}
          title="NASA Astronaut Radiation Dosimetry (Click for SRAG career limits & shielding)"
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border cursor-pointer transition font-mono ${
            cumulativeRadiationDoseMSv > 150 
              ? 'bg-red-950/70 border-red-500 text-red-200 animate-pulse' 
              : cumulativeRadiationDoseMSv > 25 
              ? 'bg-amber-950/60 border-amber-500 text-amber-200' 
              : 'bg-space-darkest border-space-border/80 text-gray-300 hover:border-cyan-500/50'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${cumulativeRadiationDoseMSv > 25 ? 'text-red-400 animate-spin-slow' : 'text-purple-400'}`} />
          <div>
            <span className="text-gray-400">RAD: </span>
            <span className="font-bold">{cumulativeRadiationDoseMSv.toFixed(1)} mSv</span>
            <span className="text-[9px] text-gray-400 ml-1">({(hourlyDoseRateMSv * 1000).toFixed(0)} μSv/h)</span>
          </div>
        </div>
      </div>

      {/* Lower Environmental Warning / Day-Night Banner */}
      <div 
        onClick={() => setEngineerPanelModuleId('resource_illumination')}
        title="Click to view Solar Illumination & Day/Night physics in Engineer's Panel"
        className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-space-dark/80 hover:bg-space-dark px-3 py-1 rounded border border-space-border/60 hover:border-cyan-500/40 cursor-pointer transition"
      >
        <div className="flex items-center space-x-2">
          {isDaylight ? (
            <Sun className="w-3.5 h-3.5 text-telemetry-amber animate-spin-slow" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className={`font-bold ${isDaylight ? 'text-amber-300' : 'text-cyan-300'}`}>
            {statusText}
          </span>
          <span className="text-gray-400 hidden sm:inline">&bull; {statusSubtext}</span>
        </div>

        {/* Battery Reserve Depletion Readout */}
        <div className="flex items-center space-x-2 font-mono">
          {isDraining ? (
            <span className={`flex items-center space-x-1 font-bold ${
              batteryReserveHours < 24 ? 'text-telemetry-rose animate-pulse' : 'text-telemetry-amber'
            }`}>
              <AlertTriangle className="w-3 h-3" />
              <span>
                Power Reserve: {batteryReserveHours === Infinity ? 'Infinite' : `${batteryReserveHours.toFixed(1)} h`}
              </span>
            </span>
          ) : (
            <span className="text-telemetry-emerald flex items-center space-x-1">
              <span>Power Net Positive (+{(netPowerWatts / 1000).toFixed(1)} kW)</span>
            </span>
          )}
        </div>
      </div>

      {/* Space Weather & Environmental Hazards Early Warning Banner (Phase 5) */}
      {activeHazards.length > 0 && (
        <div className="space-y-1">
          {activeHazards.map(h => {
            const isWarning = h.status === 'WARNING';
            const remainingHours = isWarning 
              ? (h.warningTimeRemainingSeconds / 3600).toFixed(1)
              : (h.durationRemainingSeconds / 3600).toFixed(1);

            return (
              <div 
                key={h.instanceId}
                className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border font-mono text-xs transition animate-in fade-in ${
                  isWarning 
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' 
                    : 'bg-red-950/60 border-red-500/70 text-red-100 animate-pulse'
                }`}
              >
                <div 
                  onClick={() => setEngineerPanelModuleId('radiation_protection')}
                  title="Click to view SPE physics, DONKI telemetry, and HVL shielding in Engineer's Panel"
                  className="flex items-center space-x-2 cursor-pointer hover:underline"
                >
                  {isWarning ? (
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Radio className="w-4 h-4 text-red-400 shrink-0 animate-spin-slow" />
                  )}
                  <div>
                    <span className="font-bold uppercase tracking-wider">
                      {isWarning ? '⚠️ EARLY WARNING: ' : '🚨 ACTIVE HAZARD: '}
                    </span>
                    <span className="font-sans font-bold">{h.name}</span>
                    <span className="text-[11px] text-gray-300 ml-2">
                      {isWarning ? `[Shock Arrival in ${remainingHours}h]` : `[Duration Remaining: ${remainingHours}h]`}
                    </span>
                    <span className="text-[10px] text-cyan-300 ml-2 font-mono underline">
                      [Engineer's Telemetry]
                    </span>
                  </div>
                </div>

                {/* Mitigation Controls */}
                <div className="flex items-center space-x-2">
                  {/* Regolith Berm Status */}
                  <div className="text-[10px] text-gray-300 hidden md:block">
                    Berm Shielding: <span className="text-cyan-300 font-bold">{regolithBermThicknessCm} cm</span>
                  </div>

                  {/* Build Berm Shortcut (if printer exists) */}
                  {placedModules.some(m => m.moduleId === 'regolith_sintering_printer') && (
                    <button
                      onClick={() => buildRegolithBerm(18)}
                      title="Sinter 18 cm regolith berm using 3D printer (Costs 180kg ore + $25k credits)"
                      className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-[10px] font-bold uppercase transition"
                    >
                      + Sinter Berm (+18cm)
                    </button>
                  )}

                  {/* Crew Shelter Toggle */}
                  <button
                    onClick={toggleCrewShelter}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition flex items-center space-x-1 ${
                      crewSheltered
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-red-600 hover:bg-red-500 text-white animate-bounce'
                    }`}
                  >
                    {crewSheltered ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>SHELTERED IN BUNKER</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>SEEK RADIATION SHELTER</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
