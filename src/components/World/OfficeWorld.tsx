import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { OfficeZone } from '../../types';

interface OfficeWorldProps {
  onInteractStation: (zone: OfficeZone) => void;
  activeInteraction: OfficeZone | null;
  onCloseInteraction: () => void;
}

// Stations definition
interface StationData {
  id: OfficeZone;
  name: string;
  role: string;
  icon: string;
  color: string;
  pos: [number, number, number];
  rotY: number;
}

const STATIONS: StationData[] = [
  {
    id: 'lobby',
    name: 'Veena',
    role: 'Concierge & Navigator',
    icon: '🌟',
    color: '#10b981', // emerald
    pos: [0, 0, 4],
    rotY: 0,
  },
  {
    id: 'scanner',
    name: 'Babu',
    role: 'ATS Forensic Auditor',
    icon: '🔍',
    color: '#3b82f6', // blue
    pos: [-9, 0, 2],
    rotY: Math.PI / 4,
  },
  {
    id: 'warroom',
    name: 'Ravi',
    role: 'Market Strategist & Intel Lead',
    icon: '💻',
    color: '#8b5cf6', // purple
    pos: [9, 0, 1],
    rotY: -Math.PI / 4,
  },
  {
    id: 'corner',
    name: 'Harsha',
    role: 'Brutal Executive Partner',
    icon: '⚡',
    color: '#ef4444', // red
    pos: [-8, 0, -8],
    rotY: Math.PI / 6,
  },
  {
    id: 'holodeck',
    name: 'Radha',
    role: 'Quantum Timeline Simulator',
    icon: '🧭',
    color: '#06b6d4', // cyan
    pos: [8, 0, -8],
    rotY: -Math.PI / 6,
  },
];

// Reusable Stylized 3D Avatar (Sitting or Standing at desk)
function AvatarCharacter({
  name,
  role,
  color,
  isSeated = true,
}: {
  name: string;
  role: string;
  color: string;
  isSeated?: boolean;
}) {
  const headRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (headRef.current) {
      headRef.current.position.y = 1.35 + Math.sin(clock.getElapsedTime() * 2) * 0.02;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Torso */}
      <mesh position={[0, isSeated ? 0.85 : 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.65, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* Head + Hair + Face */}
      <group ref={headRef}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.6} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 0.08, -0.04]} castShadow>
          <sphereGeometry args={[0.23, 16, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        {/* Glasses / Face detail */}
        <mesh position={[0, 0.02, 0.2]} castShadow>
          <boxGeometry args={[0.24, 0.06, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Floating 3D Nametag */}
      <group position={[0, 2.1, 0]}>
        <Text
          fontSize={0.24}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#ffffff"
        >
          {name}
        </Text>
        <Text
          position={[0, -0.22, 0]}
          fontSize={0.13}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#ffffff"
        >
          {role}
        </Text>
      </group>
    </group>
  );
}

// Stylized Office Desk with Dual Monitors, Laptop, and Chair
function WorkstationDesk({
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

  return (
    <group
      position={station.pos}
      rotation={[0, station.rotY, 0]}
      onClick={onInteract}
    >
      {/* Proximity Glowing Halo */}
      {isNearby && (
        <mesh ref={haloRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.3, 32]} />
          <meshBasicMaterial color={station.color} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Modern Birch Wood Desk */}
      <RoundedBox args={[2.8, 0.1, 1.4]} radius={0.03} position={[0, 0.85, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#fef3c7" roughness={0.4} />
      </RoundedBox>

      {/* Metal Desk Legs */}
      <mesh position={[-1.25, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.85, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.25, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.85, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Main Curved Screen */}
      <mesh position={[0, 1.25, -0.3]} castShadow>
        <boxGeometry args={[1.2, 0.65, 0.05]} />
        <meshStandardMaterial color="#1e293b" roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.25, -0.27]}>
        <planeGeometry args={[1.15, 0.6]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      {/* Screen Stand */}
      <mesh position={[0, 0.95, -0.3]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Coffee Mug & Plant on Desk */}
      <mesh position={[1.0, 0.96, -0.2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.14, 12]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} />
      </mesh>
      {/* Small Desk Succulent */}
      <mesh position={[-1.0, 0.98, -0.2]} castShadow>
        <cylinderGeometry args={[0.1, 0.08, 0.15, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      <mesh position={[-1.0, 1.1, -0.2]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>

      {/* Office Ergonomic Swivel Chair */}
      <group position={[0, 0, 0.9]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.65, 0.08, 0.6]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.85, 0.26]} castShadow>
          <boxGeometry args={[0.6, 0.7, 0.08]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
      </group>

      {/* Avatar Person at Workstation */}
      <group position={[0, 0, 0.9]}>
        <AvatarCharacter name={station.name} role={station.role} color={station.color} />
      </group>

      {/* Interaction Indicator Pill */}
      {isNearby && (
        <Float speed={3} rotationIntensity={0} floatIntensity={0.8}>
          <group position={[0, 2.7, 0]}>
            <RoundedBox args={[2.0, 0.45, 0.1]} radius={0.15}>
              <meshBasicMaterial color="#ffffff" />
            </RoundedBox>
            <Text position={[0, 0, 0.08]} fontSize={0.16} color="#0f172a">
              Press [E] to Talk
            </Text>
          </group>
        </Float>
      )}
    </group>
  );
}

// Office Props: Potted Monstera Plant
function PottedPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Ceramic Pot */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.28, 0.8, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.05, 16]} />
        <meshStandardMaterial color="#3f2e21" roughness={0.9} />
      </mesh>
      {/* Leaves */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.55, 12, 12]} />
          <meshStandardMaterial color="#15803d" roughness={0.7} />
        </mesh>
      </Float>
    </group>
  );
}

// Office Props: Cozy Lounge with Sofa & Coffee Table
function LoungeArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Area Rug */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.5, 3.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      {/* Modern Yellow/Ochre Sofa */}
      <RoundedBox args={[3.0, 0.6, 1.1]} radius={0.08} position={[0, 0.35, -0.8]} castShadow>
        <meshStandardMaterial color="#f59e0b" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[3.0, 0.8, 0.35]} radius={0.08} position={[0, 0.85, -1.25]} castShadow>
        <meshStandardMaterial color="#f59e0b" roughness={0.7} />
      </RoundedBox>
      {/* Round Glass Coffee Table */}
      <mesh position={[0, 0.35, 0.4]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 24]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} transmission={0.9} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.17, 0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
    </group>
  );
}

