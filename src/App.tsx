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
  const [activeZone, setActiveZone] = useState<OfficeZone>('lobby');
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
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Top Navigation HUD */}
      <Navigation activeZone={activeZone} onZoneSelect={setActiveZone} />

      {/* 3D Interactive Virtual World */}
      <div className="absolute inset-0 z-0">
        <OfficeWorld activeZone={activeZone} onZoneSelect={setActiveZone} />
      </div>

      {/* Floating Interactive Zone HUD (Right Panel) */}
      <div className="absolute right-6 top-20 bottom-6 z-10 flex flex-col justify-center pointer-events-none">
        <div className="pointer-events-auto shadow-2xl">
          {activeZone === 'lobby' && (
            <LobbyPanel 
              userProfile={profile} 
              onProfileUpdate={handleProfileUpdate}
              onNavigateZone={setActiveZone}
            />
          )}

          {activeZone === 'scanner' && (
            <ScannerPanel 
              userProfile={profile} 
              onProfileUpdate={handleProfileUpdate} 
            />
          )}

          {activeZone === 'warroom' && (
            <WarRoomPanel 
              userProfile={profile} 
            />
          )}

          {activeZone === 'corner' && (
            <CornerPanel 
              userProfile={profile} 
            />
          )}

          {activeZone === 'holodeck' && (
            <HolodeckPanel 
              userProfile={profile} 
            />
          )}
        </div>
      </div>

      {/* Bottom Hint / Controls Overlay */}
      <div className="fixed bottom-4 left-6 z-10 pointer-events-none">
        <div className="glass-panel px-3 py-1.5 rounded-lg text-[11px] font-mono text-muted flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span>Click stations in 3D or use the topbar to glide between rooms</span>
        </div>
      </div>
    </div>
  );
}
