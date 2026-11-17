import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { translations } from '../i18n';
import { sound } from '../../audio/soundSynth';
import { SolarSystemMap } from '../../scenes/three/SolarSystemMap';
import { 
  calculateHohmannTransfer, 
  calculateLunarTransfer, 
  tsiolkovskyDeltaV, 
  calculateRequiredPropellant 
} from '../../core/physics';
import rocketsData from '../../data/rockets.json';
import { 
  Rocket, 
  Target, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles,
  Zap
} from 'lucide-react';

export const MissionPlanner: React.FC = () => {
  const { setScreen, loadLevel, selectedSeasonId, selectedLevelNumber, locale, setEngineerPanelModuleId } = useGameStore();
  const t = translations[locale];

  // Configurable Flight Parameters
  const [destinationId, setDestinationId] = useState<'moon' | 'mars'>(selectedSeasonId === 2 ? 'mars' : 'moon');
  const [selectedRocketId, setSelectedRocketId] = useState<string>(rocketsData.rockets[0].id);
  const [payloadMassKg, setPayloadMassKg] = useState<number>(15000); // 15 metric tons
  const [launchDate, setLaunchDate] = useState<string>("2027-10-02");
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  // Selected Rocket Definition
  const rocket = useMemo(() => {
    return rocketsData.rockets.find(r => r.id === selectedRocketId) || rocketsData.rockets[0];
  }, [selectedRocketId]);

  // Upper Stage properties used for Trans-Injection Burn
  const upperStage = rocket.stages[rocket.stages.length - 1];

  // Real Physics Calculations
  const physicsResult = useMemo(() => {
    if (destinationId === 'moon') {
      const lunar = calculateLunarTransfer(300); // from 300 km LEO
      const requiredDeltaVMs = (lunar.tliDeltaVKmS + 2.50) * 1000; // TLI + lunar orbit insertion & descent
      const maxRatedPayloadKg = rocket.maxPayloadToTLIKg;

      // Rocket Equation: dv = Isp * g0 * ln(m0 / mf)
      const m0 = upperStage.dryMassKg + upperStage.propellantMassKg + payloadMassKg;
      const mf = upperStage.dryMassKg + payloadMassKg;
      const availableDeltaVMs = tsiolkovskyDeltaV(upperStage.ispVacuumS, m0, mf);

      // Usable fuel needed
      const fuelNeededKg = calculateRequiredPropellant(
        upperStage.ispVacuumS,
        requiredDeltaVMs,
        upperStage.dryMassKg,
        payloadMassKg
      );

      const passPayload = payloadMassKg <= maxRatedPayloadKg;
      const passDeltaV = availableDeltaVMs >= requiredDeltaVMs;
      const isPass = passPayload && passDeltaV;

      return {
        destinationName: "The Moon (Shackleton Rim)",
        transferTimeDays: 3.5,
        requiredDeltaVKmS: requiredDeltaVMs / 1000,
        availableDeltaVKmS: availableDeltaVMs / 1000,
        maxRatedPayloadKg,
        fuelNeededKg: Math.round(fuelNeededKg),
        propellantCapacityKg: upperStage.propellantMassKg,
        isPass,
        passPayload,
        passDeltaV,
        failureReason: !passPayload 
          ? `Payload exceeds maximum rated TLI capacity (${maxRatedPayloadKg.toLocaleString()} kg)` 
          : !passDeltaV 
            ? `Delta-V deficit of ${Math.round(requiredDeltaVMs - availableDeltaVMs)} m/s` 
            : null,
      };
    } else {
      // Mars Hohmann Transfer
      const marsTransfer = calculateHohmannTransfer(1.0, 1.52368, "Earth", "Mars", 300);
      const requiredDeltaVMs = (marsTransfer.transInjectionDeltaVKmS + 2.0) * 1000;
      const maxRatedPayloadKg = rocket.maxPayloadToTMIKg;

      const m0 = upperStage.dryMassKg + upperStage.propellantMassKg + payloadMassKg;
      const mf = upperStage.dryMassKg + payloadMassKg;
      const availableDeltaVMs = tsiolkovskyDeltaV(upperStage.ispVacuumS, m0, mf);

      const fuelNeededKg = calculateRequiredPropellant(
        upperStage.ispVacuumS,
        requiredDeltaVMs,
        upperStage.dryMassKg,
        payloadMassKg
      );

      const passPayload = payloadMassKg <= maxRatedPayloadKg;
      const passDeltaV = availableDeltaVMs >= requiredDeltaVMs;
      const isPass = passPayload && passDeltaV;

      return {
        destinationName: "Mars (Jezero Crater)",
        transferTimeDays: Math.round(marsTransfer.transferTimeDays),
        requiredDeltaVKmS: requiredDeltaVMs / 1000,
        availableDeltaVKmS: availableDeltaVMs / 1000,
        maxRatedPayloadKg,
        fuelNeededKg: Math.round(fuelNeededKg),
        propellantCapacityKg: upperStage.propellantMassKg,
        isPass,
        passPayload,
        passDeltaV,
        failureReason: !passPayload 
          ? `Payload exceeds maximum rated TMI capacity (${maxRatedPayloadKg.toLocaleString()} kg)` 
          : !passDeltaV 
            ? `Delta-V deficit of ${Math.round(requiredDeltaVMs - availableDeltaVMs)} m/s` 
            : null,
      };
    }
  }, [destinationId, rocket, upperStage, payloadMassKg]);

  const handleLaunch = () => {
    if (!physicsResult.isPass) {
      sound.playWarning();
      return;
    }
    sound.playSuccess();
    sound.playThrusterBurn(2.0);
    setIsLaunching(true);

    setTimeout(() => {
      // Transition to surface base builder for Season 1 Level 1
      loadLevel(selectedSeasonId, selectedLevelNumber);
    }, 1800);
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden relative bg-space-darkest text-gray-100">
      {/* Left / Top: Interactive 3D Orbit Map */}
      <div className="flex-1 h-[45vh] md:h-full relative border-b md:border-b-0 md:border-r border-space-border">
        <SolarSystemMap targetBodyId={destinationId} />

        {/* Orbit Telemetry Floating Tag */}
        <div className="absolute top-4 left-4 bg-space-darker/85 backdrop-blur-md border border-space-border p-3 rounded-lg shadow-lg max-w-xs font-mono text-xs select-none">
          <div className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
            <Target className="w-3.5 h-3.5 text-telemetry-cyan" />
            <span>Target Body Telemetry</span>
          </div>
          <div className="font-bold text-sm text-cyan-300 mt-1">{physicsResult.destinationName}</div>
          <div className="text-[11px] text-gray-400 mt-1 flex justify-between">
            <span>Transfer Duration:</span>
            <span className="text-white font-semibold">{physicsResult.transferTimeDays} Days</span>
          </div>
          <div className="text-[11px] text-gray-400 flex justify-between">
            <span>Trajectory Arc:</span>
            <span className="text-telemetry-emerald font-semibold">Keplerian Hohmann</span>
          </div>
        </div>
      </div>

      {/* Right: Mission Planner Parameters & Flight Dynamics */}
      <div className="w-full md:w-[460px] lg:w-[500px] h-[55vh] md:h-full overflow-y-auto p-4 md:p-6 bg-space-darker/95 backdrop-blur-sm flex flex-col justify-between space-y-4">
        {/* Navigation & Title */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-space-border">
            <button
              onClick={() => {
                sound.playClick();
                setScreen('SEASON_SELECT');
              }}
              className="flex items-center space-x-1 text-xs text-gray-400 hover:text-cyan-300 font-mono transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.back}</span>
            </button>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              NASA FDO FLIGHT CONSOLE
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white mt-3 flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-telemetry-cyan" />
            <span>{t.missionPlanner}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure rocket staging, balance payload mass, and verify delta-V margins before translunar injection.
          </p>
        </div>

        {/* Configuration Controls */}
        <div className="space-y-4 font-sans text-xs flex-1">
          {/* Destination Selector */}
          <div>
            <label className="block text-gray-300 font-medium mb-1.5 flex items-center space-x-1">
              <Target className="w-3.5 h-3.5 text-telemetry-cyan" />
              <span>{t.destination}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setDestinationId('moon');
                }}
                className={`p-2.5 rounded-lg border text-left transition ${
                  destinationId === 'moon'
                    ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200'
                    : 'bg-space-dark border-space-border text-gray-400 hover:bg-space-card'
                }`}
              >
                <div className="font-bold text-xs">The Moon (Artemis)</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Shackleton Crater • 3.5 Days</div>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setDestinationId('mars');
                }}
                className={`p-2.5 rounded-lg border text-left transition ${
                  destinationId === 'mars'
                    ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200'
                    : 'bg-space-dark border-space-border text-gray-400 hover:bg-space-card'
                }`}
              >
                <div className="font-bold text-xs">Mars (Jezero Crater)</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Hohmann Transfer • 259 Days</div>
              </button>
            </div>
          </div>

          {/* Rocket Launch Vehicle Selector */}
          <div>
            <label className="block text-gray-300 font-medium mb-1.5 flex items-center space-x-1">
              <Rocket className="w-3.5 h-3.5 text-telemetry-amber" />
              <span>{t.rocket}</span>
            </label>
            <select
              value={selectedRocketId}
              onChange={(e) => {
                sound.playClick();
                setSelectedRocketId(e.target.value);
              }}
              className="w-full bg-space-dark border border-space-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              {rocketsData.rockets.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.agency}) - {r.stages[r.stages.length - 1].ispVacuumS}s Isp Vac
                </option>
              ))}
            </select>
            <div className="text-[11px] text-gray-400 mt-1 italic">
              {rocket.description}
            </div>
          </div>

          {/* Payload Mass Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-gray-300 font-medium">
                {t.payloadMass}: <span className="font-mono text-cyan-300 font-bold">{payloadMassKg.toLocaleString()} kg</span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">
                Max Rated: {physicsResult.maxRatedPayloadKg.toLocaleString()} kg
              </span>
            </div>
            <input
              type="range"
              min={2000}
              max={60000}
              step={500}
              value={payloadMassKg}
              onChange={(e) => setPayloadMassKg(Number(e.target.value))}
              className="w-full accent-telemetry-cyan bg-space-dark rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-0.5">
              <span>2,000 kg (Scout)</span>
              <span>15,000 kg (Base Camp)</span>
              <span>60,000 kg (Heavy Colony)</span>
            </div>
          </div>

          {/* Launch Date Selector */}
          <div>
            <label className="block text-gray-300 font-medium mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-telemetry-purple" />
              <span>{t.launchDate}</span>
            </label>
            <input
              type="date"
              value={launchDate}
              onChange={(e) => setLaunchDate(e.target.value)}
              className="w-full bg-space-dark border border-space-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Real Physics Telemetry Readouts */}
          <div className="bg-space-darkest p-3 rounded-lg border border-space-border/80 space-y-2 font-mono text-xs">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Tsiolkovsky & Orbital Telemetry</span>
              <button
                onClick={() => setEngineerPanelModuleId('general_telemetry')}
                className="text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>Formulas</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-gray-400 block">{t.deltaVRequired}:</span>
                <span className="text-white font-bold">{physicsResult.requiredDeltaVKmS.toFixed(2)} km/s</span>
              </div>
              <div>
                <span className="text-gray-400 block">{t.deltaVAvailable}:</span>
                <span className={`font-bold ${physicsResult.passDeltaV ? 'text-telemetry-emerald' : 'text-telemetry-rose'}`}>
                  {physicsResult.availableDeltaVKmS.toFixed(2)} km/s
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">{t.fuelRequired}:</span>
                <span className="text-white font-bold">{physicsResult.fuelNeededKg.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-gray-400 block">{t.transferTime}:</span>
                <span className="text-white font-bold">{physicsResult.transferTimeDays} Days</span>
              </div>
            </div>
          </div>

          {/* PASS / FAIL STATUS CARD */}
          <div
            className={`p-3.5 rounded-lg border flex items-start space-x-3 transition-colors ${
              physicsResult.isPass
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}
          >
            {physicsResult.isPass ? (
              <CheckCircle2 className="w-5 h-5 text-telemetry-emerald shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-telemetry-rose shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-bold text-xs font-mono tracking-wide">
                {physicsResult.isPass ? t.pass : t.fail}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {physicsResult.isPass
                  ? "Flight dynamics cleared by Mission Control. Tsiolkovsky mass fraction and injection trajectory verified within safety tolerances."
                  : physicsResult.failureReason}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Authorize Launch */}
        <div className="pt-2">
          <button
            onClick={handleLaunch}
            disabled={!physicsResult.isPass || isLaunching}
            className={`w-full py-3 px-4 rounded-lg font-bold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 transition shadow-lg ${
              physicsResult.isPass && !isLaunching
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-space-darkest font-extrabold cursor-pointer'
                : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
            }`}
          >
            {isLaunching ? (
              <>
                <Zap className="w-4 h-4 animate-bounce text-yellow-300" />
                <span>{t.launching}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.launch}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
