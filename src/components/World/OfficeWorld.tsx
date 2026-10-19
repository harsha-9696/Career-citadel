import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { OfficeZone } from '../../types';
import { DelegationCharacter, CharacterAnimation } from './DelegationCharacter';
import { playFootstepSound, playChairSitSound, playChimeSound } from '../../services/sound';

export interface OfficeWorldProps {
  onInteractStation: (zone: OfficeZone) => void;
  activeInteraction: OfficeZone | null;
  onCloseInteraction: () => void;
  onPlayerMove?: (pos: [number, number, number], rotY: number) => void;
  targetTeleport?: [number, number, number] | null;
  onTeleportComplete?: () => void;
}

export interface StationData {
  id: OfficeZone;
  name: string;
  role: string;
  roomName: string;
  roomNumber: string;
  icon: string;
  color: string;
  pos: [number, number, number];
  rotY: number;
  hasCap?: boolean;
  hasHeadphones?: boolean;
}

// ── 5 Agent Stations in 5 Spacious Suites (Agents seated behind desks facing candidates) ──
const STATIONS: StationData[] = [
  {
    id: 'lobby',
    name: 'Veena',
    role: 'Career Concierge & Navigator',
    roomName: 'Intake & Profile Suite',
    roomNumber: 'ROOM 01',
    icon: '🌟',
    color: '#10b981', // emerald
    pos: [15.5, 0, 6.0],
    rotY: Math.PI / 2, // Agent at East back wall (+Z), faces West towards doorway
  },
  {
    id: 'scanner',
    name: 'Babu',
    role: 'ATS Forensic Auditor',
    roomName: 'ATS Forensic Lab',
    roomNumber: 'ROOM 02',
    icon: '🔍',
    color: '#3b82f6', // blue
    pos: [-15.5, 0, 6.0],
    rotY: -Math.PI / 2, // Agent at West back wall (+Z), faces East towards doorway
    hasCap: true,
  },
  {
    id: 'warroom',
    name: 'Ravi',
    role: 'Staff Architect & Interview Lead',
    roomName: 'Technical War Room',
    roomNumber: 'ROOM 03',
    icon: '💻',
    color: '#8b5cf6', // purple
    pos: [15.5, 0, -6.5],
    rotY: Math.PI / 2, // Agent at East back wall (+Z), faces West towards doorway
    hasHeadphones: true,
  },
  {
    id: 'holodeck',
    name: 'Radha',
    role: 'Quantum Career Strategist',
    roomName: 'Quantum Strategy Pod',
    roomNumber: 'ROOM 04',
    icon: '🧭',
    color: '#06b6d4', // cyan
    pos: [-15.5, 0, -6.5],
    rotY: -Math.PI / 2, // Agent at West back wall (+Z), faces East towards doorway
  },
  {
    id: 'corner',
    name: 'Harsha',
    role: 'Brutal Executive Partner',
    roomName: 'The Corner Penthouse',
    roomNumber: 'ROOM 05',
    icon: '⚡',
    color: '#ef4444', // red
    pos: [0, 0, -19.0],
    rotY: Math.PI, // Agent at North back wall (+Z), faces South towards entrance
  },
];

// ── Calculate Exact World Position of Visitor Chair for Each Station ──
function getVisitorChairWorldPos(stationId: OfficeZone): { pos: [number, number, number]; rotY: number } {
  const station = STATIONS.find((s) => s.id === stationId);
  if (!station) return { pos: [0, 0, 0], rotY: 0 };

  const localZ = -1.35;
  const sin = Math.sin(station.rotY);
  const cos = Math.cos(station.rotY);
  const worldX = station.pos[0] + localZ * sin;
  const worldZ = station.pos[2] + localZ * cos;

  return {
    pos: [worldX, 0, worldZ],
    rotY: station.rotY, // Candidate faces toward desk and agent across table
  };
}

// ── Calculate Exact World Position to Stand Up into Open Floor Space ──
function getVisitorStandWorldPos(stationId: OfficeZone): { pos: [number, number, number]; rotY: number } {
  const station = STATIONS.find((s) => s.id === stationId);
  if (!station) return { pos: [0, 0, 8.0], rotY: Math.PI };

  const localZ = -2.3; // Cleanly steps back 2.3m into open room floor with zero collision
  const sin = Math.sin(station.rotY);
  const cos = Math.cos(station.rotY);
  const worldX = station.pos[0] + localZ * sin;
  const worldZ = station.pos[2] + localZ * cos;

  return {
    pos: [worldX, 0, worldZ],
    rotY: station.rotY,
  };
}