// Water Cooler & Coffee Bar
function CoffeeBar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Cabinet */}
      <RoundedBox args={[1.8, 0.9, 0.8]} radius={0.04} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </RoundedBox>
      {/* Coffee Machine */}
      <mesh position={[-0.4, 1.15, 0]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Water Dispenser */}
      <mesh position={[0.4, 1.05, 0]} castShadow>
        <boxGeometry args={[0.4, 0.6, 0.4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      <mesh position={[0.4, 1.5, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
        <meshPhysicalMaterial color="#38bdf8" roughness={0.1} transmission={0.8} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// Playable 3D Player Character with walking animation
function PlayableCharacter({
  pos,
  rotationY,
  isWalking,
}: {
  pos: [number, number, number];
  rotationY: number;
  isWalking: boolean;
}) {
  const leftLegRef = useRef<THREE.Mesh>(null!);
  const rightLegRef = useRef<THREE.Mesh>(null!);
  const bodyRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (isWalking) {
      const time = clock.getElapsedTime() * 12;
      leftLegRef.current.rotation.x = Math.sin(time) * 0.6;
      rightLegRef.current.rotation.x = -Math.sin(time) * 0.6;
      bodyRef.current.position.y = 0.9 + Math.abs(Math.sin(time)) * 0.08;
    } else {
      leftLegRef.current.rotation.x = 0;
      rightLegRef.current.rotation.x = 0;
      bodyRef.current.position.y = 0.9;
    }
  });

  return (
    <group position={pos} rotation={[0, rotationY, 0]}>
      {/* Shadow Blob */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.4} />
      </mesh>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.14, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.14, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Body & Head Group */}
      <group ref={bodyRef}>
        {/* Torso with Teal Hoodie */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.6, 16]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.6} />
        </mesh>
        {/* Hair / Cap */}
        <mesh position={[0, 0.6, -0.04]} castShadow>
          <sphereGeometry args={[0.23, 16, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Backpack */}
        <mesh position={[0, 0.05, -0.22]} castShadow>
          <boxGeometry args={[0.28, 0.38, 0.18]} />
          <meshStandardMaterial color="#f97316" roughness={0.6} />
        </mesh>
      </group>

      {/* Player Nametag */}
      <Text position={[0, 1.9, 0]} fontSize={0.2} color="#0284c7" outlineWidth={0.02} outlineColor="#ffffff">
        YOU (Walk with WASD)
      </Text>
    </group>
  );
}

// Camera Rig that smoothly follows the player
function FollowCamera({ playerPos }: { playerPos: [number, number, number] }) {
  useFrame((state) => {
    const targetCamX = playerPos[0];
    const targetCamY = playerPos[1] + 11;
    const targetCamZ = playerPos[2] + 13;

    state.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.08);
    state.camera.lookAt(playerPos[0], playerPos[1] + 1, playerPos[2]);
  });
  return null;
}

