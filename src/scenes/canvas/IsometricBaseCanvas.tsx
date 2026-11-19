import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sound } from '../../audio/soundSynth';
import modulesData from '../../data/modules.json';
import type { PlacedModule } from '../../types/game';

interface IsometricBaseCanvasProps {
  onSelectPlacedModule?: (module: PlacedModule | null) => void;
}

const TILE_W = 64;
const TILE_H = 32;

export const IsometricBaseCanvas: React.FC<IsometricBaseCanvasProps> = React.memo(({ onSelectPlacedModule }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const gridTiles = useGameStore((s) => s.gridTiles);
  const gridSize = useGameStore((s) => s.gridSize);
  const selectedModuleIdForBuild = useGameStore((s) => s.selectedModuleIdForBuild);
  const placeModuleOnGrid = useGameStore((s) => s.placeModuleOnGrid);
  const setEngineerPanelModuleId = useGameStore((s) => s.setEngineerPanelModuleId);

  // Camera Pan & Zoom State
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.2);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const hoveredTileRef = useRef(hoveredTile);
  hoveredTileRef.current = hoveredTile;
  const selectedInstanceIdRef = useRef(selectedInstanceId);
  selectedInstanceIdRef.current = selectedInstanceId;
  const selectedModuleIdForBuildRef = useRef(selectedModuleIdForBuild);
  selectedModuleIdForBuildRef.current = selectedModuleIdForBuild;

  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Offscreen Canvas Cache for Static Terrain
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isTerrainDirtyRef = useRef<boolean>(true);

  // Fast O(1) tile lookup cache
  const tileMapRef = useRef<Map<string, (typeof gridTiles)[0]>>(new Map());
  useEffect(() => {
    const map = new Map<string, (typeof gridTiles)[0]>();
    gridTiles.forEach(t => map.set(`${t.x}_${t.y}`, t));
    tileMapRef.current = map;
    isTerrainDirtyRef.current = true;
  }, [gridTiles]);

  // Invalidate terrain cache whenever camera pan, zoom, or grid size changes
  useEffect(() => {
    isTerrainDirtyRef.current = true;
  }, [pan, zoom, gridSize]);

  // Center the grid on initial load
  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 4 });
      isTerrainDirtyRef.current = true;
    }
  }, []);

  // Convert Grid Coordinates (x, y) to Screen Coordinates (sx, sy)
  const getScreenCoords = useCallback(
    (gx: number, gy: number, elevation: number = 0, currentZoom = zoomRef.current, currentPan = panRef.current) => {
      const sx = (gx - gy) * (TILE_W / 2) * currentZoom + currentPan.x;
      const elevOffset = (elevation / 100) * 8 * currentZoom;
      const sy = (gx + gy) * (TILE_H / 2) * currentZoom + currentPan.y - elevOffset;
      return { sx, sy };
    },
    []
  );

  // Convert Screen Coordinates (sx, sy) to Grid Coordinates (gx, gy)
  const screenToGrid = useCallback(
    (sx: number, sy: number) => {
      const adjX = (sx - pan.x) / zoom;
      const adjY = (sy - pan.y) / zoom;
      const gx = Math.floor((adjX / (TILE_W / 2) + adjY / (TILE_H / 2)) / 2);
      const gy = Math.floor((adjY / (TILE_H / 2) - adjX / (TILE_W / 2)) / 2);
      return { gx, gy };
    },
    [zoom, pan]
  );

  // Mouse / Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({ x: panStartRef.current.x + dx, y: panStartRef.current.y + dy });
    } else {
      const { gx, gy } = screenToGrid(mouseX, mouseY);
      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        setHoveredTile({ x: gx, y: gy });
      } else {
        setHoveredTile(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const dist = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);

    // If mouse didn't drag significantly, treat as a Click
    if (dist < 6 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const { gx, gy } = screenToGrid(clickX, clickY);

      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        // Check if there is an existing placed module on this tile
        const existing = useGameStore.getState().placedModules.find(m => m.x === gx && m.y === gy);

        if (selectedModuleIdForBuild) {
          // Attempt placement
          const success = placeModuleOnGrid(selectedModuleIdForBuild, gx, gy);
          if (success) {
            sound.playBuild();
          } else {
            sound.playError();
          }
        } else if (existing) {
          // Select module to inspect / repair
          sound.playClick();
          setSelectedInstanceId(existing.instanceId);
          if (onSelectPlacedModule) onSelectPlacedModule(existing);
          setEngineerPanelModuleId(existing.moduleId);
        } else {
          // Deselect
          setSelectedInstanceId(null);
          if (onSelectPlacedModule) onSelectPlacedModule(null);
        }
      }
    }
  };

  // Mouse Wheel Zoom centered on cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.max(0.5, Math.min(2.5, zoom * zoomFactor));

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Adjust pan so point under cursor remains stationary
    const newPanX = cursorX - (cursorX - pan.x) * (newZoom / zoom);
    const newPanY = cursorY - (cursorY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderTerrainToOffscreen = (offCanvas: HTMLCanvasElement, w: number, h: number) => {
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      offCtx.clearRect(0, 0, w, h);

      // Deep space background gradient
      const bgGrad = offCtx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#040711');
      bgGrad.addColorStop(0.5, '#070C18');
      bgGrad.addColorStop(1, '#020409');
      offCtx.fillStyle = bgGrad;
      offCtx.fillRect(0, 0, w, h);

      const curZoom = zoomRef.current;
      const curPan = panRef.current;
      const tw = (TILE_W / 2) * curZoom;
      const th = (TILE_H / 2) * curZoom;
      const skirtDepth = 6 * curZoom;

      // Render Grid Tiles in Isometric Order (back to front: row + col)
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const tile = tileMapRef.current.get(`${x}_${y}`);
          if (!tile) continue;

          const { sx, sy } = getScreenCoords(x, y, tile.elevationMeters, curZoom, curPan);
          const isShadowColdTrap = tile.illuminationPct === 0;
          const isPeakLight = tile.illuminationPct > 90;

          // Base Tile Colors
          let tileFill = '#1C2433'; // Standard regolith grey
          let tileStroke = '#2D3A4F';

          if (isShadowColdTrap) {
            tileFill = '#0C172B'; // Deep cryogenic shadow blue
            tileStroke = '#1E3A8A';
          } else if (isPeakLight) {
            tileFill = '#2A3447'; // Elevated peak basalt
            tileStroke = '#D97706'; // Golden sunlight highlight
          }

          if (tile.isObstacle) {
            tileFill = '#171C26';
            tileStroke = '#475569';
          }

          // Isometric Diamond Path
          offCtx.beginPath();
          offCtx.moveTo(sx, sy);
          offCtx.lineTo(sx + tw, sy + th);
          offCtx.lineTo(sx, sy + th * 2);
          offCtx.lineTo(sx - tw, sy + th);
          offCtx.closePath();

          offCtx.fillStyle = tileFill;
          offCtx.fill();

          offCtx.lineWidth = 1;
          offCtx.strokeStyle = tileStroke;
          offCtx.stroke();

          // Render Elevation 3D Skirt
          offCtx.beginPath();
          offCtx.moveTo(sx - tw, sy + th);
          offCtx.lineTo(sx, sy + th * 2);
          offCtx.lineTo(sx, sy + th * 2 + skirtDepth);
          offCtx.lineTo(sx - tw, sy + th + skirtDepth);
          offCtx.closePath();
          offCtx.fillStyle = isShadowColdTrap ? '#060B14' : '#111722';
          offCtx.fill();

          offCtx.beginPath();
          offCtx.moveTo(sx, sy + th * 2);
          offCtx.lineTo(sx + tw, sy + th);
          offCtx.lineTo(sx + tw, sy + th + skirtDepth);
          offCtx.lineTo(sx, sy + th * 2 + skirtDepth);
          offCtx.closePath();
          offCtx.fillStyle = isShadowColdTrap ? '#080E1A' : '#151D2A';
          offCtx.fill();
        }
      }
    };

    const render = () => {
      const drawStartTime = performance.now();
      const width = canvas.width;
      const height = canvas.height;

      // Update offscreen terrain cache only on dirty change (pan, zoom, tiles, resize)
      if (
        isTerrainDirtyRef.current || 
        !offscreenCanvasRef.current || 
        offscreenCanvasRef.current.width !== width || 
        offscreenCanvasRef.current.height !== height
      ) {
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        offscreenCanvasRef.current.width = width;
        offscreenCanvasRef.current.height = height;
        renderTerrainToOffscreen(offscreenCanvasRef.current, width, height);
        isTerrainDirtyRef.current = false;
      }

      // 1. Blit pre-cached static terrain in a single ultra-fast operation (<0.2ms)
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);

      const curZoom = zoomRef.current;
      const curPan = panRef.current;
      const tw = (TILE_W / 2) * curZoom;
      const th = (TILE_H / 2) * curZoom;
      const curHovered = hoveredTileRef.current;
      const curSelectedId = selectedInstanceIdRef.current;
      const curBuildId = selectedModuleIdForBuildRef.current;

      // 2. Render Hover Highlight if active
      if (curHovered) {
        const hTile = tileMapRef.current.get(`${curHovered.x}_${curHovered.y}`);
        if (hTile) {
          const { sx, sy } = getScreenCoords(curHovered.x, curHovered.y, hTile.elevationMeters, curZoom, curPan);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + tw, sy + th);
          ctx.lineTo(sx, sy + th * 2);
          ctx.lineTo(sx - tw, sy + th);
          ctx.closePath();

          const canBuild = curBuildId && !hTile.isObstacle && !hTile.occupiedByInstanceId;
          ctx.fillStyle = canBuild ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)';
          ctx.fill();
          ctx.strokeStyle = canBuild ? '#38BDF8' : '#EF4444';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // 3. Render Placed Modules sorted back-to-front by isometric depth (x + y)
      const placed = useGameStore.getState().placedModules;
      const sortedModules = [...placed].sort((a, b) => (a.x + a.y) - (b.x + b.y));
      for (const mod of sortedModules) {
        const tile = tileMapRef.current.get(`${mod.x}_${mod.y}`);
        const { sx, sy } = getScreenCoords(mod.x, mod.y, tile?.elevationMeters || 0, curZoom, curPan);
        renderModule(ctx, mod, sx, sy + th, curZoom, mod.instanceId === curSelectedId);
      }

      // 4. Render Active Environmental Hazards Overlay (e.g. Solar Particle Event radiation haze)
      const activeHazards = useGameStore.getState().activeHazards;
      if (activeHazards && activeHazards.length > 0) {
        for (const h of activeHazards) {
          if (h.status === 'IMPACTING') {
            if (h.category === 'Radiation') {
              ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
              ctx.fillRect(0, 0, width, height);
            } else if (h.category === 'Impact') {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
              ctx.fillRect(0, 0, width, height);
            }
          }
        }
      }

      // Record exact canvas draw duration per frame
      const drawDurationMs = performance.now() - drawStartTime;
      (window as any).__LAST_CANVAS_DRAW_TIME_MS__ = drawDurationMs;
      if (!(window as any).__CANVAS_DRAW_TIMES__) {
        (window as any).__CANVAS_DRAW_TIMES__ = [];
      }
      (window as any).__CANVAS_DRAW_TIMES__.push(drawDurationMs);
      if ((window as any).__CANVAS_DRAW_TIMES__.length > 200) {
        (window as any).__CANVAS_DRAW_TIMES__.shift();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [gridSize, getScreenCoords]);

  return (
    <div className="w-full h-full relative overflow-hidden select-none touch-none">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Canvas Camera Controls Overlay */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-space-darker/90 backdrop-blur border border-space-border px-3 py-1.5 rounded-lg text-xs font-mono text-gray-300 shadow-lg">
        <span className="text-cyan-400 font-bold">Zoom: {Math.round(zoom * 100)}%</span>
        <span>•</span>
        <button
          onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
          className="px-2 py-0.5 rounded bg-space-card hover:bg-space-muted text-white font-bold"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
          className="px-2 py-0.5 rounded bg-space-card hover:bg-space-muted text-white font-bold"
        >
          -
        </button>
        <button
          onClick={() => {
            if (canvasRef.current) {
              setPan({ x: canvasRef.current.width / 2, y: canvasRef.current.height / 4 });
              setZoom(1.2);
            }
          }}
          className="px-2 py-0.5 rounded bg-space-card hover:bg-space-muted text-gray-300 text-[11px]"
        >
          Reset View
        </button>
      </div>
    </div>
  );
});

