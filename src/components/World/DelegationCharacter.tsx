import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export type CharacterAnimation = 
  | 'Idle' 
  | 'Walk' 
  | 'Talk' 
  | 'Listen' 
  | 'Sit' 
  | 'Sit_Idle' 
  | 'Sit_Work' 
  | 'LookAround' 
  | 'Happy' 
  | 'Sad' 
  | 'Pick' 
  | 'Wave';

interface DelegationCharacterProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  animation?: CharacterAnimation;
  hasCap?: boolean;
  hasHeadphones?: boolean;
  scale?: number;
  onClick?: () => void;
  name?: string;
  isNearby?: boolean;
}

// Global cached GLTF asset so it only loads once across all characters
let cachedGLTF: { scene: THREE.Group; animations: THREE.AnimationClip[] } | null = null;
let isLoadingGLTF = false;
const gltfCallbacks: Array<(data: { scene: THREE.Group; animations: THREE.AnimationClip[] }) => void> = [];

function loadGLTFOnce(onSuccess: (data: { scene: THREE.Group; animations: THREE.AnimationClip[] }) => void) {
  if (cachedGLTF) {
    onSuccess(cachedGLTF);
    return;
  }
  gltfCallbacks.push(onSuccess);
  if (isLoadingGLTF) return;
  isLoadingGLTF = true;

  try {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/vendor/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/models/character.glb',
      (gltf) => {
        cachedGLTF = { scene: gltf.scene, animations: gltf.animations };
        gltfCallbacks.forEach((cb) => cb(cachedGLTF!));
        gltfCallbacks.length = 0;
      },
      undefined,
      (err) => {
        console.warn('Fallback to procedural avatar due to model load issue:', err);
      }
    );
  } catch (err) {
    console.warn('Draco/GLTF init warning, using stylized avatar:', err);
  }
}

export function DelegationCharacter({
  position,
  rotation = [0, 0, 0],
  color,
  animation = 'Idle',
  hasCap = false,
  hasHeadphones = false,
  scale = 0.95,
  onClick,
}: DelegationCharacterProps) {
  const [modelData, setModelData] = useState<{ scene: THREE.Group; animations: THREE.AnimationClip[] } | null>(cachedGLTF);

  useEffect(() => {
    loadGLTFOnce((data) => {
      setModelData(data);
    });
  }, []);

  if (modelData) {
    return (
      <RiggedGLTFCharacter
        modelData={modelData}
        position={position}
        rotation={rotation}
        color={color}
        animation={animation}
        hasCap={hasCap}
        hasHeadphones={hasHeadphones}
        scale={scale}
        onClick={onClick}
      />
    );
  }

  // Beautiful stylized procedural avatar fallback (renders instantly on frame 1)
  return (
    <ProceduralAvatar
      position={position}
      rotation={rotation}
      color={color}
      animation={animation}
      hasCap={hasCap}
      hasHeadphones={hasHeadphones}
      scale={scale}
      onClick={onClick}
    />
  );
}

// ── Rigged 3D Character from the-delegation ──
function RiggedGLTFCharacter({
  modelData,
  position,
  rotation,
  color,
  animation,
  hasCap,
  hasHeadphones,
  scale,
  onClick,
}: {
  modelData: { scene: THREE.Group; animations: THREE.AnimationClip[] };
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  animation: CharacterAnimation;
  hasCap: boolean;
  hasHeadphones: boolean;
  scale: number;
  onClick?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(modelData.scene) as THREE.Group;
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.SkinnedMesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.name === 'body') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.55,
            metalness: 0.1,
          });
        } else if (mesh.name === 'cap') {
          mesh.visible = !!hasCap;
          if (hasCap) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#1e293b'),
              roughness: 0.7,
            });
          }
        } else if (mesh.name === 'headphones') {
          mesh.visible = !!hasHeadphones;
          if (hasHeadphones) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#0f172a'),
              roughness: 0.3,
              metalness: 0.8,
            });
          }
        }
      }
    });
    return clone;
  }, [modelData, color, hasCap, hasHeadphones]);

  const mixer = useMemo(() => new THREE.AnimationMixer(clonedScene), [clonedScene]);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const { animations } = modelData;
    if (!animations || animations.length === 0) return;

    const clip = animations.find(
      (a) => a.name.toLowerCase() === animation.toLowerCase()
    ) || animations.find((a) => a.name === 'Idle') || animations[0];

    if (!clip) return;

    const nextAction = mixer.clipAction(clip);
    if (activeActionRef.current && activeActionRef.current !== nextAction) {
      activeActionRef.current.fadeOut(0.2);
    }

    nextAction.reset().fadeIn(0.2).play();
    activeActionRef.current = nextAction;

    return () => {
      nextAction.fadeOut(0.2);
    };
  }, [mixer, modelData, animation]);

  useFrame((_, delta) => {
    mixer.update(delta);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// ── Stylized Procedural Character (Instant fallback & zero blank screen) ──
function ProceduralAvatar({
  position,
  rotation,
  color,
  animation,
  hasCap,
  hasHeadphones,
  scale,
  onClick,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  animation: CharacterAnimation;
  hasCap: boolean;
  hasHeadphones: boolean;
  scale: number;
  onClick?: () => void;
}) {
  const headRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Mesh>(null!);
  const rightLegRef = useRef<THREE.Mesh>(null!);
  const isSeated = animation.includes('Sit');
  const isWalking = animation === 'Walk';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (headRef.current) {
      headRef.current.position.y = 1.35 + Math.sin(t * 2) * 0.02;
    }
    if (isWalking && leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(t * 10) * 0.6;
      rightLegRef.current.rotation.x = -Math.sin(t * 10) * 0.6;
    } else if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = isSeated ? -Math.PI / 2 : 0;
      rightLegRef.current.rotation.x = isSeated ? -Math.PI / 2 : 0;
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      {/* Head Group */}
      <group ref={headRef} position={[0, 1.35, 0]}>
        {/* Head Mesh */}
        <mesh castShadow>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.4} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 0.08, -0.05]} castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Expressive Eyes */}
        <mesh position={[-0.09, 0.03, 0.22]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.09, 0.03, 0.22]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* Optional Baseball Cap */}
        {hasCap && (
          <group position={[0, 0.15, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.29, 16, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0, 0.25]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.32, 0.03, 0.25]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
          </group>
        )}

        {/* Optional Over-ear Headphones */}
        {hasHeadphones && (
          <group position={[0, 0.05, 0]}>
            <mesh position={[-0.27, 0, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.06, 12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} />
            </mesh>
            <mesh position={[0.27, 0, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.06, 12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} />
            </mesh>
          </group>
        )}
      </group>

      {/* Torso / Jacket */}
      <mesh position={[0, isSeated ? 0.75 : 0.88, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.22, 0.45, 8, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* Legs */}
      <mesh
        ref={leftLegRef}
        position={[-0.12, isSeated ? 0.55 : 0.35, isSeated ? 0.2 : 0]}
        rotation={[isSeated ? -Math.PI / 2 : 0, 0, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.08, 0.35, 6, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      <mesh
        ref={rightLegRef}
        position={[0.12, isSeated ? 0.55 : 0.35, isSeated ? 0.2 : 0]}
        rotation={[isSeated ? -Math.PI / 2 : 0, 0, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.08, 0.35, 6, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
    </group>
  );
}
