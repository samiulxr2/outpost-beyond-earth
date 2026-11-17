import { describe, it, expect } from 'vitest';
import { evaluateMissionPlan } from '../planner';
import type { RocketSpec } from '../planner';

describe('Mission Planner Pass/Fail Flight Dynamics Logic', () => {
  const rockets: Record<string, RocketSpec> = {
    sls: {
      id: 'sls_block_1b',
      name: 'SLS Block 1B',
      maxPayloadToTLIKg: 38000,
      maxPayloadToTMIKg: 27000,
      upperStage: { dryMassKg: 14000, propellantMassKg: 129000, ispVacuumS: 453 }
    },
    falconHeavy: {
      id: 'falcon_heavy_exp',
      name: 'Falcon Heavy Expendable',
      maxPayloadToTLIKg: 19000,
      maxPayloadToTMIKg: 16800,
      upperStage: { dryMassKg: 4000, propellantMassKg: 92000, ispVacuumS: 348 }
    },
    starship: {
      id: 'starship_hls',
      name: 'Starship HLS',
      maxPayloadToTLIKg: 100000,
      maxPayloadToTMIKg: 100000,
      upperStage: { dryMassKg: 100000, propellantMassKg: 1200000, ispVacuumS: 380 }
    },
    vulcan: {
      id: 'vulcan_centaur',
      name: 'Vulcan Centaur',
      maxPayloadToTLIKg: 12100,
      maxPayloadToTMIKg: 9800,
      upperStage: { dryMassKg: 5800, propellantMassKg: 54000, ispVacuumS: 453.8 }
    }
  };

  describe('Passing Cases for Each Rocket to Lunar Destination', () => {
    it('should PASS for SLS Block 1B with 15,000 kg lunar base payload', () => {
      const plan = evaluateMissionPlan('moon', rockets.sls, 15000);
      expect(plan.isPass).toBe(true);
      expect(plan.passPayload).toBe(true);
      expect(plan.passDeltaV).toBe(true);
      expect(plan.marginDeltaVMs).toBeGreaterThan(0);
      expect(plan.marginDeltaVMs).toBeCloseTo(plan.availableDeltaVMs - plan.requiredDeltaVMs, 1);
    });

    it('should PASS for Falcon Heavy with 10,000 kg payload', () => {
      const plan = evaluateMissionPlan('moon', rockets.falconHeavy, 10000);
      expect(plan.isPass).toBe(true);
      expect(plan.passPayload).toBe(true);
      expect(plan.passDeltaV).toBe(true);
      expect(plan.marginDeltaVMs).toBeGreaterThan(0);
    });

    it('should PASS for Starship HLS with 50,000 kg heavy colony payload', () => {
      const plan = evaluateMissionPlan('moon', rockets.starship, 50000);
      expect(plan.isPass).toBe(true);
      expect(plan.passPayload).toBe(true);
      expect(plan.passDeltaV).toBe(true);
      expect(plan.marginDeltaVMs).toBeGreaterThan(0);
    });

    it('should PASS for Vulcan Centaur with 5,000 kg scout payload', () => {
      const plan = evaluateMissionPlan('moon', rockets.vulcan, 5000);
      expect(plan.isPass).toBe(true);
      expect(plan.passPayload).toBe(true);
      expect(plan.passDeltaV).toBe(true);
      expect(plan.marginDeltaVMs).toBeGreaterThan(0);
    });
  });

  describe('Failing Cases (Payload Limit & Delta-V Deficit)', () => {
    it('should FAIL when payload exceeds maximum rated TLI capacity', () => {
      // Vulcan Centaur rated for 12,100 kg to TLI. Testing with 18,000 kg.
      const plan = evaluateMissionPlan('moon', rockets.vulcan, 18000);
      expect(plan.isPass).toBe(false);
      expect(plan.passPayload).toBe(false);
      expect(plan.failureReason).toContain('exceeds rated capacity');
    });

    it('should FAIL when payload causes delta-V deficit', () => {
      // Craft with insufficient propellant / low Isp causing delta-V deficit
      const underpoweredRocket: RocketSpec = {
        id: 'underpowered_rocket',
        name: 'Underpowered Upper Stage',
        maxPayloadToTLIKg: 50000,
        maxPayloadToTMIKg: 50000,
        upperStage: { dryMassKg: 10000, propellantMassKg: 5000, ispVacuumS: 250 }
      };

      const plan = evaluateMissionPlan('moon', underpoweredRocket, 10000);
      expect(plan.isPass).toBe(false);
      expect(plan.passDeltaV).toBe(false);
      expect(plan.marginDeltaVMs).toBeLessThan(0);
      expect(plan.failureReason).toContain('Delta-V deficit');
    });
  });

  describe('Mars Hohmann Mission Planning', () => {
    it('should PASS for SLS Block 1B to Mars with 12,000 kg payload', () => {
      const plan = evaluateMissionPlan('mars', rockets.sls, 12000);
      expect(plan.isPass).toBe(true);
      expect(plan.transferTimeDays).toBe(259);
    });

    it('should FAIL for Falcon Heavy to Mars if payload exceeds 16,800 kg', () => {
      const plan = evaluateMissionPlan('mars', rockets.falconHeavy, 22000);
      expect(plan.isPass).toBe(false);
      expect(plan.passPayload).toBe(false);
    });
  });
});