export function OfficeWorld({ onInteractStation, activeInteraction, onCloseInteraction }: OfficeWorldProps) {
  // Player State
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 9]);
  const [rotationY, setRotationY] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [nearbyStation, setNearbyStation] = useState<StationData | null>(null);

  // Key tracking
  const keysPressed = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      // Interaction trigger with 'E'
      if ((e.key === 'e' || e.key === 'E') && nearbyStation && !activeInteraction) {
        onInteractStation(nearbyStation.id);
      }

      // Escape closes current modal
      if (e.key === 'Escape' && activeInteraction) {
        onCloseInteraction();
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

  // Movement Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeInteraction) {
        setIsWalking(false);
        return; // Freeze movement while dialog open
      }

      const keys = keysPressed.current;
      let dx = 0;
      let dz = 0;

      if (keys['w'] || keys['arrowup']) dz -= 1;
      if (keys['s'] || keys['arrowdown']) dz += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      if (dx !== 0 || dz !== 0) {
        setIsWalking(true);
        const speed = 0.22;
        const length = Math.sqrt(dx * dx + dz * dz);
        const normDx = (dx / length) * speed;
        const normDz = (dz / length) * speed;

        setPlayerPos(([px, py, pz]) => {
          // Bounding box limits (office perimeter)
          const newX = Math.max(-13, Math.min(13, px + normDx));
          const newZ = Math.max(-11, Math.min(11, pz + normDz));
          return [newX, py, newZ];
        });

        // Face direction
        const angle = Math.atan2(dx, dz);
        setRotationY(angle);
      } else {
        setIsWalking(false);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [activeInteraction]);

  // Proximity Check
  useEffect(() => {
    let closest: StationData | null = null;
    let minDist = 3.2;

    for (const station of STATIONS) {
      const dist = Math.hypot(playerPos[0] - station.pos[0], playerPos[2] - station.pos[2]);
      if (dist < minDist) {
        minDist = dist;
        closest = station;
      }
    }

    setNearbyStation(closest);
  }, [playerPos]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 14, 18], fov: 42 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        {/* Soft Sunny Sky Background */}
        <color attach="background" args={['#e2e8f0']} />

        {/* Natural Daylight Lighting */}
        <ambientLight intensity={0.7} />
        <hemisphereLight args={['#e0f2fe', '#fef3c7', 0.8]} />
        <directionalLight
          position={[15, 25, 12]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {/* Camera Follow Rig */}
        <FollowCamera playerPos={playerPos} />

        {/* Beautiful Natural Oak Parquet Floor */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 24]} />
          <meshStandardMaterial color="#e5c8a0" roughness={0.5} metalness={0.05} />
        </mesh>

        {/* Low Office Perimeter Walls with Modern Trim */}
        <mesh position={[0, 1.2, -12]} receiveShadow>
          <boxGeometry args={[30, 2.4, 0.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[-15, 1.2, 0]} receiveShadow>
          <boxGeometry args={[0.4, 2.4, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[15, 1.2, 0]} receiveShadow>
          <boxGeometry args={[0.4, 2.4, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>

        {/* Sunny Windows & Glass Partitions */}
        <mesh position={[0, 2.4, -11.9]}>
          <planeGeometry args={[26, 1.8]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.35} roughness={0.1} />
        </mesh>

        {/* 5 Agent Stations */}
        {STATIONS.map((station) => (
          <WorkstationDesk
            key={station.id}
            station={station}
            isNearby={nearbyStation?.id === station.id}
            onInteract={() => onInteractStation(station.id)}
          />
        ))}

        {/* Office Props: Plants, Lounges, Coffee Bars */}
        <PottedPlant position={[-13.5, 0, -10]} />
        <PottedPlant position={[13.5, 0, -10]} />
        <PottedPlant position={[-3, 0, 4]} />
        <PottedPlant position={[3, 0, 4]} />
        <PottedPlant position={[-13.5, 0, 8]} />
        <PottedPlant position={[13.5, 0, 8]} />

        <LoungeArea position={[0, 0, -4]} />
        <CoffeeBar position={[-13.5, 0, -3]} />

        {/* Playable Player Character */}
        <PlayableCharacter pos={playerPos} rotationY={rotationY} isWalking={isWalking} />
      </Canvas>

      {/* Onscreen Game Controls / Proximity Notification */}
      {nearbyStation && !activeInteraction && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-bounce">
          <button
            onClick={() => onInteractStation(nearbyStation.id)}
            className="px-6 py-3 rounded-full bg-slate-900 text-white font-mono text-sm shadow-2xl flex items-center gap-3 border-2 border-white/20 hover:scale-105 transition-transform"
          >
            <span>{nearbyStation.icon}</span>
            <span>
              Talk to <strong>{nearbyStation.name}</strong> ({nearbyStation.role})
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-xs font-bold">
              Press [E]
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
