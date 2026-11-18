import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { calculateEarthMarsDistanceAndDelay } from '../../core/physics/comms';
import { Radio, Clock, Info, Satellite } from 'lucide-react';

export const MarsCommsQueueHUD: React.FC = () => {
  const {
    selectedSeasonId,
    landingSiteId,
    missionElapsedDays,
    missionElapsedSeconds,
    pendingCommands,
  } = useGameStore();

  const isMars = selectedSeasonId === 2 || landingSiteId.includes('jezero');

  const commsTelemetry = useMemo(() => {
    return calculateEarthMarsDistanceAndDelay(missionElapsedDays);
  }, [missionElapsedDays]);

  if (!isMars) return null;

  const delayMins = Math.floor(commsTelemetry.oneWayLightTimeSeconds / 60);
  const delaySecs = Math.round(commsTelemetry.oneWayLightTimeSeconds % 60);
  const distanceAU = commsTelemetry.distanceKm / 149597870.7;

  return (
    <div className="absolute bottom-20 left-4 z-20 w-80 sm:w-96 bg-space-darker/95 backdrop-blur-md border border-red-900/60 rounded-xl shadow-2xl overflow-hidden font-sans select-none animate-in fade-in slide-in-from-bottom-2">
      {/* Header telemetry ribbon */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-red-950/80 via-space-dark to-space-darker border-b border-red-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-mono font-bold tracking-wider text-red-300 uppercase">
                DSN Mars Relativistic Uplink
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-red-900/60 text-red-200 border border-red-700/50">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              Dist: {distanceAU.toFixed(3)} AU ({(commsTelemetry.distanceKm / 1e6).toFixed(1)}M km)
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end space-x-1 text-amber-300 font-mono text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>+{delayMins}m {delaySecs.toString().padStart(2, '0')}s</span>
          </div>
          <span className="text-[9px] text-gray-400 font-mono uppercase">1-Way Light Delay</span>
        </div>
      </div>

      {/* Pending command list */}
      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pb-1 border-b border-white/5">
          <span className="flex items-center space-x-1">
            <Satellite className="w-3 h-3 text-cyan-400" />
            <span>Telemetry Transit Queue</span>
          </span>
          <span className="text-amber-400 font-semibold">
            {pendingCommands.length} in transit
          </span>
        </div>

        {pendingCommands.length === 0 ? (
          <div className="py-2.5 px-3 rounded-lg bg-black/20 border border-white/5 text-center">
            <p className="text-[11px] text-gray-400">
              Direct uplink clear. Transmission queue ready.
            </p>
            <p className="text-[10px] text-amber-400/80 font-mono mt-0.5">
              Commands experience real {delayMins}m {delaySecs}s light delay before execution on Mars.
            </p>
          </div>
        ) : (
          pendingCommands.map((cmd) => {
            const remainingSecs = Math.max(0, Math.ceil(cmd.executeAtMissionSeconds - missionElapsedSeconds));
            const elapsed = cmd.delaySeconds - remainingSecs;
            const progressPct = Math.min(100, Math.max(0, Math.round((elapsed / cmd.delaySeconds) * 100)));
            const remMins = Math.floor(remainingSecs / 60);
            const remSecs = remainingSecs % 60;

            return (
              <div
                key={cmd.id}
                className="p-2.5 rounded-lg bg-red-950/20 border border-red-800/40 space-y-1.5"
              >
                <div className="flex items-start justify-between text-[11px]">
                  <span className="text-gray-200 font-medium truncate pr-2">
                    {cmd.description}
                  </span>
                  <span className="text-amber-300 font-mono text-[10px] whitespace-nowrap font-bold">
                    -{remMins}m {remSecs.toString().padStart(2, '0')}s
                  </span>
                </div>

                {/* Radio signal propagation progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-space-dark overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-gray-400">
                    <span>Earth (Houston)</span>
                    <span className="text-amber-400">{progressPct}% in transit</span>
                    <span>Jezero Crater</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Physics educational footnote */}
      <div className="px-3 py-1.5 bg-black/30 border-t border-white/5 flex items-center space-x-1.5 text-[9px] text-gray-400 font-mono">
        <Info className="w-3 h-3 text-red-400 shrink-0" />
        <span>
          c = 299,792 km/s. NASA DSN radio telemetry cannot be instantaneous across interplanetary distances.
        </span>
      </div>
    </div>
  );
};
