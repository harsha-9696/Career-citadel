import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
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

export function DelegationCharacter({
  position,
  rotation = [0, 0, 0],
  color,
  animation = 'Idle',
  hasCap = false,
  hasHeadphones = false,
  scale = 0.95,
  onClick,
  name,
  isNearby = false,
}: DelegationCharacterProps) {
  const groupRef = useRef<THREE.Group>(null!);
  
  // Load the genuine rigged character model from the-delegation
  const { scene, animations } = useGLTF('/models/character.glb', '/vendor/draco/');

  // Clone skeleton and hierarchy uniquely for this character instance
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as THREE.Group;
    
    // Apply styling, colors and accessories
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.SkinnedMesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.name === 'body') {
          // Distinct personality color for character clothes
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
  }, [scene, color, hasCap, hasHeadphones]);

  // Setup AnimationMixer for this clone
  const mixer = useMemo(() => new THREE.AnimationMixer(clonedScene), [clonedScene]);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  // Play and cross-fade animations when state changes
  useEffect(() => {
    if (!animations || animations.length === 0) return;

    // Find the matching clip (case-insensitive)
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
  }, [mixer, animations, animation]);

  // Update mixer on every frame
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

// Preload the model
useGLTF.preload('/models/character.glb', '/vendor/draco/');
