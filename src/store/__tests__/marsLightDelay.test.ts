import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../useGameStore';
import { calculateEarthMarsDistanceAndDelay } from '../../core/physics/comms';

describe('Mars Relativistic Light Delay Command Queue Verification', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('proves a command issued at game time T executes ONLY after the computed one-way light delay, and not before', () => {
    const store = useGameStore.getState();
    store.loadLevel(2, 1);

    expect(useGameStore.getState().currentScreen).toBe('BASE_BUILDER');
    expect(useGameStore.getState().selectedSeasonId).toBe(2);
    expect(useGameStore.getState().missionElapsedSeconds).toBe(0);
    expect(useGameStore.getState().placedModules.length).toBe(0);
    expect(useGameStore.getState().pendingCommands.length).toBe(0);

    // Compute expected one-way light delay at day 0 (between 3.03 and 22.29 minutes)
    const { oneWayLightTimeSeconds } = calculateEarthMarsDistanceAndDelay(0);
    expect(oneWayLightTimeSeconds).toBeGreaterThanOrEqual(180); // At least 3 minutes
    expect(oneWayLightTimeSeconds).toBeLessThanOrEqual(1350); // At most 22.5 minutes

    // 1. Issue command to place Kilopower Reactor at (6, 6)
    const placed = useGameStore.getState().placeModuleOnGrid('kilopower_nuclear_reactor', 6, 6);
    expect(placed).toBe(true);

    // VERIFICATION A: Command is queued into transit, NOT executed immediately on the Martian surface
    const immediateState = useGameStore.getState();
    expect(immediateState.placedModules.length).toBe(0); // MUST BE 0 - proves no instantaneous action
    expect(immediateState.pendingCommands.length).toBe(1);

    const queuedCmd = immediateState.pendingCommands[0];
    expect(queuedCmd.type).toBe('PLACE_MODULE');
    expect(queuedCmd.moduleId).toBe('kilopower_nuclear_reactor');
    expect(queuedCmd.queuedAtMissionSeconds).toBe(0);
    expect(queuedCmd.executeAtMissionSeconds).toBe(oneWayLightTimeSeconds);
    expect(queuedCmd.delaySeconds).toBe(oneWayLightTimeSeconds);

    // Verify grid tile is reserved in transit
    const reservedTile = immediateState.gridTiles.find(t => t.x === 6 && t.y === 6);
    expect(reservedTile?.occupiedByInstanceId).toContain('reserved_');

    // 2. Advance time to 15 seconds BEFORE signal arrival
    const subArrivalSeconds = oneWayLightTimeSeconds - 15;
    // tickMissionTime adds deltaRealSeconds * 60 (at 1x time scale)
    const realSecondsToTick = subArrivalSeconds / 60;
    useGameStore.getState().tickMissionTime(realSecondsToTick);

    // VERIFICATION B: At T < oneWayLightTimeSeconds, command MUST STILL be in transit and unexecuted
    const midTransitState = useGameStore.getState();
    expect(midTransitState.missionElapsedSeconds).toBeLessThan(oneWayLightTimeSeconds);
    expect(midTransitState.placedModules.length).toBe(0); // Still 0!
    expect(midTransitState.pendingCommands.length).toBe(1);

    // 3. Advance time by another 30 seconds (now T > oneWayLightTimeSeconds)
    useGameStore.getState().tickMissionTime(30 / 60);

    // VERIFICATION C: At T >= oneWayLightTimeSeconds, command executes on Mars
    const postArrivalState = useGameStore.getState();
    expect(postArrivalState.missionElapsedSeconds).toBeGreaterThanOrEqual(oneWayLightTimeSeconds);
    expect(postArrivalState.placedModules.length).toBe(1); // Executed!
    expect(postArrivalState.placedModules[0].moduleId).toBe('kilopower_nuclear_reactor');
    expect(postArrivalState.placedModules[0].x).toBe(6);
    expect(postArrivalState.placedModules[0].y).toBe(6);
    expect(postArrivalState.pendingCommands.length).toBe(0); // Queue cleared!

    // Verify tile is now formally occupied by the module instance
    const finalTile = postArrivalState.gridTiles.find(t => t.x === 6 && t.y === 6);
    expect(finalTile?.occupiedByInstanceId).toBe(postArrivalState.placedModules[0].instanceId);
  });
});
