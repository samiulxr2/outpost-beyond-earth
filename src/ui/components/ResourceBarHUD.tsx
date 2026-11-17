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
  AlertTriangle 
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
        <div className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80">
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
        <div className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80">
          <Wind className="w-3.5 h-3.5 text-blue-400" />
          <div>
            <span className="text-gray-400">O&sup2;: </span>
            <span className="text-white font-bold">{oxygenKg.toFixed(1)} kg</span>
          </div>
        </div>

        {/* Water */}
        <div className="flex items-center space-x-1.5 bg-space-darkest px-2.5 py-1 rounded border border-space-border/80">
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
      </div>

      {/* Lower Environmental Warning / Day-Night Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-space-dark/80 px-3 py-1 rounded border border-space-border/60">
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
    </div>
  );
};
