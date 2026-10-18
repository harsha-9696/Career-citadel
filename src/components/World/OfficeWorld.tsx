import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { OfficeZone } from '../../types';
import { DelegationCharacter, CharacterAnimation } from './DelegationCharacter';

interface OfficeWorldProps {
  onInteractStation: (zone: OfficeZone) => void;
  activeInteraction: OfficeZone | null;
  onCloseInteraction: () => void;
}

interface StationData {
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

const STATIONS: StationData[] = [
  {
    id: 'lobby',
    name: 'Veena',
    role: 'Career Concierge & Navigator',
    roomName: 'Intake & Profile Suite',
    roomNumber: 'ROOM 01',
    icon: '🌟',
    color: '#10b981', // emerald
    pos: [10, 0, 4.5],
    rotY: -Math.PI / 2,
  },
  {
    id: 'scanner',
    name: 'Babu',
    role: 'ATS Forensic Auditor',
    roomName: 'ATS Forensic Lab',
    roomNumber: 'ROOM 02',
    icon: '🔍',
    color: '#3b82f6', // blue
    pos: [-10, 0, 4.5],
    rotY: Math.PI / 2,
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
    pos: [10, 0, -5],
    rotY: -Math.PI / 2,
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
    pos: [-10, 0, -5],
    rotY: Math.PI / 2,
  },
  {
    id: 'corner',
    name: 'Harsha',
    role: 'Brutal Executive Partner',
    roomName: 'The Corner Penthouse',
    roomNumber: 'ROOM 05',
    icon: '⚡',
    color: '#ef4444', // red
    pos: [0, 0, -14],
    rotY: 0,
  },
];

// ── Physical Collision Engine (AABB Obstacles) ──
interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const OBSTACLES: BoxObstacle[] = [
  // 1. Central Lounge Sofa & Coffee Table
  { minX: -2.0, maxX: 2.0, minZ: -0.6, maxZ: 1.8 },

  // 2. Desks & Agent Workstations (including chairs)
  // Veena's Suite (Room 1)
  { minX: 8.2, maxX: 11.8, minZ: 3.2, maxZ: 5.8 },
  // Babu's Suite (Room 2)
  { minX: -11.8, maxX: -8.2, minZ: 3.2, maxZ: 5.8 },
  // Ravi's War Room (Room 3)
  { minX: 8.2, maxX: 11.8, minZ: -6.4, maxZ: -3.6 },
  // Radha's Pod (Room 4)
  { minX: -11.8, maxX: -8.2, minZ: -6.4, maxZ: -3.6 },
  // Harsha's Executive Desk & Credenza (Room 5)
  { minX: -3.0, maxX: 3.0, minZ: -16.5, maxZ: -12.5 },

  // 3. Potted Plants in Hallway
  { minX: -3.4, maxX: -2.2, minZ: 5.9, maxZ: 7.1 },
  { minX: 2.2, maxX: 3.4, minZ: 5.9, maxZ: 7.1 },
  { minX: -3.4, maxX: -2.2, minZ: -1.6, maxZ: -0.4 },
  { minX: 2.2, maxX: 3.4, minZ: -1.6, maxZ: -0.4 },

  // 4. Glass Partition Walls (solid sections, with doorway openings left clear!)
  // East Wall at x = 4.0: Doorway 1 is at z in [3.2, 5.8]
  { minX: 3.7, maxX: 4.3, minZ: 0.5, maxZ: 3.2 },
  { minX: 3.7, maxX: 4.3, minZ: 5.8, maxZ: 8.5 },
  // East Wall at x = 4.0: Doorway 3 is at z in [-6.3, -3.7]
  { minX: 3.7, maxX: 4.3, minZ: -9.5, maxZ: -6.3 },
  { minX: 3.7, maxX: 4.3, minZ: -3.7, maxZ: -0.5 },

  // West Wall at x = -4.0: Doorway 2 is at z in [3.2, 5.8]
  { minX: -4.3, maxX: -3.7, minZ: 0.5, maxZ: 3.2 },
  { minX: -4.3, maxX: -3.7, minZ: 5.8, maxZ: 8.5 },
  // West Wall at x = -4.0: Doorway 4 is at z in [-6.3, -3.7]
  { minX: -4.3, maxX: -3.7, minZ: -9.5, maxZ: -6.3 },
  { minX: -4.3, maxX: -3.7, minZ: -3.7, maxZ: -0.5 },

  // North Penthouse Wall at z = -10.5: Doorway 5 is at x in [-1.4, 1.4]
  { minX: -6.5, maxX: -1.4, minZ: -10.8, maxZ: -10.2 },
  { minX: 1.4, maxX: 6.5, minZ: -10.8, maxZ: -10.2 },

  // Solid Walls dividing Room 1 & 3 at z = -0.5
  { minX: 4.0, maxX: 16.0, minZ: -0.8, maxZ: -0.2 },
  // Solid Walls dividing Room 2 & 4 at z = -0.5
  { minX: -16.0, maxX: -4.0, minZ: -0.8, maxZ: -0.2 },
];

function checkCollision(x: number, z: number, playerRadius = 0.38): boolean {
  // Outer world bounds
  if (x < -15.0 || x > 15.0 || z < -17.0 || z > 8.0) return true;

  // Check against all solid obstacles
  for (const b of OBSTACLES) {
    if (
      x + playerRadius > b.minX &&
      x - playerRadius < b.maxX &&
      z + playerRadius > b.minZ &&
      z - playerRadius < b.maxZ
    ) {
      return true; // Collision!
    }
  }

  return false;
}

// ── Room Entrance Signage ──
function RoomSign({
  position,
  roomNumber,
  roomName,
  color,
}: {
  position: [number, number, number];
  roomNumber: string;
  roomName: string;
  color: string;
}) {
  return (
    <group position={position}>
      {/* Matte Dark Acrylic Plaque */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.4, 0.45, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Glowing Neon Border Underline */}
      <mesh position={[0, -0.21, 0.045]}>
        <boxGeometry args={[2.3, 0.04, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Room Number */}
      <Text
        position={[0, 0.08, 0.05]}
        fontSize={0.11}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {roomNumber}
      </Text>
      {/* Room Name */}
      <Text
        position={[0, -0.07, 0.05]}
        fontSize={0.09}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
      >
        {roomName}
      </Text>
    </group>
  );
}

// ── Glass Wall with Doorway Cutout ──
function GlassWallWithDoor({
  position,
  rotation = [0, 0, 0],
  width = 8,
  height = 3.2,
  doorWidth = 2.4,
  doorHeight = 2.4,
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
      {/* Left Glass Panel */}
      <mesh position={[-width / 2 + sideWidth / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sideWidth, height, 0.08]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          roughness={0.1}
          transmission={0.88}
          transparent
          opacity={0.65}
          thickness={0.2}
        />
      </mesh>

      {/* Right Glass Panel */}
      <mesh position={[width / 2 - sideWidth / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sideWidth, height, 0.08]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          roughness={0.1}
          transmission={0.88}
          transparent
          opacity={0.65}
          thickness={0.2}
        />
      </mesh>

      {/* Top Header Lintel above Doorway */}
      <mesh position={[0, doorHeight + lintelHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, lintelHeight, 0.08]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          roughness={0.1}
          transmission={0.88}
          transparent
          opacity={0.65}
          thickness={0.2}
        />
      </mesh>

      {/* Warm Birch Door Frame Mullions */}
      <mesh position={[-doorWidth / 2, doorHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.08, doorHeight, 0.12]} />
        <meshStandardMaterial color="#c29d75" roughness={0.4} />
      </mesh>
      <mesh position={[doorWidth / 2, doorHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.08, doorHeight, 0.12]} />
        <meshStandardMaterial color="#c29d75" roughness={0.4} />
      </mesh>
      <mesh position={[0, doorHeight, 0]} castShadow>
        <boxGeometry args={[doorWidth + 0.08, 0.08, 0.12]} />
        <meshStandardMaterial color="#c29d75" roughness={0.4} />
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
      {/* Main Wall Slab */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color="#f8fafc" roughness={0.85} />
      </mesh>
      {/* Baseboard Trim */}
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
  width = 6,
  depth = 5,
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
      {/* Modern Ceramic Pot */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.2, 0.7, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.69, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.03, 16]} />
        <meshStandardMaterial color="#271c19" roughness={0.9} />
      </mesh>
      {/* Lush Foliage */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.6} />
      </mesh>
      <mesh position={[0.15, 1.45, 0.1]} castShadow>
        <sphereGeometry args={[0.38, 10, 10]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ── Ergonomic Swivel Mesh Office Chair ──
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
        <cylinderGeometry args={[0.32, 0.32, 0.04, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Padded Seat Cushion */}
      <RoundedBox args={[0.56, 0.08, 0.54]} radius={0.03} position={[0, 0.44, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.7} />
      </RoundedBox>
      {/* Mesh Backrest */}
      <RoundedBox args={[0.52, 0.6, 0.06]} radius={0.03} position={[0, 0.78, 0.26]} castShadow>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
      {/* Armrests */}
      <mesh position={[-0.28, 0.6, 0.05]} castShadow>
        <boxGeometry args={[0.06, 0.25, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
      <mesh position={[0.28, 0.6, 0.05]} castShadow>
        <boxGeometry args={[0.06, 0.25, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
    </group>
  );
}

// ── Ergonomically Aligned Workstation ──
function WorkstationDesk({
  position,
  rotationY = 0,
  accentColor,
  monitorCount = 1,
  hasWhiteboard = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  accentColor: string;
  monitorCount?: number;
  hasWhiteboard?: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Birch Wood Table Top */}
      <RoundedBox args={[2.5, 0.08, 1.2]} radius={0.03} position={[0, 0.76, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e5ddd0" roughness={0.4} />
      </RoundedBox>

      {/* Dark Steel Sturdy Legs */}
      <mesh position={[-1.15, 0.38, -0.45]} castShadow>
        <boxGeometry args={[0.06, 0.76, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[1.15, 0.38, -0.45]} castShadow>
        <boxGeometry args={[0.06, 0.76, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[-1.15, 0.38, 0.45]} castShadow>
        <boxGeometry args={[0.06, 0.76, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[1.15, 0.38, 0.45]} castShadow>
        <boxGeometry args={[0.06, 0.76, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Desk Mat with Accent Strip */}
      <mesh position={[0, 0.805, 0.05]} receiveShadow>
        <boxGeometry args={[1.4, 0.01, 0.65]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Keyboard & Mouse on Desk */}
      <mesh position={[0, 0.815, 0.18]}>
        <boxGeometry args={[0.55, 0.015, 0.18]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0.38, 0.815, 0.18]}>
        <boxGeometry args={[0.08, 0.02, 0.12]} />
        <meshStandardMaterial color="#475569" roughness={0.3} />
      </mesh>

      {/* Monitor Display Screen */}
      <group position={[0, 0.81, -0.22]}>
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
          <group position={[0.65, 0.04, 0.08]} rotation={[0, -Math.PI / 6, 0]}>
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

      {/* Dedicated Office Chair behind Desk */}
      <OfficeChair position={[0, 0, 0.85]} rotationY={Math.PI} color="#1e293b" />

      {/* Visitor Chair on front side */}
      <OfficeChair position={[0, 0, -1.1]} rotationY={0} color="#475569" />

      {/* Architecture Whiteboard */}
      {hasWhiteboard && (
        <group position={[0, 1.4, -2.1]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.2, 1.8, 0.05]} />
            <meshStandardMaterial color="#ffffff" roughness={0.15} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <boxGeometry args={[3.3, 1.9, 0.04]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Harsha's Executive Corner Penthouse Suite ──
function ExecutivePenthouseSuite({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Warm Walnut Executive Desk */}
      <RoundedBox args={[3.4, 0.12, 1.4]} radius={0.04} position={[0, 0.84, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3e2723" roughness={0.35} metalness={0.15} />
      </RoundedBox>
      <mesh position={[-1.5, 0.42, 0]} castShadow>
        <boxGeometry args={[0.18, 0.84, 1.2]} />
        <meshStandardMaterial color="#271c19" roughness={0.4} />
      </mesh>
      <mesh position={[1.5, 0.42, 0]} castShadow>
        <boxGeometry args={[0.18, 0.84, 1.2]} />
        <meshStandardMaterial color="#271c19" roughness={0.4} />
      </mesh>

      {/* Desk Mat & Laptop */}
      <mesh position={[0, 0.905, 0.05]} receiveShadow>
        <boxGeometry args={[1.5, 0.01, 0.65]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.7} />
      </mesh>
      <group position={[0, 0.91, -0.15]}>
        <mesh position={[0, 0.01, 0]} castShadow>
          <boxGeometry args={[0.45, 0.02, 0.3]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.16, -0.14]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.28, 0.02]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.16, -0.128]} rotation={[-0.3, 0, 0]}>
          <planeGeometry args={[0.42, 0.25]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Tall High-Back Executive Leather Chair for Harsha */}
      <group position={[0, 0, 0.95]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.04, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <RoundedBox args={[0.62, 0.1, 0.58]} radius={0.04} position={[0, 0.45, 0]} castShadow>
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </RoundedBox>
        {/* High Executive Backrest */}
        <RoundedBox args={[0.58, 0.85, 0.08]} radius={0.04} position={[0, 0.92, 0.28]} castShadow>
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </RoundedBox>
      </group>

      {/* Luxury Visitor Armchair */}
      <OfficeChair position={[0, 0, -1.2]} rotationY={0} color="#78350f" />

      {/* Executive Bookshelf Credenza Against Back Wall */}
      <group position={[0, 1.4, -2.6]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.8, 2.6, 0.5]} />
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
      <RoundedBox args={[3.2, 0.65, 1.1]} radius={0.08} position={[0, 0.35, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[3.2, 0.85, 0.32]} radius={0.08} position={[0, 0.85, -0.42]} castShadow>
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </RoundedBox>

      {/* Round Glass Coffee Table */}
      <mesh position={[0, 0.35, 1.1]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.05, 24]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} transmission={0.9} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.17, 1.1]}>
        <cylinderGeometry args={[0.04, 0.04, 0.34, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
    </group>
  );
}

// ── Entire Office Building Architecture ──
function CitadelArchitecture() {
  return (
    <group>
      {/* ── Single Solid Floor Slab (Zero Shadow Acne / Zero Z-fighting) ── */}
      <mesh position={[0, -0.1, -4.5]} receiveShadow>
        <boxGeometry args={[34, 0.2, 28]} />
        <meshStandardMaterial color="#d7c4a5" roughness={0.75} />
      </mesh>

      {/* ── Individual Room Area Rugs ── */}
      <RoomRug position={[10, 0, 4.5]} width={6.5} depth={5.5} color="#064e3b" />
      <RoomRug position={[-10, 0, 4.5]} width={6.5} depth={5.5} color="#1e3a8a" />
      <RoomRug position={[10, 0, -5]} width={6.5} depth={5.5} color="#3b0764" />
      <RoomRug position={[-10, 0, -5]} width={6.5} depth={5.5} color="#0e7490" />
      <RoomRug position={[0, 0, -14]} width={8.5} depth={6.0} color="#7f1d1d" />

      {/* ── Glass Walls with Doorways into 5 Separate Rooms ── */}
      {/* Room 01 (Veena - East Front) */}
      <GlassWallWithDoor
        position={[4, 0, 4.5]}
        rotation={[0, Math.PI / 2, 0]}
        width={8}
        height={3.2}
        doorWidth={2.4}
      />
      <RoomSign
        position={[3.94, 2.7, 4.5]}
        roomNumber="ROOM 01"
        roomName="Intake & Profile (Veena)"
        color="#10b981"
      />

      {/* Room 02 (Babu - West Front) */}
      <GlassWallWithDoor
        position={[-4, 0, 4.5]}
        rotation={[0, -Math.PI / 2, 0]}
        width={8}
        height={3.2}
        doorWidth={2.4}
      />
      <RoomSign
        position={[-3.94, 2.7, 4.5]}
        roomNumber="ROOM 02"
        roomName="ATS Forensic Lab (Babu)"
        color="#3b82f6"
      />

      {/* Room 03 (Ravi - East Rear) */}
      <GlassWallWithDoor
        position={[4, 0, -5]}
        rotation={[0, Math.PI / 2, 0]}
        width={8}
        height={3.2}
        doorWidth={2.4}
      />
      <RoomSign
        position={[3.94, 2.7, -5]}
        roomNumber="ROOM 03"
        roomName="Tech War Room (Ravi)"
        color="#8b5cf6"
      />

      {/* Room 04 (Radha - West Rear) */}
      <GlassWallWithDoor
        position={[-4, 0, -5]}
        rotation={[0, -Math.PI / 2, 0]}
        width={8}
        height={3.2}
        doorWidth={2.4}
      />
      <RoomSign
        position={[-3.94, 2.7, -5]}
        roomNumber="ROOM 04"
        roomName="Quantum Strategy Pod (Radha)"
        color="#06b6d4"
      />

      {/* Room 05 (Harsha - North Penthouse) */}
      <GlassWallWithDoor
        position={[0, 0, -10.5]}
        rotation={[0, 0, 0]}
        width={10}
        height={3.6}
        doorWidth={2.8}
      />
      <RoomSign
        position={[0, 2.9, -10.44]}
        roomNumber="ROOM 05 // PENTHOUSE"
        roomName="Executive Corner Office (Harsha)"
        color="#ef4444"
      />

      {/* ── Internal Dividing Walls ── */}
      <SolidWall position={[10, 1.6, -0.5]} args={[12, 3.2, 0.2]} />
      <SolidWall position={[-10, 1.6, -0.5]} args={[12, 3.2, 0.2]} />

      {/* ── Outer Perimeter Studio Walls ── */}
      <SolidWall position={[16, 1.6, -4.5]} args={[0.3, 3.2, 26]} />
      <SolidWall position={[-16, 1.6, -4.5]} args={[0.3, 3.2, 26]} />
      <SolidWall position={[0, 1.6, 8.5]} args={[32, 3.2, 0.3]} />
      <SolidWall position={[0, 1.8, -17.5]} args={[24, 3.6, 0.3]} />
    </group>
  );
}

// ── Interactive Agent Station with Ergonomic Seating ──
function AgentStation({
  station,
  isNearby,
  onInteract,
}: {
  station: StationData;
  isNearby: boolean;
  onInteract: () => void;
}) {
  const haloRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (haloRef.current && isNearby) {
      haloRef.current.rotation.z = clock.getElapsedTime() * 1.5;
    }
  });

  const agentAnim: CharacterAnimation = isNearby ? 'Talk' : 'Sit_Work';

  return (
    <group position={station.pos} rotation={[0, station.rotY, 0]}>
      {/* Proximity Glowing Floor Halo (placed at y=0.03 with polygon offset to prevent clipping) */}
      {isNearby && (
        <mesh ref={haloRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.9, 32]} />
          <meshBasicMaterial color={station.color} transparent opacity={0.85} depthTest={true} />
        </mesh>
      )}

      {/* Agent is seated ergonomically on chair at z=0.85 behind desk (NO COLLISION!) */}
      <group position={[0, 0, 0.85]} rotation={[0, Math.PI, 0]}>
        <DelegationCharacter
          position={[0, 0, 0]}
          color={station.color}
          animation={agentAnim}
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
          hasWhiteboard={station.id === 'warroom'}
        />
      )}

      {/* Floating 3D Action Badge */}
      {isNearby && (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
          <group position={[0, 2.6, 0]} onClick={onInteract}>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[2.5, 0.65, 0.08]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[2.42, 0.57]} />
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

// ── Main Office World Component ──
export function OfficeWorld({
  onInteractStation,
  activeInteraction,
  onCloseInteraction,
}: OfficeWorldProps) {
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 4.5]);
  const [playerRotY, setPlayerRotY] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [nearbyStation, setNearbyStation] = useState<StationData | null>(null);

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.key === 'Escape' && activeInteraction) {
        onCloseInteraction();
      }

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

  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 16], fov: 38 }}
      className="w-full h-full"
      style={{ background: '#e2e8f0' }}
    >
      {/* ── Sunlight Lighting without Shadow Acne ── */}
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#ffffff', '#e2e8f0', 0.6]} />
      <directionalLight
        position={[12, 22, 14]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1.0}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.00005}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-10, 15, -10]} intensity={0.35} color="#e0f2fe" />

      {/* ── Architectural Building ── */}
      <CitadelArchitecture />

      {/* Central Corridor Lounge & Greenery */}
      <CentralLounge position={[0, 0, 1]} />
      <Plant position={[-2.8, 0, 6.5]} />
      <Plant position={[2.8, 0, 6.5]} />
      <Plant position={[-2.8, 0, -1.0]} />
      <Plant position={[2.8, 0, -1.0]} />

      {/* ── 5 Agent Stations in 5 Separate Rooms ── */}
      {STATIONS.map((station) => (
        <AgentStation
          key={station.id}
          station={station}
          isNearby={nearbyStation?.id === station.id}
          onInteract={() => onInteractStation(station.id)}
        />
      ))}

      {/* ── Genuine Player Character from the-delegation ── */}
      <group position={playerPos} rotation={[0, playerRotY, 0]}>
        <DelegationCharacter
          position={[0, 0, 0]}
          color="#f59e0b"
          animation={isWalking ? 'Walk' : 'Idle'}
          scale={0.95}
        />
      </group>

      {/* ── Collision & Movement Controller ── */}
      <GameController
        keysPressed={keysPressed}
        playerPos={playerPos}
        setPlayerPos={setPlayerPos}
        playerRotY={playerRotY}
        setPlayerRotY={setPlayerRotY}
        setIsWalking={setIsWalking}
        setNearbyStation={setNearbyStation}
        activeInteraction={activeInteraction}
      />
    </Canvas>
  );
}

// ── Game Physics & Sliding Collision Loop ──
function GameController({
  keysPressed,
  playerPos,
  setPlayerPos,
  playerRotY,
  setPlayerRotY,
  setIsWalking,
  setNearbyStation,
  activeInteraction,
}: {
  keysPressed: React.MutableRefObject<{ [key: string]: boolean }>;
  playerPos: [number, number, number];
  setPlayerPos: React.Dispatch<React.SetStateAction<[number, number, number]>>;
  playerRotY: number;
  setPlayerRotY: React.Dispatch<React.SetStateAction<number>>;
  setIsWalking: React.Dispatch<React.SetStateAction<boolean>>;
  setNearbyStation: React.Dispatch<React.SetStateAction<StationData | null>>;
  activeInteraction: OfficeZone | null;
}) {
  const speed = 4.8;

  useFrame((state, delta) => {
    if (activeInteraction) {
      setIsWalking(false);
      return;
    }

    const keys = keysPressed.current;
    let dx = 0;
    let dz = 0;

    if (keys['w'] || keys['arrowup']) dz -= 1;
    if (keys['s'] || keys['arrowdown']) dz += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    const moving = dx !== 0 || dz !== 0;
    setIsWalking(moving);

    if (moving) {
      const len = Math.sqrt(dx * dx + dz * dz);
      const moveX = (dx / len) * speed * delta;
      const moveZ = (dz / len) * speed * delta;

      const targetX = playerPos[0] + moveX;
      const targetZ = playerPos[2] + moveZ;

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

      const targetAngle = Math.atan2(dx, dz);
      setPlayerRotY(targetAngle);
    }

    // Proximity detection to stations
    let foundNearby: StationData | null = null;
    for (const station of STATIONS) {
      const dist = Math.hypot(playerPos[0] - station.pos[0], playerPos[2] - station.pos[2]);
      if (dist < 2.5) {
        foundNearby = station;
        break;
      }
    }
    setNearbyStation(foundNearby);

    // Smooth camera follow target (cozy isometric angle)
    const targetCamX = playerPos[0] * 0.4;
    const targetCamZ = playerPos[2] + 13;
    const targetCamY = 11;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, 0.06);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.06);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, 0.06);

    const lookAtTarget = new THREE.Vector3(playerPos[0] * 0.35, 0.8, playerPos[2] - 1.2);
    state.camera.lookAt(lookAtTarget);
  });

  return null;
}
