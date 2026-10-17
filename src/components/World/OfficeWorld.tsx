import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, MeshReflectorMaterial, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OfficeZone } from '../../types';

interface OfficeWorldProps {
  activeZone: OfficeZone;
  onZoneSelect: (zone: OfficeZone) => void;
}

// Target camera positions for each office zone
const CAMERA_TARGETS: Record<OfficeZone, { pos: [number, number, number]; lookAt: [number, number, number] }> = {
  lobby: { pos: [0, 6, 12], lookAt: [0, 1, 0] },
  scanner: { pos: [-12, 5, 8], lookAt: [-12, 1, 0] },
  warroom: { pos: [12, 5, 8], lookAt: [12, 1, 0] },
  corner: { pos: [0, 12, -4], lookAt: [0, 8, -12] },
  holodeck: { pos: [0, 5, 20], lookAt: [0, 1, 12] },
};

function CameraController({ activeZone }: { activeZone: OfficeZone }) {
  const target = CAMERA_TARGETS[activeZone] || CAMERA_TARGETS.lobby;

  useFrame((state) => {
    // Smooth camera position transition
    state.camera.position.lerp(new THREE.Vector3(...target.pos), 0.05);
    
    // Smooth look-at target transition
    const currentLookAt = new THREE.Vector3(0, 1, 0);
    currentLookAt.lerp(new THREE.Vector3(...target.lookAt), 0.05);
    state.camera.lookAt(currentLookAt);
  });

  return null;
}

// 1. LOBBY: Veena's Holographic Mirror Hall
function LobbyStation({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  const crystalRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.6;
      crystalRef.current.rotation.x += delta * 0.3;
    }
  });

  return (
    <group position={[0, 0, 0]} onClick={onClick}>
      {/* Station Base / Dais */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[3, 3.2, 0.2, 32]} />
        <meshStandardMaterial color="#111118" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Floating Holographic Crystal */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
        <mesh ref={crystalRef} position={[0, 2, 0]}>
          <octahedronGeometry args={[0.9]} />
          <meshPhysicalMaterial 
            color="#7fff6e" 
            emissive="#7fff6e" 
            emissiveIntensity={isActive ? 1.5 : 0.8}
            roughness={0.1}
            metalness={0.2}
            transmission={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
      </Float>

      {/* Neon Base Ring */}
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 2.9, 32]} />
        <meshBasicMaterial color="#7fff6e" />
      </mesh>

      <Text position={[0, 0.35, 3.4]} fontSize={0.35} color="#7fff6e" font="/fonts/Syne-Bold.ttf">
        VEENA // RECEPTION
      </Text>
    </group>
  );
}

// 2. SCANNER LAB: Babu's ATS Vault
function ScannerStation({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  const laserRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (laserRef.current) {
      laserRef.current.position.z = Math.sin(clock.getElapsedTime() * 3) * 1.2;
    }
  });

  return (
    <group position={[-12, 0, 0]} onClick={onClick}>
      {/* Scanner Bed */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[3, 0.8, 3.8]} />
        <meshStandardMaterial color="#16161f" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Glowing Scanner Glass */}
      <mesh position={[0, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshStandardMaterial 
          color="#111118" 
          emissive="#6e8fff" 
          emissiveIntensity={isActive ? 0.6 : 0.2}
          roughness={0.1} 
        />
      </mesh>

      {/* Animated Optical Laser Bar */}
      <mesh ref={laserRef} position={[0, 1.05, 0]}>
        <boxGeometry args={[2.6, 0.05, 0.08]} />
        <meshBasicMaterial color={isActive ? "#ff4444" : "#6e8fff"} />
      </mesh>

      {/* Server Rack Pillar */}
      <mesh position={[-2, 1.8, -1.5]}>
        <boxGeometry args={[0.8, 3.6, 0.8]} />
        <meshStandardMaterial color="#0e0e14" roughness={0.8} />
      </mesh>

      <Text position={[0, 0.35, 2.5]} fontSize={0.35} color="#6e8fff">
        BABU // ATS SCANNER
      </Text>
    </group>
  );
}

