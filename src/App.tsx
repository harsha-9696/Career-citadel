import React, { useState, useEffect } from 'react';
import { OfficeZone, UserProfile } from './types';
import { Navigation } from './components/Layout/Navigation';
import { OfficeWorld } from './components/World/OfficeWorld';
import { LobbyPanel } from './components/Zones/LobbyPanel';
import { ScannerPanel } from './components/Zones/ScannerPanel';
import { WarRoomPanel } from './components/Zones/WarRoomPanel';
import { CornerPanel } from './components/Zones/CornerPanel';
import { HolodeckPanel } from './components/Zones/HolodeckPanel';

const INITIAL_PROFILE: UserProfile = {
  name: 'Harsh',
  targetRole: 'Full Stack Engineer',
  skills: ['React', 'TypeScript', 'Node.js', 'Python'],
  experience: 'junior',
  education: 'B.Tech Computer Science'
};

export default function App() {
  // Start with null so NO dialog blocks the 3D game on initial load!
  const [activeZone, setActiveZone] = useState<OfficeZone | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('citadel_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('citadel_user_profile', JSON.stringify(profile));
  }, [profile]);

  const handleProfileUpdate = (updated: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updated }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#e2e8f0]">
      {/* Top Navigation HUD */}
      <Navigation 
        activeZone={activeZone} 
        onZoneSelect={(zone) => setActiveZone(zone)} 
      />

      {/* 3D Playable Virtual Game World */}
      <div className="absolute inset-0 z-0">
        <OfficeWorld 
          activeInteraction={activeZone}
          onInteractStation={(zone) => setActiveZone(zone)}
          onCloseInteraction={() => setActiveZone(null)}
        />
      </div>

      {/* Interaction Modal / Drawer (Only opens when you interact with an agent!) */}
      {activeZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-6 bg-slate-900/30 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="w-full max-w-xl">
            {activeZone === 'lobby' && (
              <LobbyPanel 
                userProfile={profile} 
                onProfileUpdate={handleProfileUpdate}
                onNavigateZone={(zone) => setActiveZone(zone)}
                onClose={() => setActiveZone(null)}
              />
            )}

            {activeZone === 'scanner' && (
              <ScannerPanel 
                userProfile={profile} 
                onProfileUpdate={handleProfileUpdate} 
                onClose={() => setActiveZone(null)}
              />
            )}

            {activeZone === 'warroom' && (
              <WarRoomPanel 
                userProfile={profile} 
                onClose={() => setActiveZone(null)}
              />
            )}

            {activeZone === 'corner' && (
              <CornerPanel 
                userProfile={profile} 
                onClose={() => setActiveZone(null)}
              />
            )}

            {activeZone === 'holodeck' && (
              <HolodeckPanel 
                userProfile={profile} 
                onClose={() => setActiveZone(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* Bottom Game Controls HUD (Always visible hint) */}
      <div className="fixed bottom-5 left-6 z-30 pointer-events-none">
        <div className="glass-panel px-4 py-2.5 rounded-xl text-xs font-mono text-slate-700 flex items-center gap-3 shadow-lg border border-slate-200">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold">W</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold">A</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold">S</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold">D</kbd>
          </div>
          <span>Move Player</span>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300 text-[10px] font-bold">E</kbd>
            <span>Talk to Agent</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold">ESC</kbd>
            <span>Close Modal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
