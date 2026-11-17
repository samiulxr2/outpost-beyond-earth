import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

interface SolarSystemMapProps {
  targetBodyId: string; // 'moon' or 'mars'
  transitProgressFraction?: number; // 0.0 to 1.0
}

// Subcomponent: The Sun
function Sun() {
  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      {/* Sun glow layer */}
      <mesh>
        <sphereGeometry args={[1.9, 32, 32]} />
        <meshBasicMaterial color="#FF8C00" transparent opacity={0.25} />
      </mesh>
      <pointLight color="#FFF5E0" intensity={3.5} distance={200} decay={1} />
    </group>
  );
}

// Subcomponent: Orbit Line
function OrbitLine({ radius, color = "#1E293B" }: { radius: number; color?: string }) {
  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }))} />
  );
}

// Subcomponent: Planetary System (Earth + Moon)
function EarthSystem({
  orbitRadius,
  earthAngle,
  targetBodyId,
}: {
  orbitRadius: number;
  earthAngle: number;
  targetBodyId: string;
}) {
  const earthX = Math.cos(earthAngle) * orbitRadius;
  const earthZ = Math.sin(earthAngle) * orbitRadius;
  const moonOrbitRadius = 1.6;

  return (
    <group position={[earthX, 0, earthZ]}>
      {/* Earth */}
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#2563EB" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Atmosphere shell */}
      <mesh>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.2} />
      </mesh>

      {/* Moon Orbit */}
      <OrbitLine radius={moonOrbitRadius} color="#334155" />

      {/* Moon */}
      <group position={[Math.cos(earthAngle * 4) * moonOrbitRadius, 0, Math.sin(earthAngle * 4) * moonOrbitRadius]}>
        <mesh>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.8} />
        </mesh>
        {targetBodyId === 'moon' && (
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.12, 0.25, 4]} />
            <meshBasicMaterial color="#10B981" />
          </mesh>
        )}
      </group>
    </group>
  );
}

// Subcomponent: Mars
function Mars({ orbitRadius, marsAngle, isTarget }: { orbitRadius: number; marsAngle: number; isTarget: boolean }) {
  const x = Math.cos(marsAngle) * orbitRadius;
  const z = Math.sin(marsAngle) * orbitRadius;

  return (
    <group position={[x, 0, z]}>
      <mesh>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color="#DC2626" roughness={0.7} />
      </mesh>
      {isTarget && (
        <mesh position={[0, 0.55, 0]}>
          <coneGeometry args={[0.14, 0.3, 4]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
      )}
    </group>
  );
}

// Subcomponent: Hohmann Transfer Arc & Spacecraft
function TransferArcAndShip({
  targetBodyId,
  earthOrbitRadius,
  targetOrbitRadius,
  earthAngle,
  targetAngle,
  transitProgress,
}: {
  targetBodyId: string;
  earthOrbitRadius: number;
  targetOrbitRadius: number;
  earthAngle: number;
  targetAngle: number;
  transitProgress: number;
}) {
  const shipRef = useRef<THREE.Group>(null);

  // Generate elliptical Hohmann trajectory arc
  const arcPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 80;

    if (targetBodyId === 'moon') {
      // Direct trans-lunar injection arc from Earth to Moon orbit
      const startX = Math.cos(earthAngle) * earthOrbitRadius;
      const startZ = Math.sin(earthAngle) * earthOrbitRadius;
      const moonX = startX + Math.cos(earthAngle * 4) * 1.6;
      const moonZ = startZ + Math.sin(earthAngle * 4) * 1.6;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // Curve outwards from Earth surface to lunar orbit
        const px = THREE.MathUtils.lerp(startX, moonX, t) + Math.sin(t * Math.PI) * 0.4;
        const py = Math.sin(t * Math.PI) * 0.3;
        const pz = THREE.MathUtils.lerp(startZ, moonZ, t) + Math.cos(t * Math.PI) * 0.2;
        pts.push(new THREE.Vector3(px, py, pz));
      }
    } else {
      // Interplanetary Hohmann ellipse from Earth (r1) to Mars (r2)
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const currentAngle = THREE.MathUtils.lerp(earthAngle, targetAngle, t);
        // Semi-major axis interpolation
        const currentRadius = THREE.MathUtils.lerp(earthOrbitRadius, targetOrbitRadius, t);
        const px = Math.cos(currentAngle) * currentRadius;
        const py = Math.sin(t * Math.PI) * 0.6; // Slight out-of-plane inclination arc
        const pz = Math.sin(currentAngle) * currentRadius;
        pts.push(new THREE.Vector3(px, py, pz));
      }
    }
    return pts;
  }, [targetBodyId, earthAngle, targetAngle, earthOrbitRadius, targetOrbitRadius]);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(arcPoints);
  }, [arcPoints]);

  const arcGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(arcPoints);
  }, [arcPoints]);

  // Position spacecraft along the trajectory curve
  useFrame(() => {
    if (shipRef.current && curve) {
      const clampedT = Math.max(0.01, Math.min(0.99, transitProgress));
      const pos = curve.getPoint(clampedT);
      const tangent = curve.getTangent(clampedT);
      shipRef.current.position.copy(pos);
      shipRef.current.lookAt(pos.clone().add(tangent));
    }
  });

  return (
    <>
      {/* Trajectory Path Line */}
      <primitive object={new THREE.Line(arcGeometry, new THREE.LineBasicMaterial({ color: "#38BDF8", linewidth: 2 }))} />

      {/* Spacecraft */}
      <group ref={shipRef}>
        {/* Capsule / Service Module */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.15, 0.4, 8]} />
          <meshStandardMaterial color="#F8FAFC" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Solar panels */}
        <mesh position={[0.25, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.12]} />
          <meshBasicMaterial color="#0284C7" />
        </mesh>
        <mesh position={[-0.25, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.12]} />
          <meshBasicMaterial color="#0284C7" />
        </mesh>
        {/* Thruster flame glow */}
        <pointLight color="#38BDF8" intensity={1.5} distance={1.5} />
      </group>
    </>
  );
}

