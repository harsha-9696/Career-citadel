import React from 'react';
import { OfficeZone } from '../../types';

interface MiniMapProps {
  playerPos: [number, number, number];
  playerRotY: number;
  onTeleport: (pos: [number, number, number], zone?: OfficeZone) => void;
}

export function MiniMap({ playerPos, playerRotY, onTeleport }: MiniMapProps) {
  // Office bounds: X in [-24, 24] (width 48), Z in [-25, 13] (depth 38)
  const mapWidth = 140;
  const mapHeight = 110;

  // Conversion functions from 3D world coordinates to MiniMap SVG coordinates
  const worldToMapX = (x: number) => {
    return ((x + 24) / 48) * mapWidth;
  };

  const worldToMapY = (z: number) => {
    // World -Z is North (top of map), World +Z is South (bottom of map)
    return ((z + 25) / 38) * mapHeight;
  };

  const stations: { id: OfficeZone; label: string; x: number; z: number; color: string; icon: string }[] = [
    { id: 'lobby', label: 'Veena', x: 16.5, z: 6.0, color: '#10b981', icon: 'V' },
    { id: 'scanner', label: 'Babu', x: -16.5, z: 6.0, color: '#3b82f6', icon: 'B' },
    { id: 'warroom', label: 'Ravi', x: 16.5, z: -6.5, color: '#8b5cf6', icon: 'R' },
    { id: 'holodeck', label: 'Radha', x: -16.5, z: -6.5, color: '#06b6d4', icon: 'Rd' },
    { id: 'corner', label: 'Harsha', x: 0, z: -19.0, color: '#ef4444', icon: 'H' },
  ];

  const px = worldToMapX(playerPos[0]);
  const py = worldToMapY(playerPos[2]);

  return (
    <div className="glass-panel p-2.5 rounded-2xl shadow-xl border border-slate-200 bg-white/80 backdrop-blur-md select-none">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Citadel Radar
        </span>
        <span className="text-[9px] font-mono text-slate-400">Click to warp</span>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-inner">
        <svg width={mapWidth} height={mapHeight} className="block">
          {/* Subtle architectural floor grid */}
          <pattern id="radarGrid" width="14" height="11" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 11" fill="none" stroke="#1e293b" strokeWidth="0.8" />
          </pattern>
          <rect width={mapWidth} height={mapHeight} fill="url(#radarGrid)" />

          {/* Central Promenade corridor outline */}
          <rect
            x={worldToMapX(-7.5)}
            y={worldToMapY(-13.0)}
            width={worldToMapX(7.5) - worldToMapX(-7.5)}
            height={worldToMapY(12.5) - worldToMapY(-13.0)}
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {/* Room Outlines */}
          {/* Room 1 (Veena - East Front) */}
          <rect
            x={worldToMapX(7.5)}
            y={worldToMapY(0)}
            width={worldToMapX(23.5) - worldToMapX(7.5)}
            height={worldToMapY(12.0) - worldToMapY(0)}
            fill="#064e3b"
            opacity="0.25"
            stroke="#10b981"
            strokeWidth="0.8"
          />
          {/* Room 2 (Babu - West Front) */}
          <rect
            x={worldToMapX(-23.5)}
            y={worldToMapY(0)}
            width={worldToMapX(-7.5) - worldToMapX(-23.5)}
            height={worldToMapY(12.0) - worldToMapY(0)}
            fill="#1e3a8a"
            opacity="0.25"
            stroke="#3b82f6"
            strokeWidth="0.8"
          />
          {/* Room 3 (Ravi - East Rear) */}
          <rect
            x={worldToMapX(7.5)}
            y={worldToMapY(-13.0)}
            width={worldToMapX(23.5) - worldToMapX(7.5)}
            height={worldToMapY(0) - worldToMapY(-13.0)}
            fill="#3b0764"
            opacity="0.25"
            stroke="#8b5cf6"
            strokeWidth="0.8"
          />
          {/* Room 4 (Radha - West Rear) */}
          <rect
            x={worldToMapX(-23.5)}
            y={worldToMapY(-13.0)}
            width={worldToMapX(-7.5) - worldToMapX(-23.5)}
            height={worldToMapY(0) - worldToMapY(-13.0)}
            fill="#0e7490"
            opacity="0.25"
            stroke="#06b6d4"
            strokeWidth="0.8"
          />
          {/* Room 5 (Harsha - Penthouse) */}
          <rect
            x={worldToMapX(-12.0)}
            y={worldToMapY(-24.5)}
            width={worldToMapX(12.0) - worldToMapX(-12.0)}
            height={worldToMapY(-13.0) - worldToMapY(-24.5)}
            fill="#7f1d1d"
            opacity="0.25"
            stroke="#ef4444"
            strokeWidth="0.8"
          />

          {/* Interactive Agent Room Markers */}
          {stations.map((st) => {
            const sx = worldToMapX(st.x);
            const sy = worldToMapY(st.z);
            return (
              <g
                key={st.id}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onTeleport([st.x, 0, st.z + (st.id === 'corner' ? 3.0 : 0)], st.id)}
              >
                <circle cx={sx} cy={sy} r="6.5" fill={st.color} fillOpacity="0.85" stroke="#ffffff" strokeWidth="1" />
                <text
                  x={sx}
                  y={sy + 2.5}
                  fontSize="7"
                  fill="#ffffff"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {st.icon}
                </text>
              </g>
            );
          })}

          {/* Player Beacon with Rotation Heading Arrow */}
          <g transform={`translate(${px}, ${py})`}>
            {/* Radar ripple */}
            <circle cx="0" cy="0" r="7" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.5" className="animate-ping" />
            <circle cx="0" cy="0" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
            {/* Direction cone */}
            <g transform={`rotate(${(playerRotY * 180) / Math.PI + 180})`}>
              <polygon points="0,-8 -3,-2 3,-2" fill="#f59e0b" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