// ── Physical Collision Engine (AABB Obstacles for Expanded Citadel) ──
interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const OBSTACLES: BoxObstacle[] = [
  // 1. Central Promenade Lounge Sofa & Coffee Table
  { minX: -2.4, maxX: 2.4, minZ: -0.8, maxZ: 1.4 },

  // 2. Desks & Agent Workstations (ONLY the physical desk and back chair — visitor area is kept 100% open!)
  // Veena's Suite (Room 1)
  { minX: 15.8, maxX: 18.2, minZ: 4.6, maxZ: 7.4 },
  // Babu's Suite (Room 2)
  { minX: -18.2, maxX: -15.8, minZ: 4.6, maxZ: 7.4 },
  // Ravi's War Room (Room 3)
  { minX: 15.8, maxX: 18.2, minZ: -7.9, maxZ: -5.1 },
  // Radha's Pod (Room 4)
  { minX: -18.2, maxX: -15.8, minZ: -7.9, maxZ: -5.1 },
  // Harsha's Executive Penthouse Desk (Room 5)
  { minX: -2.0, maxX: 2.0, minZ: -20.8, maxZ: -18.3 },

  // 3. Hallway Promenade Potted Plants
  { minX: -6.4, maxX: -5.2, minZ: 6.9, maxZ: 8.1 },
  { minX: 5.2, maxX: 6.4, minZ: 6.9, maxZ: 8.1 },
  { minX: -6.4, maxX: -5.2, minZ: -1.6, maxZ: -0.4 },
  { minX: 5.2, maxX: 6.4, minZ: -1.6, maxZ: -0.4 },

  // 4. Glass Partition Walls (Solid sections; doorways [4.2, 7.8] and [-8.3, -4.7] left completely open!)
  // East Glass Wall at x = 7.5
  { minX: 7.2, maxX: 7.8, minZ: 0.2, maxZ: 4.2 },
  { minX: 7.2, maxX: 7.8, minZ: 7.8, maxZ: 12.0 },
  { minX: 7.2, maxX: 7.8, minZ: -4.7, maxZ: -0.2 },
  { minX: 7.2, maxX: 7.8, minZ: -13.0, maxZ: -8.3 },

  // West Glass Wall at x = -7.5
  { minX: -7.8, maxX: -7.2, minZ: 0.2, maxZ: 4.2 },
  { minX: -7.8, maxX: -7.2, minZ: 7.8, maxZ: 12.0 },
  { minX: -7.8, maxX: -7.2, minZ: -4.7, maxZ: -0.2 },
  { minX: -7.8, maxX: -7.2, minZ: -13.0, maxZ: -8.3 },

  // North Penthouse Wall at z = -13.0 (Grand doorway [-2.4, 2.4] left open!)
  { minX: -7.5, maxX: -2.4, minZ: -13.3, maxZ: -12.7 },
  { minX: 2.4, maxX: 7.5, minZ: -13.3, maxZ: -12.7 },

  // Solid Dividers between Room 1 & 3 at z = 0
  { minX: 7.5, maxX: 23.5, minZ: -0.3, maxZ: 0.3 },
  // Solid Dividers between Room 2 & 4 at z = 0
  { minX: -23.5, maxX: -7.5, minZ: -0.3, maxZ: 0.3 },
];

function checkCollision(x: number, z: number, playerRadius = 0.38): boolean {
  if (x < -22.5 || x > 22.5 || z < -23.5 || z > 11.5) return true;

  for (const b of OBSTACLES) {
    if (
      x + playerRadius > b.minX &&
      x - playerRadius < b.maxX &&
      z + playerRadius > b.minZ &&
      z - playerRadius < b.maxZ
    ) {
      return true;
    }
  }

  return false;
}

// ── Room Entrance Signage ──
function RoomSign({
  position,
  rotation = [0, 0, 0],
  roomNumber,
  roomName,
  color,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  roomNumber: string;
  roomName: string;
  color: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Box body - sleek dark architectural plate */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.8, 0.5, 0.12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Front Accent Stripe & Text (facing outward towards candidate) */}
      <mesh position={[0, -0.23, 0.065]}>
        <boxGeometry args={[2.7, 0.04, 0.01]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.09, 0.065]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {roomNumber}
      </Text>
      <Text
        position={[0, -0.08, 0.065]}
        fontSize={0.095}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
      >
        {roomName}
      </Text>

      {/* Back Accent Stripe & Text (facing inward into room) */}
      <mesh position={[0, -0.23, -0.065]}>
        <boxGeometry args={[2.7, 0.04, 0.01]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.09, -0.065]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {roomNumber}
      </Text>
      <Text
        position={[0, -0.08, -0.065]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.095}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
      >
        {roomName}
      </Text>
    </group>
  );
}

