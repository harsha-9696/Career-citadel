import React, { useRef, useState, useEffect, Suspense } from 'react';
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
    pos: [10, 0, 4],
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
    pos: [-10, 0, 4],
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

// Room Signage over doorways
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
      {/* Acrylic Plaque */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 0.45, 0.06]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Accent border strip */}
      <mesh position={[0, -0.2, 0.035]}>
        <boxGeometry args={[2.1, 0.04, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.08, 0.04]}
        fontSize={0.11}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
      >
        {roomNumber}
      </Text>
      <Text
        position={[0, -0.07, 0.04]}
        fontSize={0.09}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
      >
        {roomName}
      </Text>
    </group>
  );
}

// Glass Architectural Partition Wall with Doorway Opening
function GlassWallWithDoor({
  position,
  rotation = [0, 0, 0],
  width = 12,
  height = 3.2,
  doorWidth = 2.4,
  doorHeight = 2.4,
  doorOffset = 0,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  doorWidth?: number;
  doorHeight?: number;
  doorOffset?: number;
}) {
  const leftWidth = Math.max(0.1, (width - doorWidth) / 2 + doorOffset);
  const rightWidth = Math.max(0.1, (width - doorWidth) / 2 - doorOffset);
  const lintelHeight = height - doorHeight;

  return (
    <group position={position} rotation={rotation}>
      {/* Left Wall Section */}
      <mesh position={[-width / 2 + leftWidth / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[leftWidth, height, 0.08]} />
        <meshPhysicalMaterial
          color="#f1f5f9"
          roughness={0.15}
          transmission={0.85}
          transparent
          opacity={0.65}
          thickness={0.2}
        />
      </mesh>

      {/* Right Wall Section */}
      <mesh position={[width / 2 - rightWidth / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[rightWidth, height, 0.08]} />
        <meshPhysicalMaterial
          color="#f1f5f9"
          roughness={0.15}
          transmission={0.85}
          transparent
          opacity={0.65}
          thickness={0.2}
        />
      </mesh>

      {/* Top Lintel above Doorway */}
      <mesh position={[doorOffset, doorHeight + lintelHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, lintelHeight, 0.08]} />
        <meshPhysicalMaterial
          color="#f1f5f9"
          roughness={0.15}
          transmission={0.85}
          transparent
          opacity={0.65}
          thickness={0.2}
        />
      </mesh>

      {/* Birch Wood Door Frame Mullions */}
      <mesh position={[doorOffset - doorWidth / 2, doorHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.08, doorHeight, 0.12]} />
        <meshStandardMaterial color="#d4a373" roughness={0.4} />
      </mesh>
      <mesh position={[doorOffset + doorWidth / 2, doorHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.08, doorHeight, 0.12]} />
        <meshStandardMaterial color="#d4a373" roughness={0.4} />
      </mesh>
      <mesh position={[doorOffset, doorHeight, 0]} castShadow>
        <boxGeometry args={[doorWidth + 0.08, 0.08, 0.12]} />
        <meshStandardMaterial color="#d4a373" roughness={0.4} />
      </mesh>
    </group>
  );
}

// Architectural Solid Wall (perimeter or dividing rooms)
function SolidWall({
  position,
  args,
}: {
  position: [number, number, number];
  args: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#f8fafc" roughness={0.8} />
    </mesh>
  );
}

// Potted Modern Office Plant
function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Ceramic Pot */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.7, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.69, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 16]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      {/* Lush Foliage Leaves */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#15803d" roughness={0.6} />
      </mesh>
      <mesh position={[0.2, 1.45, 0.1]} castShadow>
        <sphereGeometry args={[0.4, 10, 10]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
      <mesh position={[-0.15, 1.35, -0.15]} castShadow>
        <sphereGeometry args={[0.38, 10, 10]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Modern Ergonomic Desk with Monitors
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
      <RoundedBox args={[2.6, 0.08, 1.3]} radius={0.03} position={[0, 0.76, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e2d9cc" roughness={0.4} />
      </RoundedBox>

      {/* Dark Steel Modern Legs */}
      <mesh position={[-1.15, 0.38, -0.5]} castShadow>
        <boxGeometry args={[0.06, 0.76, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[1.15, 0.38, -0.5]} castShadow>
        <boxGeometry args={[0.06, 0.76, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[-1.15, 0.38, 0.5]} castShadow>
        <boxGeometry args={[0.06, 0.76, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[1.15, 0.38, 0.5]} castShadow>
        <boxGeometry args={[0.06, 0.76, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Desk Mat with Zone Accent */}
      <mesh position={[0, 0.81, 0.05]} receiveShadow>
        <boxGeometry args={[1.5, 0.01, 0.7]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Laptop / Computer Screen */}
      <group position={[0, 0.81, -0.2]}>
        {/* Stand */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        {/* Main Monitor Display */}
        <RoundedBox args={[1.1, 0.65, 0.04]} radius={0.02} position={[0, 0.48, 0]} castShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.48, 0.025]}>
          <planeGeometry args={[1.02, 0.57]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>

        {/* Second Vertical Screen if requested */}
        {monitorCount > 1 && (
          <group position={[0.7, 0.05, 0.1]} rotation={[0, -Math.PI / 6, 0]}>
            <RoundedBox args={[0.5, 0.85, 0.04]} radius={0.02} position={[0, 0.5, 0]} castShadow>
              <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.5, 0.025]}>
              <planeGeometry args={[0.44, 0.77]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        )}
      </group>

      {/* Slim Keyboard & Mouse */}
      <mesh position={[0, 0.815, 0.15]}>
        <boxGeometry args={[0.6, 0.015, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0.42, 0.815, 0.15]}>
        <boxGeometry args={[0.09, 0.02, 0.14]} />
        <meshStandardMaterial color="#475569" roughness={0.3} />
      </mesh>

      {/* Optional Large Architecture Whiteboard in Room */}
      {hasWhiteboard && (
        <group position={[0, 1.4, -1.8]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.2, 1.8, 0.05]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <boxGeometry args={[3.3, 1.9, 0.04]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.6} />
          </mesh>
          <mesh position={[0, -0.95, 0.1]}>
            <boxGeometry args={[3.2, 0.06, 0.15]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Harsha's Executive Penthouse Desk with Skyline Window Frame
function ExecutivePenthouseSuite({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Elevated Wooden Podium Floor */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[11, 0.2, 7]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} />
      </mesh>

      {/* Grand Dark Walnut Executive Desk */}
      <RoundedBox args={[3.6, 0.12, 1.6]} radius={0.04} position={[0, 0.86, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#292524" roughness={0.3} metalness={0.2} />
      </RoundedBox>
      <mesh position={[-1.6, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.74, 1.4]} />
        <meshStandardMaterial color="#1c1917" roughness={0.4} />
      </mesh>
      <mesh position={[1.6, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.74, 1.4]} />
        <meshStandardMaterial color="#1c1917" roughness={0.4} />
      </mesh>

      {/* Executive Curved OLED Display */}
      <group position={[0, 0.92, -0.3]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.6, 0.7, 0.06]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.45, 0.035]}>
          <planeGeometry args={[1.5, 0.62]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Bookshelf Credenza Behind */}
      <group position={[0, 1.6, -3.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5.2, 3.0, 0.6]} />
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// Central Promenade Lounge
function CentralLounge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Designer Ochre Leather Sofa */}
      <RoundedBox args={[3.2, 0.65, 1.2]} radius={0.08} position={[0, 0.35, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d97706" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[3.2, 0.85, 0.35]} radius={0.08} position={[0, 0.85, -0.45]} castShadow>
        <meshStandardMaterial color="#d97706" roughness={0.6} />
      </RoundedBox>

      {/* Round Glass Coffee Table */}
      <mesh position={[0, 0.38, 1.2]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.06, 24]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} transmission={0.9} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.18, 1.2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.36, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
    </group>
  );
}

// The Whole Multi-Room Architectural Office Building
function CitadelArchitecture() {
  return (
    <group>
      {/* ── Floor System ── */}
      {/* Main Studio Parquet Hardwood Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -3]} receiveShadow>
        <planeGeometry args={[36, 30]} />
        <meshStandardMaterial color="#d4a373" roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Base Foundation Slab */}
      <mesh position={[0, -0.2, -3]} receiveShadow>
        <boxGeometry args={[36.5, 0.38, 30.5]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>

      {/* ── Glass Partition Walls with Doorways into 5 Separate Rooms ── */}
      {/* Room 01 (Veena - East Front): Glass wall facing hallway at x = 4 */}
      <GlassWallWithDoor
        position={[4, 0, 4]}
        rotation={[0, Math.PI / 2, 0]}
        width={8}
        height={3.2}
        doorWidth={2.4}
        doorOffset={0}
      />
      <RoomSign
        position={[3.95, 2.7, 4]}
        roomNumber="ROOM 01"
        roomName="Intake & Profile (Veena)"
        color="#10b981"
      />

      {/* Room 02 (Babu - West Front): Glass wall facing hallway at x = -4 */}
      <GlassWallWithDoor
        position={[-4, 0, 4]}
        rotation={[0, -Math.PI / 2, 0]}
        width={8}
        height={3.2}
        doorWidth={2.4}
        doorOffset={0}
      />
      <RoomSign
        position={[-3.95, 2.7, 4]}
        roomNumber="ROOM 02"
        roomName="ATS Forensic Lab (Babu)"
        color="#3b82f6"
      />

      {/* Room 03 (Ravi - East Rear): Glass wall facing hallway at x = 4 */}
      <GlassWallWithDoor
        position={[4, 0, -5]}
        rotation={[0, Math.PI / 2, 0]}
        width={8}
        height={3.2}
        doorWidth={2.4}
        doorOffset={0}
      />
      <RoomSign
        position={[3.95, 2.7, -5]}
        roomNumber="ROOM 03"
        roomName="Tech War Room (Ravi)"
        color="#8b5cf6"
      />

      {/* Room 04 (Radha - West Rear): Glass wall facing hallway at x = -4 */}
      <GlassWallWithDoor
        position={[-4, 0, -5]}
        rotation={[0, -Math.PI / 2, 0]}
        width={8}
        height={3.2}
        doorWidth={2.4}
        doorOffset={0}
      />
      <RoomSign
        position={[-3.95, 2.7, -5]}
        roomNumber="ROOM 04"
        roomName="Quantum Strategy Pod (Radha)"
        color="#06b6d4"
      />

      {/* Room 05 (Harsha - North Penthouse): Glass wall with grand entrance at z = -10.5 */}
      <GlassWallWithDoor
        position={[0, 0, -10.5]}
        rotation={[0, 0, 0]}
        width={10}
        height={3.6}
        doorWidth={2.8}
        doorOffset={0}
      />
      <RoomSign
        position={[0, 2.9, -10.45]}
        roomNumber="ROOM 05 // PENTHOUSE"
        roomName="Executive Corner Office (Harsha)"
        color="#ef4444"
      />

      {/* ── Internal Dividing Walls (Between Rooms) ── */}
      {/* Wall dividing Room 1 (Veena) and Room 3 (Ravi) at z = -0.5 */}
      <SolidWall position={[10, 1.6, -0.5]} args={[12, 3.2, 0.2]} />

      {/* Wall dividing Room 2 (Babu) and Room 4 (Radha) at z = -0.5 */}
      <SolidWall position={[-10, 1.6, -0.5]} args={[12, 3.2, 0.2]} />

      {/* ── Outer Perimeter Studio Walls ── */}
      {/* East Outer Wall */}
      <SolidWall position={[16, 1.6, -3]} args={[0.3, 3.2, 28]} />
      {/* West Outer Wall */}
      <SolidWall position={[-16, 1.6, -3]} args={[0.3, 3.2, 28]} />
      {/* South Entrance Wall with Glass Vista */}
      <SolidWall position={[0, 1.6, 9]} args={[32, 3.2, 0.3]} />
      {/* North Outer Penthouse Wall */}
      <SolidWall position={[0, 1.8, -17.5]} args={[24, 3.6, 0.3]} />
    </group>
  );
}

// Proximity Zone Indicator & 3D Interactive Station
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

  // Pick animation: if user is nearby, agent talks or waves! Otherwise, sitting at work.
  const agentAnim: CharacterAnimation = isNearby ? 'Talk' : 'Sit_Work';

  return (
    <group position={station.pos} rotation={[0, station.rotY, 0]}>
      {/* Proximity Glowing Floor Halo */}
      {isNearby && (
        <mesh ref={haloRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.1, 32]} />
          <meshBasicMaterial color={station.color} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Authentic Character Model from the-delegation */}
      <group position={[0, 0, 0.35]} rotation={[0, Math.PI, 0]}>
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

      {/* Furniture specific to each zone */}
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

      {/* Floating 3D Proximity Action Badge */}
      {isNearby && (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
          <group position={[0, 2.5, 0]} onClick={onInteract}>
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
              font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
            >
              {`[E] Consult ${station.name}`}
            </Text>
            <Text
              position={[0, -0.12, 0.05]}
              fontSize={0.09}
              color="#475569"
              anchorX="center"
              anchorY="middle"
              font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
            >
              {station.roomName}
            </Text>
          </group>
        </Float>
      )}
    </group>
  );
}

// Check if player position is within legal walkable zones (hallway or any of 5 rooms)
function isPositionWalkable(x: number, z: number): boolean {
  // Outermost bounds
  if (x < -15 || x > 15 || z < -16.5 || z > 8) return false;

  // Central corridor is always walkable
  if (Math.abs(x) <= 3.8 && z >= -10.5 && z <= 8) return true;

  // Doorway 1 (East front to Veena at z = 4): x between 3.5 and 6
  if (Math.abs(z - 4) < 1.2 && x >= 3.5 && x <= 6) return true;
  // Room 1 (Veena): x in [4, 15], z in [0.5, 8]
  if (x >= 4 && x <= 15 && z >= 0.5 && z <= 8) return true;

  // Doorway 2 (West front to Babu at z = 4): x between -6 and -3.5
  if (Math.abs(z - 4) < 1.2 && x >= -6 && x <= -3.5) return true;
  // Room 2 (Babu): x in [-15, -4], z in [0.5, 8]
  if (x >= -15 && x <= -4 && z >= 0.5 && z <= 8) return true;

  // Doorway 3 (East rear to Ravi at z = -5): x between 3.5 and 6
  if (Math.abs(z - (-5)) < 1.2 && x >= 3.5 && x <= 6) return true;
  // Room 3 (Ravi): x in [4, 15], z in [-9.5, -1]
  if (x >= 4 && x <= 15 && z >= -9.5 && z <= -1) return true;

  // Doorway 4 (West rear to Radha at z = -5): x between -6 and -3.5
  if (Math.abs(z - (-5)) < 1.2 && x >= -6 && x <= -3.5) return true;
  // Room 4 (Radha): x in [-15, -4], z in [-9.5, -1]
  if (x >= -15 && x <= -4 && z >= -9.5 && z <= -1) return true;

  // Doorway 5 (North penthouse to Harsha at z = -10.5): x between -2 and 2
  if (Math.abs(x) <= 2.0 && z <= -9.5 && z >= -11.5) return true;
  // Room 5 (Harsha penthouse): x in [-6, 6], z in [-16.5, -10.5]
  if (Math.abs(x) <= 6 && z <= -10.5 && z >= -16.5) return true;

  return false;
}

// Main Interactive 3D World Scene
export function OfficeWorld({
  onInteractStation,
  activeInteraction,
  onCloseInteraction,
}: OfficeWorldProps) {
  // Player state: starts in the sunny central atrium
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 4]);
  const [playerRotY, setPlayerRotY] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [nearbyStation, setNearbyStation] = useState<StationData | null>(null);

  // Keyboard input tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      // Close modal on ESC
      if (e.key === 'Escape' && activeInteraction) {
        onCloseInteraction();
      }

      // Interact with nearby station on E
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
      camera={{ position: [0, 16, 22], fov: 42 }}
      className="w-full h-full"
      style={{ background: '#e2e8f0' }}
    >
      {/* ── Sunlit Daylight Lighting (No Dark Theme) ── */}
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#f0f9ff', '#fed7aa', 0.85]} />
      <directionalLight
        position={[14, 24, 16]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-14, 18, -12]} intensity={0.4} color="#e0f2fe" />

      {/* ── Multi-Room Architectural Office Building ── */}
      <CitadelArchitecture />

      {/* Central Corridor Lounge & Decor */}
      <CentralLounge position={[0, 0, 1]} />
      <Plant position={[-2.8, 0, 6.5]} scale={1.1} />
      <Plant position={[2.8, 0, 6.5]} scale={1.1} />
      <Plant position={[-2.8, 0, -1]} scale={1.1} />
      <Plant position={[2.8, 0, -1]} scale={1.1} />

      {/* ── 5 Specialized Agent Workstations in 5 Separate Rooms ── */}
      <Suspense fallback={null}>
        {STATIONS.map((station) => (
          <AgentStation
            key={station.id}
            station={station}
            isNearby={nearbyStation?.id === station.id}
            onInteract={() => onInteractStation(station.id)}
          />
        ))}

        {/* ── Authentic Player Character with Walk/Idle Animations ── */}
        <group position={playerPos} rotation={[0, playerRotY, 0]}>
          <DelegationCharacter
            position={[0, 0, 0]}
            color="#f59e0b" // Warm golden ochre jacket
            animation={isWalking ? 'Walk' : 'Idle'}
            scale={0.95}
          />
        </group>
      </Suspense>

      {/* ── Game Physics & Movement Loop ── */}
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

// Frame-by-frame character controller with collision and camera follow
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
  const speed = 5.2;

  useFrame((state, delta) => {
    // If dialogue modal is open, suspend movement
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
      // Normalize diagonal movement
      const len = Math.sqrt(dx * dx + dz * dz);
      const moveX = (dx / len) * speed * delta;
      const moveZ = (dz / len) * speed * delta;

      const targetX = playerPos[0] + moveX;
      const targetZ = playerPos[2] + moveZ;

      // Check walkability inside hallways and rooms
      let newX = playerPos[0];
      let newZ = playerPos[2];

      if (isPositionWalkable(targetX, playerPos[2])) {
        newX = targetX;
      }
      if (isPositionWalkable(newX, targetZ)) {
        newZ = targetZ;
      }

      setPlayerPos([newX, 0, newZ]);

      // Rotate player smoothly toward direction of movement
      const targetAngle = Math.atan2(dx, dz);
      setPlayerRotY(targetAngle);
    }

    // Check proximity to agent workstations
    let foundNearby: StationData | null = null;
    for (const station of STATIONS) {
      const dist = Math.hypot(playerPos[0] - station.pos[0], playerPos[2] - station.pos[2]);
      if (dist < 2.6) {
        foundNearby = station;
        break;
      }
    }
    setNearbyStation(foundNearby);

    // Smooth camera follow target
    const targetCamX = playerPos[0] * 0.45;
    const targetCamZ = playerPos[2] + 16;
    const targetCamY = 14;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, 0.05);

    const lookAtTarget = new THREE.Vector3(playerPos[0] * 0.4, 0.8, playerPos[2] - 1.5);
    state.camera.lookAt(lookAtTarget);
  });

  return null;
}