// Scene Root
function SolarSystemScene({ targetBodyId }: { targetBodyId: string }) {
  const { missionElapsedSeconds } = useGameStore();

  // Simulated orbital movement based on mission time
  const timeSec = missionElapsedSeconds * 0.00005;
  const earthAngle = timeSec * 1.0;
  const marsAngle = timeSec * 0.53 + 1.2; // Mars orbital period is ~1.88x Earth's

  const earthOrbitRadius = 9.0;
  const marsOrbitRadius = 14.5;

  // Spacecraft transit progress (cycles for visualization or advances with mission timer)
  const transitProgress = (missionElapsedSeconds % 172800) / 172800; // 0 to 1

  return (
    <>
      <ambientLight intensity={0.25} />
      <Sun />
      <Stars radius={120} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1} />

      {/* Planetary Orbit Lines */}
      <OrbitLine radius={earthOrbitRadius} color="#1E3A8A" />
      <OrbitLine radius={marsOrbitRadius} color="#7F1D1D" />

      {/* Earth & Moon */}
      <EarthSystem orbitRadius={earthOrbitRadius} earthAngle={earthAngle} targetBodyId={targetBodyId} />

      {/* Mars */}
      <Mars orbitRadius={marsOrbitRadius} marsAngle={marsAngle} isTarget={targetBodyId === 'mars'} />

      {/* Hohmann Transfer Arc & Animated Spacecraft */}
      <TransferArcAndShip
        targetBodyId={targetBodyId}
        earthOrbitRadius={earthOrbitRadius}
        targetOrbitRadius={marsOrbitRadius}
        earthAngle={earthAngle}
        targetAngle={marsAngle}
        transitProgress={transitProgress}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />
    </>
  );
}

export const SolarSystemMap: React.FC<SolarSystemMapProps> = ({ targetBodyId }) => {
  return (
    <div className="w-full h-full relative bg-space-darkest overflow-hidden">
      <Canvas
        camera={{ position: [0, 18, 22], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#030712']} />
        <SolarSystemScene targetBodyId={targetBodyId} />
      </Canvas>

      {/* 3D Map Overlay Controls Hint */}
      <div className="absolute bottom-3 left-3 bg-space-darker/80 backdrop-blur border border-space-border px-3 py-1.5 rounded text-[11px] text-gray-400 font-mono pointer-events-none select-none">
        <span className="text-cyan-400 font-semibold">Controls:</span> Drag to Orbit • Scroll to Zoom • Right-Click to Pan
      </div>
    </div>
  );
};