// ── Luxury Walnut Acoustic Wood Slat Feature Wall ──
function AcousticWoodSlatWall({
  position,
  rotation = [0, 0, 0],
  width = 6.4,
  height = 3.4,
  slatCount = 20,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  slatCount?: number;
}) {
  const slatWidth = (width / slatCount) * 0.55;
  const spacing = width / slatCount;

  return (
    <group position={position} rotation={rotation}>
      {/* Charcoal felt acoustic backdrop */}
      <mesh receiveShadow position={[0, height / 2, -0.015]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#18181b" roughness={0.9} />
      </mesh>
      {/* Vertical fluted walnut slats */}
      {Array.from({ length: slatCount }).map((_, i) => (
        <mesh
          key={i}
          position={[-width / 2 + (i + 0.5) * spacing, height / 2, 0.015]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[slatWidth, height, 0.03]} />
          <meshStandardMaterial color="#543820" roughness={0.65} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

// ── Recessed Linear Architectural LED Ceiling Light Troughs ──
function LinearCeilingLights() {
  return (
    <group position={[0, 3.82, 0]}>
      {/* Central Promenade Dual Linear LED Channels */}
      <mesh position={[-2.8, 0, -6]}>
        <boxGeometry args={[0.16, 0.05, 34]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[2.8, 0, -6]}>
        <boxGeometry args={[0.16, 0.05, 34]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </mesh>

      {/* East & West Suite Transverse Lights */}
      <mesh position={[15.5, 0, 6.0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.14, 0.05, 11]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[-15.5, 0, 6.0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.14, 0.05, 11]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[15.5, 0, -6.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.14, 0.05, 11]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[-15.5, 0, -6.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.14, 0.05, 11]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
      </mesh>

      {/* Penthouse Executive Suite Light Bar */}
      <mesh position={[0, 0, -19.0]}>
        <boxGeometry args={[14, 0.05, 0.14]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.0} />
      </mesh>
    </group>
  );
}

// ── Crystal Clear Glass Wall with Doorway (Zero Transmission Ghosting) ──
function GlassWallWithDoor({
  position,
  rotation = [0, 0, 0],
  width = 12,
  height = 3.6,
  doorWidth = 3.6,
  doorHeight = 2.7,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  doorWidth?: number;
  doorHeight?: number;
}) {
  const sideWidth = (width - doorWidth) / 2;
  const lintelHeight = height - doorHeight;

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-width / 2 + sideWidth / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sideWidth, height, 0.08]} />
        <meshStandardMaterial
          color="#bfdbfe"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.25}
        />
      </mesh>

      <mesh position={[width / 2 - sideWidth / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sideWidth, height, 0.08]} />
        <meshStandardMaterial
          color="#bfdbfe"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.25}
        />
      </mesh>

      <mesh position={[0, doorHeight + lintelHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, lintelHeight, 0.08]} />
        <meshStandardMaterial
          color="#bfdbfe"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.25}
        />
      </mesh>

      <mesh position={[-doorWidth / 2, doorHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.08, doorHeight, 0.12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[doorWidth / 2, doorHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.08, doorHeight, 0.12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, doorHeight, 0]} castShadow>
        <boxGeometry args={[doorWidth + 0.08, 0.08, 0.12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ── Solid Wall with Baseboard ──
function SolidWall({
  position,
  args,
}: {
  position: [number, number, number];
  args: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color="#f8fafc" roughness={0.85} />
      </mesh>
      <mesh position={[0, -args[1] / 2 + 0.08, 0]}>
        <boxGeometry args={[args[0] + 0.02, 0.16, args[2] + 0.02]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── Designer Room Floor Rug ──
function RoomRug({
  position,
  width = 12,
  depth = 10,
  color,
}: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  color: string;
}) {
  return (
    <mesh position={[position[0], 0.005, position[2]]} receiveShadow>
      <boxGeometry args={[width, 0.01, depth]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

// ── Modern Office Plant ──
function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.22, 0.8, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.79, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.03, 16]} />
        <meshStandardMaterial color="#271c19" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.6} />
      </mesh>
      <mesh position={[0.15, 1.65, 0.1]} castShadow>
        <sphereGeometry args={[0.42, 10, 10]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ── Ergonomic Swivel Mesh Office Chair (Correctly Oriented & No Clipping) ──
function OfficeChair({
  position,
  rotationY = 0,
  color = '#1e293b',
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Star Base & Wheels */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.04, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Padded Seat Cushion */}
      <RoundedBox args={[0.58, 0.08, 0.54]} radius={0.03} position={[0, 0.44, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.7} />
      </RoundedBox>
      {/* Mesh Backrest (positioned at +Z so someone facing -Z rests against it) */}
      <RoundedBox args={[0.52, 0.6, 0.06]} radius={0.03} position={[0, 0.78, 0.26]} castShadow>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
      {/* Ergonomic Armrests (widened to 0.68m to guarantee zero character hip clipping) */}
      <mesh position={[-0.34, 0.6, 0.05]} castShadow>
        <boxGeometry args={[0.06, 0.24, 0.32]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
      <mesh position={[0.34, 0.6, 0.05]} castShadow>
        <boxGeometry args={[0.06, 0.24, 0.32]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
    </group>
  );
}

// ── Ergonomically Aligned Workstation (Agent at +1.05m facing -Z, Visitor at -1.35m facing +Z) ──
function WorkstationDesk({
  position,
  rotationY = 0,
  accentColor,
  monitorCount = 1,
}: {
  position: [number, number, number];
  rotationY?: number;
  accentColor: string;
  monitorCount?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Birch Wood Table Top */}
      <RoundedBox args={[2.8, 0.08, 1.3]} radius={0.03} position={[0, 0.76, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e5ddd0" roughness={0.4} />
      </RoundedBox>

      {/* Dark Steel Sturdy Legs */}
      <mesh position={[-1.25, 0.38, -0.52]} castShadow>
        <boxGeometry args={[0.07, 0.76, 0.07]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[1.25, 0.38, -0.52]} castShadow>
        <boxGeometry args={[0.07, 0.76, 0.07]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[-1.25, 0.38, 0.52]} castShadow>
        <boxGeometry args={[0.07, 0.76, 0.07]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[1.25, 0.38, 0.52]} castShadow>
        <boxGeometry args={[0.07, 0.76, 0.07]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Desk Mat with Accent Strip */}
      <mesh position={[0, 0.805, 0.0]} receiveShadow>
        <boxGeometry args={[1.5, 0.01, 0.65]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Keyboard & Mouse on Desk (positioned for agent at +Z facing -Z) */}
      <mesh position={[0, 0.815, 0.22]}>
        <boxGeometry args={[0.55, 0.015, 0.18]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0.38, 0.815, 0.22]}>
        <boxGeometry args={[0.08, 0.02, 0.12]} />
        <meshStandardMaterial color="#475569" roughness={0.3} />
      </mesh>

      {/* Monitor Display Screen (screen faces agent at +Z; back faces candidate at -Z) */}
      <group position={[0, 0.81, -0.15]}>
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.28, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.28, 0.02, 0.2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <RoundedBox args={[1.1, 0.62, 0.04]} radius={0.02} position={[0, 0.46, 0]} castShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.46, 0.025]}>
          <planeGeometry args={[1.02, 0.54]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>

        {/* Second Screen if requested */}
        {monitorCount > 1 && (
          <group position={[0.65, 0.04, -0.06]} rotation={[0, Math.PI / 6, 0]}>
            <RoundedBox args={[0.5, 0.8, 0.04]} radius={0.02} position={[0, 0.48, 0]} castShadow>
              <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.48, 0.025]}>
              <planeGeometry args={[0.44, 0.72]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        )}
      </group>

      {/* Dedicated Office Chair for Agent (at +1.05m behind desk, facing -Z toward candidate) */}
      <OfficeChair position={[0, 0, 1.05]} rotationY={0} color="#1e293b" />

      {/* Dedicated Visitor Chair for Candidate (at -1.35m in front of desk, facing +Z toward agent) */}
      <OfficeChair position={[0, 0, -1.35]} rotationY={Math.PI} color="#475569" />
    </group>
  );
}

// ── Harsha's Executive Corner Penthouse Suite ──
function ExecutivePenthouseSuite({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Warm Walnut Executive Desk */}
      <RoundedBox args={[3.6, 0.12, 1.5]} radius={0.04} position={[0, 0.84, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3e2723" roughness={0.35} metalness={0.15} />
      </RoundedBox>
      <mesh position={[-1.6, 0.42, 0]} castShadow>
        <boxGeometry args={[0.2, 0.84, 1.3]} />
        <meshStandardMaterial color="#271c19" roughness={0.4} />
      </mesh>
      <mesh position={[1.6, 0.42, 0]} castShadow>
        <boxGeometry args={[0.2, 0.84, 1.3]} />
        <meshStandardMaterial color="#271c19" roughness={0.4} />
      </mesh>

      {/* Desk Mat & Laptop */}
      <mesh position={[0, 0.905, 0.0]} receiveShadow>
        <boxGeometry args={[1.6, 0.01, 0.7]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.7} />
      </mesh>
      <group position={[0, 0.91, -0.15]}>
        <mesh position={[0, 0.01, 0]} castShadow>
          <boxGeometry args={[0.45, 0.02, 0.3]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.16, 0.14]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.28, 0.02]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.16, 0.128]} rotation={[0.3, 0, 0]}>
          <planeGeometry args={[0.42, 0.25]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Tall High-Back Executive Leather Chair for Harsha (at +1.15m, facing -Z toward candidate) */}
      <group position={[0, 0, 1.15]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.04, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <RoundedBox args={[0.66, 0.1, 0.62]} radius={0.04} position={[0, 0.45, 0]} castShadow>
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </RoundedBox>
        {/* High Executive Backrest */}
        <RoundedBox args={[0.62, 0.88, 0.08]} radius={0.04} position={[0, 0.94, 0.3]} castShadow>
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </RoundedBox>
      </group>

      {/* Luxury Visitor Armchairs (at -1.4m facing +Z toward Harsha) */}
      <OfficeChair position={[-0.8, 0, -1.4]} rotationY={Math.PI} color="#78350f" />
      <OfficeChair position={[0.8, 0, -1.4]} rotationY={Math.PI} color="#78350f" />

      {/* Executive Bookshelf Credenza Against Back Wall */}
      <group position={[0, 1.6, 3.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5.8, 3.0, 0.6]} />
          <meshStandardMaterial color="#271c19" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// ── Central Promenade Lounge ──
function CentralLounge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Modern Ochre Sofa */}
      <RoundedBox args={[3.8, 0.65, 1.2]} radius={0.08} position={[0, 0.35, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[3.8, 0.85, 0.32]} radius={0.08} position={[0, 0.85, -0.44]} castShadow>
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </RoundedBox>

      {/* Round Glass Coffee Table (Clean standard glass, no ghosting) */}
      <mesh position={[0, 0.35, 1.2]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 24]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.1} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.17, 1.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.34, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
    </group>
  );
}

// ── Entire Office Building Architecture (Expanded, Grand Citadel with Backdrops) ──
function CitadelArchitecture() {
  return (
    <group>
      {/* ── Single Massive Floor Slab with Architectural Polished Terrazzo Sheen ── */}
      <mesh position={[0, -0.1, -6]} receiveShadow>
        <boxGeometry args={[48, 0.2, 38]} />
        <meshStandardMaterial color="#d4c3a3" roughness={0.4} metalness={0.12} />
      </mesh>

      {/* ── Recessed Linear Ceiling LED Channels ── */}
      <LinearCeilingLights />

      {/* ── Luxurious Room Area Rugs ── */}
      <RoomRug position={[15.5, 0, 6.0]} width={13} depth={10} color="#064e3b" />
      <RoomRug position={[-15.5, 0, 6.0]} width={13} depth={10} color="#1e3a8a" />
      <RoomRug position={[15.5, 0, -6.5]} width={13} depth={10} color="#3b0764" />
      <RoomRug position={[-15.5, 0, -6.5]} width={13} depth={10} color="#0e7490" />
      <RoomRug position={[0, 0, -19.0]} width={18} depth={10} color="#7f1d1d" />

      {/* ── Architectural Walnut Wood Slat Feature Walls ── */}
      {/* Veena's Suite East Feature Wall */}
      <AcousticWoodSlatWall position={[23.3, 0, 6.0]} rotation={[0, -Math.PI / 2, 0]} width={7.0} height={3.6} slatCount={22} />
      {/* Babu's Suite West Feature Wall */}
      <AcousticWoodSlatWall position={[-23.3, 0, 6.0]} rotation={[0, Math.PI / 2, 0]} width={7.0} height={3.6} slatCount={22} />
      {/* Radha's Strategy Pod West Feature Wall */}
      <AcousticWoodSlatWall position={[-23.3, 0, -6.5]} rotation={[0, Math.PI / 2, 0]} width={7.0} height={3.6} slatCount={22} />
      {/* Harsha's Penthouse Flanking Feature Walls */}
      <AcousticWoodSlatWall position={[-14.5, 0, -24.2]} width={6.0} height={3.6} slatCount={18} />
      <AcousticWoodSlatWall position={[14.5, 0, -24.2]} width={6.0} height={3.6} slatCount={18} />

      {/* ── Suite Specific Backdrops & Whiteboards ── */}
      {/* Ravi's War Room: Huge Architecture Whiteboard mounted on East wall behind him */}
      <group position={[23.3, 2.0, -6.5]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5.2, 2.2, 0.06]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[5.3, 2.3, 0.05]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
        <Text position={[0, 0.8, 0.04]} fontSize={0.16} color="#475569">
          SYSTEM ARCHITECTURE // TECHNICAL WAR ROOM
        </Text>
      </group>

      {/* Harsha's Penthouse: Skyline City Window Panorama on North wall behind him */}
      <group position={[0, 2.3, -24.3]}>
        <mesh receiveShadow>
          <boxGeometry args={[16.0, 3.4, 0.05]} />
          <meshBasicMaterial color="#090d16" />
        </mesh>
        {/* Futuristic Glowing Skyline Silhouettes */}
        <mesh position={[-4.5, -0.4, 0.03]}>
          <boxGeometry args={[1.6, 2.2, 0.02]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-2.2, 0.1, 0.03]}>
          <boxGeometry args={[1.4, 3.0, 0.02]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh position={[0, -0.1, 0.03]}>
          <boxGeometry args={[2.2, 2.7, 0.02]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <mesh position={[2.5, 0.3, 0.03]}>
          <boxGeometry args={[1.5, 3.2, 0.02]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh position={[5.0, -0.3, 0.03]}>
          <boxGeometry args={[1.8, 2.4, 0.02]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Babu's ATS Forensic Lab: Wall Metric Panels behind him */}
      <group position={[-23.3, 2.0, 6.0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.8, 2.2, 0.06]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
        </mesh>
        <Text position={[0, 0.7, 0.04]} fontSize={0.14} color="#38bdf8">
          ATS FORENSIC AUDIT // LIVE SCAN MATRIX
        </Text>
      </group>

      {/* ── Glass Walls with Wide Doorways into 5 Separate Suites ── */}
      {/* Room 01 (Veena - East Front) */}
      <GlassWallWithDoor
        position={[7.5, 0, 6.0]}
        rotation={[0, Math.PI / 2, 0]}
        width={12}
        height={3.6}
        doorWidth={3.6}
      />
      <RoomSign
        position={[7.5, 2.9, 6.0]}
        rotation={[0, -Math.PI / 2, 0]}
        roomNumber="ROOM 01"
        roomName="Intake & Profile (Veena)"
        color="#10b981"
      />

      {/* Room 02 (Babu - West Front) */}
      <GlassWallWithDoor
        position={[-7.5, 0, 6.0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={12}
        height={3.6}
        doorWidth={3.6}
      />
      <RoomSign
        position={[-7.5, 2.9, 6.0]}
        rotation={[0, Math.PI / 2, 0]}
        roomNumber="ROOM 02"
        roomName="ATS Forensic Lab (Babu)"
        color="#3b82f6"
      />

      {/* Room 03 (Ravi - East Rear) */}
      <GlassWallWithDoor
        position={[7.5, 0, -6.5]}
        rotation={[0, Math.PI / 2, 0]}
        width={12}
        height={3.6}
        doorWidth={3.6}
      />
      <RoomSign
        position={[7.5, 2.9, -6.5]}
        rotation={[0, -Math.PI / 2, 0]}
        roomNumber="ROOM 03"
        roomName="Tech War Room (Ravi)"
        color="#8b5cf6"
      />

      {/* Room 04 (Radha - West Rear) */}
      <GlassWallWithDoor
        position={[-7.5, 0, -6.5]}
        rotation={[0, -Math.PI / 2, 0]}
        width={12}
        height={3.6}
        doorWidth={3.6}
      />
      <RoomSign
        position={[-7.5, 2.9, -6.5]}
        rotation={[0, Math.PI / 2, 0]}
        roomNumber="ROOM 04"
        roomName="Quantum Strategy Pod (Radha)"
        color="#06b6d4"
      />

      {/* Room 05 (Harsha - North Penthouse) */}
      <GlassWallWithDoor
        position={[0, 0, -13.0]}
        rotation={[0, 0, 0]}
        width={15}
        height={3.8}
        doorWidth={4.8}
      />
      <RoomSign
        position={[0, 3.1, -12.94]}
        rotation={[0, 0, 0]}
        roomNumber="ROOM 05 // PENTHOUSE"
        roomName="Executive Corner Office (Harsha)"
        color="#ef4444"
      />

      {/* ── Internal Dividing Walls ── */}
      <SolidWall position={[15.5, 1.8, 0]} args={[16, 3.6, 0.25]} />
      <SolidWall position={[-15.5, 1.8, 0]} args={[16, 3.6, 0.25]} />

      {/* ── Outer Perimeter Studio Walls ── */}
      <SolidWall position={[23.5, 2.0, -6]} args={[0.3, 4.0, 38]} />
      <SolidWall position={[-23.5, 2.0, -6]} args={[0.3, 4.0, 38]} />
      <SolidWall position={[0, 2.0, 12.5]} args={[48, 4.0, 0.3]} />
      <SolidWall position={[0, 2.0, -24.5]} args={[48, 4.0, 0.3]} />
    </group>
  );
}

// ── Interactive Agent Station with Ergonomic Seating ──
function AgentStation({
  station,
  isNearby,
  isInteracting = false,
  onInteract,
}: {
  station: StationData;
  isNearby: boolean;
  isInteracting?: boolean;
  onInteract: () => void;
}) {
  const haloRef = useRef<THREE.Mesh>(null!);
  const [idleAnim, setIdleAnim] = useState<CharacterAnimation>('Sit_Work');

  useEffect(() => {
    const cycle = () => {
      setIdleAnim((prev) => (prev === 'Sit_Work' ? 'Sit_Idle' : 'Sit_Work'));
    };
    const interval = setInterval(cycle, 8000 + station.id.length * 1500);
    return () => clearInterval(interval);
  }, [station.id]);

  useFrame(({ clock }) => {
    if (haloRef.current && isNearby && !isInteracting) {
      haloRef.current.rotation.z = clock.getElapsedTime() * 1.5;
    }
  });

  const agentAnim: CharacterAnimation = isInteracting || isNearby ? 'Sit_Idle' : idleAnim;

  return (
    <group position={station.pos} rotation={[0, station.rotY, 0]}>
      {/* Proximity Glowing Floor Halo */}
      {isNearby && !isInteracting && (
        <mesh ref={haloRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.2, 32]} />
          <meshBasicMaterial color={station.color} transparent opacity={0.85} depthTest={true} />
        </mesh>
      )}

      {/* Agent is seated ergonomically behind desk at [0, 0, 1.05] facing -Z towards entering candidate! */}
      <group position={[0, 0, station.id === 'corner' ? 1.15 : 1.05]} rotation={[0, Math.PI, 0]}>
        <DelegationCharacter
          position={[0, 0, 0]}
          color={station.color}
          animation={agentAnim}
          isTalking={isInteracting}
          hasCap={station.hasCap}
          hasHeadphones={station.hasHeadphones}
          onClick={onInteract}
          scale={0.95}
        />
      </group>

      {/* Workstation Furniture */}
      {station.id === 'corner' ? (
        <ExecutivePenthouseSuite position={[0, 0, 0]} />
      ) : (
        <WorkstationDesk
          position={[0, 0, 0]}
          accentColor={station.color}
          monitorCount={station.id === 'scanner' || station.id === 'warroom' ? 2 : 1}
        />
      )}

      {/* Floating 3D Action Badge (positioned above desk facing candidate - hidden during consultation) */}
      {isNearby && !isInteracting && (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
          <group position={[0, 2.5, -0.2]} onClick={onInteract}>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[2.6, 0.65, 0.08]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[2.52, 0.57]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <Text
              position={[0, 0.12, 0.05]}
              fontSize={0.13}
              color={station.color}
              anchorX="center"
              anchorY="middle"
            >
              {`[E] Consult ${station.name}`}
            </Text>
            <Text
              position={[0, -0.12, 0.05]}
              fontSize={0.09}
              color="#475569"
              anchorX="center"
              anchorY="middle"
            >
              {station.roomName}
            </Text>
          </group>
        </Float>
      )}
    </group>
  );
}

// ── Smooth Angular Interpolation (Shortest circular arc) ──
function lerpAngle(current: number, target: number, t: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return current + diff * THREE.MathUtils.clamp(t, 0, 1);
}

// ── Main Office World Component ──
export function OfficeWorld({
  onInteractStation,
  activeInteraction,
  onCloseInteraction,
  onPlayerMove,
  targetTeleport,
  onTeleportComplete,
}: OfficeWorldProps) {
  // Spawns player at entrance looking North into the citadel (-Z direction)
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 8.0]);
  const [playerRotY, setPlayerRotY] = useState(Math.PI);
  const [isWalking, setIsWalking] = useState(false);
  const [nearbyStation, setNearbyStation] = useState<StationData | null>(null);

  // Track last active station to guarantee standing up in the open room floor
  const lastActiveStationRef = useRef<OfficeZone | null>(null);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const cameraYawRef = useRef<number>(Math.PI);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);

  // Instant warp / teleport from Radar or Navigation
  useEffect(() => {
    if (targetTeleport) {
      setPlayerPos(targetTeleport);
      onTeleportComplete?.();
    }
  }, [targetTeleport, onTeleportComplete]);

  // Smoothly seat player in visitor chair when consulting agent, and stand up into open room floor upon exit!
  useEffect(() => {
    if (activeInteraction) {
      lastActiveStationRef.current = activeInteraction;
      const activeStation = STATIONS.find((s) => s.id === activeInteraction);
      if (activeStation) {
        const chair = getVisitorChairWorldPos(activeStation.id);
        setPlayerPos(chair.pos);
        setPlayerRotY(chair.rotY);
        playChairSitSound();
        playChimeSound();
      }
    } else {
      // Stand back up into wide open floor space upon closing modal (zero collision entrapment!)
      if (lastActiveStationRef.current) {
        const stand = getVisitorStandWorldPos(lastActiveStationRef.current);
        setPlayerPos(stand.pos);
        setPlayerRotY(stand.rotY);
      }
      playChairSitSound();
    }
  }, [activeInteraction]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartXRef.current;
      dragStartXRef.current = e.clientX;
      cameraYawRef.current -= deltaX * 0.005;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        keysPressed.current = {};
        if (activeInteraction) {
          onCloseInteraction();
        }
        return;
      }

      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === 'e' && nearbyStation && !activeInteraction) {
        onInteractStation(nearbyStation.id);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyStation, activeInteraction, onInteractStation, onCloseInteraction]);

  // Full seated animation when consulting agent, otherwise walking or idle!
  const playerAnim: CharacterAnimation = activeInteraction
    ? 'Sit_Idle'
    : isWalking
    ? 'Walk'
    : 'Idle';

  return (
    <div
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Canvas
        shadows
        camera={{ position: [0, 2.2, 11.6], fov: 48 }}
        className="w-full h-full"
        style={{ background: '#e2e8f0' }}
      >
        {/* ── Sunlight Lighting without Shadow Acne ── */}
        <ambientLight intensity={0.7} />
        <hemisphereLight args={['#ffffff', '#e2e8f0', 0.6]} />
        <directionalLight
          position={[16, 26, 18]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1.0}
          shadow-camera-far={60}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
          shadow-bias={-0.00005}
          shadow-normalBias={0.04}
        />
        <directionalLight position={[-14, 18, -14]} intensity={0.35} color="#e0f2fe" />

        {/* ── Architectural Building ── */}
        <CitadelArchitecture />

        {/* Central Promenade Lounge & Greenery */}
        <CentralLounge position={[0, 0, 0]} />
        <Plant position={[-5.8, 0, 7.5]} />
        <Plant position={[5.8, 0, 7.5]} />
        <Plant position={[-5.8, 0, -1.0]} />
        <Plant position={[5.8, 0, -1.0]} />
        <Plant position={[-5.8, 0, -9.5]} />
        <Plant position={[5.8, 0, -9.5]} />

        {/* ── 5 Agent Stations in 5 Separate Rooms ── */}
        {STATIONS.map((station) => (
          <AgentStation
            key={station.id}
            station={station}
            isNearby={nearbyStation?.id === station.id}
            isInteracting={activeInteraction === station.id}
            onInteract={() => onInteractStation(station.id)}
          />
        ))}

        {/* ── Genuine Player Character with Seated Animation ── */}
        <group position={playerPos} rotation={[0, playerRotY, 0]}>
          <DelegationCharacter
            position={[0, 0, 0]}
            color="#f59e0b"
            animation={playerAnim}
            scale={0.95}
          />
        </group>

        {/* ── Third-Person Perspective (TPP) Controller & Camera ── */}
        <GameController
          keysPressed={keysPressed}
          cameraYawRef={cameraYawRef}
          isDraggingRef={isDraggingRef}
          playerPos={playerPos}
          setPlayerPos={setPlayerPos}
          playerRotY={playerRotY}
          setPlayerRotY={setPlayerRotY}
          setIsWalking={setIsWalking}
          setNearbyStation={setNearbyStation}
          activeInteraction={activeInteraction}
          onPlayerMove={onPlayerMove}
        />
      </Canvas>
    </div>
  );
}

// ── Game Physics & Sliding Collision Loop with Third-Person Perspective (TPP) ──
function GameController({
  keysPressed,
  cameraYawRef,
  isDraggingRef,
  playerPos,
  setPlayerPos,
  playerRotY,
  setPlayerRotY,
  setIsWalking,
  setNearbyStation,
  activeInteraction,
  onPlayerMove,
}: {
  keysPressed: React.MutableRefObject<{ [key: string]: boolean }>;
  cameraYawRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
  playerPos: [number, number, number];
  setPlayerPos: React.Dispatch<React.SetStateAction<[number, number, number]>>;
  playerRotY: number;
  setPlayerRotY: React.Dispatch<React.SetStateAction<number>>;
  setIsWalking: React.Dispatch<React.SetStateAction<boolean>>;
  setNearbyStation: React.Dispatch<React.SetStateAction<StationData | null>>;
  activeInteraction: OfficeZone | null;
  onPlayerMove?: (pos: [number, number, number], rotY: number) => void;
}) {
  const speed = 5.2;
  const lookTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.25, 6.6));
  const footstepTimerRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    // ── During Active Consultation: Smooth Conversational Two-Shot Camera ──
    if (activeInteraction) {
      setIsWalking(false);
      const activeStation = STATIONS.find((s) => s.id === activeInteraction);
      if (activeStation) {
        const chair = getVisitorChairWorldPos(activeStation.id);
        const midX = (chair.pos[0] + activeStation.pos[0]) / 2;
        const midZ = (chair.pos[2] + activeStation.pos[2]) / 2;

        // Position camera to the side of table framing both seated figures
        let camTargetX = midX;
        let camTargetZ = midZ + 2.8;
        if (activeStation.id === 'corner') {
          camTargetX = midX + 2.8;
          camTargetZ = midZ;
        } else if (activeStation.pos[0] > 0) {
          camTargetX = midX - 1.2;
          camTargetZ = midZ + 2.6;
        } else {
          camTargetX = midX + 1.2;
          camTargetZ = midZ + 2.6;
        }

        const lerpSpeed = Math.min(5 * dt, 1);
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, camTargetX, lerpSpeed);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.7, lerpSpeed);
        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, camTargetZ, lerpSpeed);

        lookTargetRef.current.x = THREE.MathUtils.lerp(lookTargetRef.current.x, midX, lerpSpeed);
        lookTargetRef.current.y = THREE.MathUtils.lerp(lookTargetRef.current.y, 1.1, lerpSpeed);
        lookTargetRef.current.z = THREE.MathUtils.lerp(lookTargetRef.current.z, midZ, lerpSpeed);
        state.camera.lookAt(lookTargetRef.current);
      }
      return;
    }

    const keys = keysPressed.current;
    let fwd = 0;
    let strafe = 0;

    if (keys['w'] || keys['arrowup']) fwd += 1;
    if (keys['s'] || keys['arrowdown']) fwd -= 1;
    if (keys['d'] || keys['arrowright']) strafe += 1;
    if (keys['a'] || keys['arrowleft']) strafe -= 1;

    // Optional keyboard camera rotation with Q
    if (keys['q']) {
      cameraYawRef.current += 2.5 * dt;
    }

    const moving = fwd !== 0 || strafe !== 0;
    setIsWalking(moving);

    // Camera yaw determines movement direction
    const camYaw = cameraYawRef.current;
    const forwardX = Math.sin(camYaw);
    const forwardZ = Math.cos(camYaw);
    const rightX = -Math.cos(camYaw);
    const rightZ = Math.sin(camYaw);

    if (moving) {
      footstepTimerRef.current += dt;
      if (footstepTimerRef.current >= 0.38) {
        playFootstepSound();
        footstepTimerRef.current = 0;
      }

      let moveX = forwardX * fwd + rightX * strafe;
      let moveZ = forwardZ * fwd + rightZ * strafe;

      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      const stepX = moveX * speed * dt;
      const stepZ = moveZ * speed * dt;

      const targetX = playerPos[0] + stepX;
      const targetZ = playerPos[2] + stepZ;

      // Sliding collision resolution: test X and Z independently
      let newX = playerPos[0];
      let newZ = playerPos[2];

      if (!checkCollision(targetX, playerPos[2])) {
        newX = targetX;
      }
      if (!checkCollision(newX, targetZ)) {
        newZ = targetZ;
      }

      setPlayerPos([newX, 0, newZ]);

      // Turn character smoothly into direction of motion
      const targetMoveAngle = Math.atan2(moveX, moveZ);
      setPlayerRotY((prev) => lerpAngle(prev, targetMoveAngle, 14 * dt));
      onPlayerMove?.([newX, 0, newZ], targetMoveAngle);

      // Third-Person Follow: Camera smoothly swings behind character's back
      if (!isDraggingRef.current) {
        if (fwd >= 0) {
          cameraYawRef.current = lerpAngle(cameraYawRef.current, targetMoveAngle, 4.2 * dt);
        }
      }
    }

    // Proximity detection to stations
    let foundNearby: StationData | null = null;
    for (const station of STATIONS) {
      const dist = Math.hypot(playerPos[0] - station.pos[0], playerPos[2] - station.pos[2]);
      if (dist < 3.0) {
        foundNearby = station;
        break;
      }
    }
    setNearbyStation(foundNearby);

    // ── Third-Person Perspective (TPP) Camera Positioned Behind Character ──
    const camDist = 3.6;
    const camHeight = 2.05;
    const lookAheadDist = 1.4;

    const curYaw = cameraYawRef.current;

    // Camera position: offset behind character's back
    let targetCamX = playerPos[0] - Math.sin(curYaw) * camDist;
    const targetCamY = playerPos[1] + camHeight;
    let targetCamZ = playerPos[2] - Math.cos(curYaw) * camDist;

    // Perimeter boundary clamping: prevent clipping outside the office building
    targetCamX = THREE.MathUtils.clamp(targetCamX, -22.0, 22.0);
    targetCamZ = THREE.MathUtils.clamp(targetCamZ, -23.0, 11.0);

    // Smooth camera damping
    const lerpSpeed = Math.min(10 * dt, 1);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, lerpSpeed);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, lerpSpeed);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, lerpSpeed);

    // Look-at point: just over character's shoulders looking forward into rooms
    const targetLookX = playerPos[0] + Math.sin(curYaw) * lookAheadDist;
    const targetLookY = playerPos[1] + 1.25;
    const targetLookZ = playerPos[2] + Math.cos(curYaw) * lookAheadDist;

    lookTargetRef.current.x = THREE.MathUtils.lerp(lookTargetRef.current.x, targetLookX, lerpSpeed);
    lookTargetRef.current.y = THREE.MathUtils.lerp(lookTargetRef.current.y, targetLookY, lerpSpeed);
    lookTargetRef.current.z = THREE.MathUtils.lerp(lookTargetRef.current.z, targetLookZ, lerpSpeed);

    state.camera.lookAt(lookTargetRef.current);
  });

  return null;
}