// 3. WAR ROOM: Ravi & Radha's Mock Boardroom
function WarRoomStation({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <group position={[12, 0, 0]} onClick={onClick}>
      {/* Boardroom Table */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[4.2, 0.6, 2.2]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Chairs for Ravi and Radha */}
      <mesh position={[-1.2, 0.8, -1.5]}>
        <boxGeometry args={[0.7, 1.2, 0.7]} />
        <meshStandardMaterial color="#111118" />
      </mesh>
      <mesh position={[1.2, 0.8, -1.5]}>
        <boxGeometry args={[0.7, 1.2, 0.7]} />
        <meshStandardMaterial color="#111118" />
      </mesh>

      {/* Floating Microphones */}
      <Float speed={1.5} floatIntensity={0.5}>
        <mesh position={[-1.2, 1.2, -0.4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3]} />
          <meshStandardMaterial color="#7fff6e" emissive="#7fff6e" emissiveIntensity={isActive ? 1 : 0.3} />
        </mesh>
        <mesh position={[1.2, 1.2, -0.4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3]} />
          <meshStandardMaterial color="#6e8fff" emissive="#6e8fff" emissiveIntensity={isActive ? 1 : 0.3} />
        </mesh>
      </Float>

      <Text position={[0, 0.35, 2]} fontSize={0.35} color="#f0efe8">
        RAVI & RADHA // WAR ROOM
      </Text>
    </group>
  );
}

// 4. CORNER OFFICE: Harsha's Brutal Executive Suite
function CornerOfficeStation({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <group position={[0, 7.5, -12]} onClick={onClick}>
      {/* Penthouse Platform */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[9, 0.4, 7]} />
        <meshStandardMaterial color="#0e0e14" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Executive Desk */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[4, 0.8, 1.6]} />
        <meshStandardMaterial color="#16161f" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Executive Chair */}
      <mesh position={[0, 1.2, -1.3]}>
        <boxGeometry args={[1, 1.8, 0.8]} />
        <meshStandardMaterial color="#ff4444" roughness={0.4} />
      </mesh>

      {/* Amber / Red Accent Window Light */}
      <pointLight position={[0, 2, -3]} color="#ff4444" intensity={isActive ? 3 : 1} distance={8} />

      <Text position={[0, 0.4, 2.5]} fontSize={0.4} color="#ff4444">
        HARSHA // CORNER OFFICE
      </Text>
    </group>
  );
}

// 5. HOLODECK: Radha's What-If Quantum Simulator
function HolodeckStation({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
    }
  });

  return (
    <group position={[0, 0, 12]} onClick={onClick}>
      {/* Hologram Dais */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[3.2, 3.4, 0.2, 32]} />
        <meshStandardMaterial color="#111118" />
      </mesh>

      {/* Rotating Cyber Ring */}
      <mesh ref={ringRef} position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 2.7, 32]} />
        <meshBasicMaterial color={isActive ? "#7fff6e" : "#6e8fff"} wireframe />
      </mesh>

      <Text position={[0, 0.35, 3.8]} fontSize={0.35} color="#7fff6e">
        RADHA // WHAT-IF SIMULATOR
      </Text>
    </group>
  );
}

export function OfficeWorld({ activeZone, onZoneSelect }: OfficeWorldProps) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 8, 14], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        
        {/* Ambient & Atmosphere Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 15]} intensity={1.2} />
        <pointLight position={[0, 10, 0]} color="#7fff6e" intensity={0.6} distance={20} />

        {/* Dynamic Camera Rig */}
        <CameraController activeZone={activeZone} />

        {/* The 5 Stations */}
        <LobbyStation onClick={() => onZoneSelect('lobby')} isActive={activeZone === 'lobby'} />
        <ScannerStation onClick={() => onZoneSelect('scanner')} isActive={activeZone === 'scanner'} />
        <WarRoomStation onClick={() => onZoneSelect('warroom')} isActive={activeZone === 'warroom'} />
        <CornerOfficeStation onClick={() => onZoneSelect('corner')} isActive={activeZone === 'corner'} />
        <HolodeckStation onClick={() => onZoneSelect('holodeck')} isActive={activeZone === 'holodeck'} />

        {/* Floor with mirror reflection */}
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[70, 70]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={512}
            mixBlur={1}
            mixStrength={40}
            roughness={0.6}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0d0d14"
            metalness={0.8}
            mirror={0.5}
          />
        </mesh>

        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={40} blur={2} far={10} />
      </Canvas>
    </div>
  );
}
