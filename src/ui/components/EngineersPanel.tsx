import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { translations } from '../i18n';
import { X, BookOpen, AlertCircle, Info, ExternalLink } from 'lucide-react';
import modulesData from '../../data/modules.json';

export const EngineersPanel: React.FC = () => {
  const { engineerPanelModuleId, setEngineerPanelModuleId, locale } = useGameStore();
  const t = translations[locale];

  if (!engineerPanelModuleId) return null;

  const selectedModule = modulesData.modules.find(m => m.id === engineerPanelModuleId);

  return (
    <aside className="fixed top-14 right-0 bottom-0 w-80 md:w-96 bg-space-darker/95 backdrop-blur-md border-l border-space-border shadow-2xl z-40 flex flex-col text-sm text-gray-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-space-border flex items-center justify-between bg-space-dark/80">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-telemetry-cyan" />
          <h2 className="font-bold text-sm tracking-wide text-cyan-400 font-mono">
            {t.engineersPanel}
          </h2>
        </div>
        <button
          onClick={() => setEngineerPanelModuleId(null)}
          className="p-1 rounded hover:bg-space-card text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1 font-sans">
        {selectedModule ? (
          /* Specific Module Breakdown */
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                {selectedModule.category} • Tier {selectedModule.tier}
              </span>
              <h3 className="text-base font-bold text-white mt-1.5">{selectedModule.name}</h3>
            </div>

            {/* Why This Is Real */}
            <div className="bg-space-dark/90 p-3 rounded-lg border border-space-border space-y-2">
              <div className="flex items-center space-x-1.5 text-telemetry-emerald text-xs font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>{t.whyThisIsReal}</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedModule.whyThisIsReal}
              </p>
            </div>

            {/* Formula Card */}
            <div className="bg-space-darkest p-3 rounded-lg border border-space-border/80 font-mono space-y-1.5">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider">Physics Model & Formula</div>
              <div className="text-xs text-cyan-300 p-2 bg-space-dark rounded border border-cyan-500/20 break-words">
                {selectedModule.formula}
              </div>
            </div>

            {/* Simplification Note */}
            <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-500/30 text-amber-200/90 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-telemetry-amber font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t.simplifiedForGameplay}</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Discrete 1-second simulation tick discretizes continuous thermal, chemical, and electrical transients for responsive 60 FPS gameplay.
              </p>
            </div>

            {/* NASA Reference Citation */}
            <div className="border-t border-space-border pt-3 space-y-1 text-xs">
              <div className="text-gray-400 font-mono text-[10px] uppercase">NASA Citation & Instrument</div>
              <div className="text-gray-200 font-medium">{selectedModule.source}</div>
              <div className="text-gray-400 text-[11px]">{selectedModule.instrumentOrMission}</div>
              <a
                href={selectedModule.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-telemetry-cyan hover:underline text-[11px] pt-1"
              >
                <span>View Official NASA Technical Paper</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : engineerPanelModuleId === 'resource_power' ? (
          /* Resource: Electrical Power & Energy Storage */
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                Resource Subsystem
              </span>
              <h3 className="text-base font-bold text-white mt-1.5">Electrical Grid & Battery Energy Storage</h3>
            </div>

            <div className="bg-space-dark/90 p-3 rounded-lg border border-space-border space-y-2">
              <div className="flex items-center space-x-1.5 text-telemetry-emerald text-xs font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Why This Is Real</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Power is the master constraint of lunar surface exploration. Vertical solar arrays (VSAT) on crater peaks generate power during low-incident sun angles, while space-rated Li-ion batteries sustain life support through topographic shadow dips.
              </p>
            </div>

            <div className="bg-space-darkest p-3 rounded-lg border border-space-border/80 font-mono space-y-1.5">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider">Governing Formulas</div>
              <div className="text-xs text-cyan-300 p-2 bg-space-dark rounded border border-cyan-500/20 break-words space-y-1">
                <div>P_net = &Sigma; P_gen - &Sigma; P_cons</div>
                <div>E_stored(t) = E_0 + &int; P_net(t) dt</div>
                <div>&tau;_deplete = E_stored / |P_net|</div>
              </div>
            </div>

            <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-500/30 text-amber-200/90 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-telemetry-amber font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t.simplifiedForGameplay}</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Battery charge/discharge assumes constant round-trip efficiency without modeling temperature-dependent internal impedance or high C-rate heating.
              </p>
            </div>

            <div className="border-t border-space-border pt-3 space-y-1 text-xs">
              <div className="text-gray-400 font-mono text-[10px] uppercase">NASA Citation</div>
              <div className="text-gray-200 font-medium">NASA Glenn Research Center / Battery Safety Workshop</div>
              <div className="text-gray-400 text-[11px]">Artemis Base Camp Surface Power Technologies</div>
            </div>
          </div>
        ) : engineerPanelModuleId === 'resource_illumination' ? (
          /* Resource: Illumination & Day/Night Cycles */
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                Planetary Environment
              </span>
              <h3 className="text-base font-bold text-white mt-1.5">Solar Illumination & Topographic Shadow</h3>
            </div>

            <div className="bg-space-dark/90 p-3 rounded-lg border border-space-border space-y-2">
              <div className="flex items-center space-x-1.5 text-telemetry-emerald text-xs font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Why This Is Real</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Due to the Moon's small 1.54&deg; axial tilt, polar crater rims remain in sunlight for 80% to 92% of the year with brief shadow dips of hours to days. In contrast, equatorial sites endure a brutal 354-hour continuous night with temperatures plunging below -180&deg;C.
              </p>
            </div>

            <div className="bg-space-darkest p-3 rounded-lg border border-space-border/80 font-mono space-y-1.5">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider">Governing Formulas</div>
              <div className="text-xs text-cyan-300 p-2 bg-space-dark rounded border border-cyan-500/20 break-words space-y-1">
                <div>Equatorial Night: T_night = 354.35 h (half of 708.7 h synodic month)</div>
                <div>Polar Shadow Dip: T_dip = T_cycle &times; (1 - &eta;_illumination)</div>
              </div>
            </div>

            <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-500/30 text-amber-200/90 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-telemetry-amber font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t.simplifiedForGameplay}</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Lunar polar illumination uses periodic topographic shadow dips parameterized by landingSites.json illuminationAnnualPct and latitude rather than full 3D horizon raytracing against LRO LOLA elevation DEMs.
              </p>
            </div>

            <div className="border-t border-space-border pt-3 space-y-1 text-xs">
              <div className="text-gray-400 font-mono text-[10px] uppercase">NASA Citation</div>
              <div className="text-gray-200 font-medium">NASA LRO LOLA Topography Data (Mazarico et al., 2011)</div>
              <div className="text-gray-400 text-[11px]">Illumination conditions of the lunar polar regions</div>
            </div>
          </div>
        ) : (
          /* General Mission Telemetry Formulas (Mission Planner & Core Physics) */
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                Aerospace Telemetry
              </span>
              <h3 className="text-base font-bold text-white mt-1.5">Orbital Mechanics & Propulsion</h3>
            </div>

            {/* Tsiolkovsky Formula */}
            <div className="bg-space-dark/90 p-3 rounded-lg border border-space-border space-y-2">
              <div className="text-xs font-bold text-cyan-400 font-mono">1. Tsiolkovsky Rocket Equation</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Determines the velocity change (&Delta;v) a rocket achieves by expelling propellant mass at high exhaust velocity:
              </p>
              <div className="font-mono text-xs bg-space-darkest p-2 rounded text-cyan-300 border border-cyan-500/20">
                &Delta;v = I_sp &times; g_0 &times; ln(m_0 / m_f)
              </div>
              <p className="text-[11px] text-gray-400">
                Where g_0 = 9.80665 m/s&sup2;, m_0 is wet initial mass, m_f is dry mass + payload.
              </p>
            </div>

            {/* Hohmann Transfer Formula */}
            <div className="bg-space-dark/90 p-3 rounded-lg border border-space-border space-y-2">
              <div className="text-xs font-bold text-cyan-400 font-mono">2. Hohmann Transfer Orbit</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                The most fuel-efficient two-burn elliptical orbital trajectory between two celestial bodies:
              </p>
              <div className="font-mono text-xs bg-space-darkest p-2 rounded text-cyan-300 border border-cyan-500/20">
                t_transfer = &pi; &times; &radic;(a&sup3; / &mu;_sun)
              </div>
              <div className="bg-amber-950/30 p-2 rounded border border-amber-500/30 text-[11px] text-amber-300/80">
                <span className="font-semibold text-telemetry-amber">{t.simplifiedForGameplay}:</span> Assumes circular coplanar orbits. Real planetary orbits have orbital eccentricity and inclination.
              </div>
            </div>

            {/* Solar Inverse Square */}
            <div className="bg-space-dark/90 p-3 rounded-lg border border-space-border space-y-2">
              <div className="text-xs font-bold text-cyan-400 font-mono">3. Solar Irradiance Inverse-Square Law</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Solar flux drops with the square of the distance from the Sun:
              </p>
              <div className="font-mono text-xs bg-space-darkest p-2 rounded text-cyan-300 border border-cyan-500/20">
                S(r) = S_0 / r&sup2; (1361 W/m&sup2; at 1 AU &rarr; 586 W/m&sup2; at Mars)
              </div>
            </div>

            {/* Speed of Light Delay */}
            <div className="bg-space-dark/90 p-3 rounded-lg border border-space-border space-y-2">
              <div className="text-xs font-bold text-cyan-400 font-mono">4. Finite Speed of Light Telemetry Delay</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Radio signals travel at c = 299,792 km/s. One-way lag is 1.28 seconds to the Moon, and 3.0 to 22.3 minutes to Mars depending on orbital positions.
              </p>
              <div className="font-mono text-xs bg-space-darkest p-2 rounded text-cyan-300 border border-cyan-500/20">
                t_delay = distance / c
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