// 2.5D Isometric Module Renderer
function renderModule(
  ctx: CanvasRenderingContext2D,
  module: PlacedModule,
  cx: number, // Center of tile screen X
  cy: number, // Center of tile screen Y
  zoom: number,
  isSelected: boolean
) {
  const def = modulesData.modules.find(m => m.id === module.moduleId);
  if (!def) return;

  const mId = def.id;

  // Visual Selection Ring
  if (isSelected) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26 * zoom, 13 * zoom, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Draw Specific Module Geometry
  if (mId.includes('vsat') || mId.includes('solar')) {
    // Vertical Solar Array (VSAT): 10m Telescoping Mast + Photovoltaic Wings
    const mastHeight = 36 * zoom;

    // Central Mast
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3 * zoom;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - mastHeight);
    ctx.stroke();

    // Dual Photovoltaic Wings
    const wingWidth = 18 * zoom;
    const wingHeight = 24 * zoom;
    ctx.fillStyle = '#0284C7'; // Photovoltaic Solar Blue
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;

    // Left Wing
    ctx.fillRect(cx - wingWidth - 2, cy - mastHeight + 4, wingWidth, wingHeight);
    ctx.strokeRect(cx - wingWidth - 2, cy - mastHeight + 4, wingWidth, wingHeight);

    // Right Wing
    ctx.fillRect(cx + 2, cy - mastHeight + 4, wingWidth, wingHeight);
    ctx.strokeRect(cx + 2, cy - mastHeight + 4, wingWidth, wingHeight);

    // Sun tracking gimbal light
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(cx, cy - mastHeight, 3 * zoom, 0, Math.PI * 2);
    ctx.fill();
  } else if (mId.includes('battery')) {
    // Li-Ion Battery Storage Block
    const bw = 24 * zoom;
    const bh = 18 * zoom;

    // Outer Battery Cube
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
    ctx.strokeRect(cx - bw / 2, cy - bh, bw, bh);

    // Cyan Energy Cell Indicator LEDs
    ctx.fillStyle = '#10B981';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(cx - bw / 2 + 3 + i * (7 * zoom), cy - bh + 4, 4 * zoom, 4 * zoom);
    }
  } else if (mId.includes('hab')) {
    // Inflatable Surface Habitat Alpha: Pressurized Dome
    const radius = 20 * zoom;
    ctx.beginPath();
    ctx.arc(cx, cy - 8 * zoom, radius, Math.PI, 0);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Airlock Hatch
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(cx - 5 * zoom, cy - 6 * zoom, 10 * zoom, 6 * zoom);

    // Window Portholes
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(cx - 8 * zoom, cy - 14 * zoom, 2.5 * zoom, 0, Math.PI * 2);
    ctx.arc(cx + 8 * zoom, cy - 14 * zoom, 2.5 * zoom, 0, Math.PI * 2);
    ctx.fill();
  } else if (mId.includes('eclss')) {
    // ECLSS Life Support Unit
    const w = 22 * zoom;
    const h = 20 * zoom;
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - w / 2, cy - h, w, h);
    ctx.strokeRect(cx - w / 2, cy - h, w, h);

    // Water filtration conduits
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6 * zoom, cy - h + 3);
    ctx.lineTo(cx - 6 * zoom, cy - 3);
    ctx.moveTo(cx + 6 * zoom, cy - h + 3);
    ctx.lineTo(cx + 6 * zoom, cy - 3);
    ctx.stroke();
  } else if (mId.includes('garage') || mId.includes('rover')) {
    // Rover Garage Bay
    const w = 28 * zoom;
    const h = 18 * zoom;
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - w / 2, cy - h, w, h);
    ctx.strokeRect(cx - w / 2, cy - h, w, h);

    // Ramp entrance
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(cx - w / 3, cy - 4, (2 * w) / 3, 4);
  } else if (mId.includes('drill') || mId.includes('ice')) {
    // Thermal Ice Drill Derrick
    const h = 32 * zoom;
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    // Tripod derrick
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx - 12 * zoom, cy);
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + 12 * zoom, cy);
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Condenser cryo tank
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(cx + 4 * zoom, cy - 14 * zoom, 10 * zoom, 12 * zoom);
  } else if (mId.includes('kilopower') || mId.includes('nuclear')) {
    // Kilopower KRUSTY Fission Reactor
    const h = 28 * zoom;
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 4 * zoom, cy - h, 8 * zoom, h);

    // Heat pipe radiator umbrella
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx - 16 * zoom, cy - h + 8 * zoom);
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + 16 * zoom, cy - h + 8 * zoom);
    ctx.stroke();

    // Radiation caution pulse
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(cx, cy - h + 2, 3 * zoom, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // General Base Module (Industrial Block)
    const w = 22 * zoom;
    const h = 18 * zoom;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - w / 2, cy - h, w, h);
    ctx.strokeRect(cx - w / 2, cy - h, w, h);
  }

  // Under Construction Holographic Scaffolding
  if (module.isConstructing) {
    const scafH = 34 * zoom;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fillRect(cx - 16 * zoom, cy - scafH, 32 * zoom, scafH);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(cx - 16 * zoom, cy - scafH, 32 * zoom, scafH);
    ctx.setLineDash([]);

    // Construction progress percentage text
    ctx.fillStyle = '#FDE047';
    ctx.font = `bold ${Math.round(10 * zoom)}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${module.constructionProgressPct}%`, cx, cy - scafH - 4);
  } else {
    // Health / Durability Bar above module
    const barW = 24 * zoom;
    const barH = 3 * zoom;
    const barY = cy - 42 * zoom;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(cx - barW / 2, barY, barW, barH);

    const dur = module.durabilityPct;
    let durColor = '#10B981'; // Green >= 70%
    if (dur < 30) durColor = '#EF4444'; // Red < 30%
    else if (dur < 70) durColor = '#F59E0B'; // Yellow 30-70%

    ctx.fillStyle = durColor;
    ctx.fillRect(cx - barW / 2, barY, (dur / 100) * barW, barH);
  }
}
