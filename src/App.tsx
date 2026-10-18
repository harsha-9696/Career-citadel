import React, { useState, useEffect } from 'react';
import { OfficeZone, UserProfile, CitadelDossier, ResumeAnalysisResult, InterviewEvaluation, InterviewAnswer, CareerSimulation } from './types';
import { Navigation } from './components/Layout/Navigation';
import { OfficeWorld } from './components/World/OfficeWorld';
import { LobbyPanel } from './components/Zones/LobbyPanel';
import { ScannerPanel } from './components/Zones/ScannerPanel';
import { WarRoomPanel } from './components/Zones/WarRoomPanel';
import { CornerPanel } from './components/Zones/CornerPanel';
import { HolodeckPanel } from './components/Zones/HolodeckPanel';
import { MiniMap } from './components/UI/MiniMap';
import { calculateReadinessScore } from './services/dossierExport';
import { LayoutGrid, PanelBottom, Maximize2, Minimize2 } from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  name: 'Harsh',
  targetRole: 'Full Stack Engineer',
  skills: ['React', 'TypeScript', 'Node.js', 'Python'],
  experience: 'junior',
  education: 'B.Tech Computer Science'
};

const INITIAL_DOSSIER: CitadelDossier = {
  profile: INITIAL_PROFILE,
  resumeAudit: null,
  interviewEvaluation: null,
  interviewTranscript: [],
  latestRoast: null,
  simulations: [],
  overallReadinessScore: 35
};

export default function App() {
  const [activeZone, setActiveZone] = useState<OfficeZone | null>(null);
  const [dialogMode, setDialogMode] = useState<'drawer' | 'dock'>('drawer');

  // Player telemetry for MiniMap / Radar
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 8.0]);
  const [playerRotY, setPlayerRotY] = useState<number>(Math.PI);
  const [targetTeleport, setTargetTeleport] = useState<[number, number, number] | null>(null);

  const [dossier, setDossier] = useState<CitadelDossier>(() => {
    try {
      const saved = localStorage.getItem('citadel_dossier_data');
      if (saved) return JSON.parse(saved);
      const savedProfile = localStorage.getItem('citadel_user_profile');
      if (savedProfile) {
        return {
          ...INITIAL_DOSSIER,
          profile: JSON.parse(savedProfile)
        };
      }
    } catch (e) {
      // Fallback
    }
    return INITIAL_DOSSIER;
  });

  useEffect(() => {
    localStorage.setItem('citadel_dossier_data', JSON.stringify(dossier));
    localStorage.setItem('citadel_user_profile', JSON.stringify(dossier.profile));
  }, [dossier]);

  // Global ESC key listener to guarantee immediate modal exit from any focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveZone(null);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleProfileUpdate = (updated: Partial<UserProfile>) => {
    setDossier(prev => {
      const newProfile = { ...prev.profile, ...updated };
      const updatedDossier = { ...prev, profile: newProfile };
      return {
        ...updatedDossier,
        overallReadinessScore: calculateReadinessScore(updatedDossier)
      };
    });
  };

  const handleAuditComplete = (audit: ResumeAnalysisResult) => {
    setDossier(prev => {
      const updatedDossier = { ...prev, resumeAudit: audit };
      return {
        ...updatedDossier,
        overallReadinessScore: calculateReadinessScore(updatedDossier)
      };
    });
  };

  const handleInterviewComplete = (evaluation: InterviewEvaluation, answers: InterviewAnswer[]) => {
    setDossier(prev => {
      const updatedDossier = {
        ...prev,
        interviewEvaluation: evaluation,
        interviewTranscript: answers
      };
      return {
        ...updatedDossier,
        overallReadinessScore: calculateReadinessScore(updatedDossier)
      };
    });
  };

  const handleRoastComplete = (roast: string) => {
    setDossier(prev => ({
      ...prev,
      latestRoast: roast
    }));
  };

  const handleSimulationComplete = (sim: CareerSimulation) => {
    setDossier(prev => ({
      ...prev,
      simulations: [sim, ...prev.simulations.filter(s => s.skill !== sim.skill)]
    }));
  };

  const handleTeleportFromRadar = (pos: [number, number, number], zone?: OfficeZone) => {
    setTargetTeleport(pos);
    if (zone) {
      // Small delay so player lands in room, then dialog activates
      setTimeout(() => {
        setActiveZone(zone);
      }, 200);
    }
  };

  // Build conversational summary for Veena
  const buildDossierSummary = (): string => {
    const parts: string[] = [];
    if (dossier.resumeAudit) {
      parts.push(`Babu's ATS audit: ${dossier.resumeAudit.atsScore}% (${dossier.resumeAudit.atsVerdict}). Missing skills: ${dossier.resumeAudit.missingSkills.slice(0, 3).join(', ')}.`);
    }
    if (dossier.interviewEvaluation) {
      parts.push(`Ravi & Radha's interview: ${dossier.interviewEvaluation.overallScore}% (${dossier.interviewEvaluation.grade}).`);
    }
    if (dossier.latestRoast) {
      parts.push(`Harsha delivered a brutal reality check in the Corner Office.`);
    }
    return parts.join(' ');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#e2e8f0]">
      {/* Top Navigation HUD with Citadel Readiness & Export */}
      <Navigation 
        activeZone={activeZone}
        dossier={dossier}
        onZoneSelect={(zone) => {
          setActiveZone(zone);
        }} 
      />

      {/* 3D Playable Virtual Game World */}
      <div className="absolute inset-0 z-0">
        <OfficeWorld 
          activeInteraction={activeZone}
          onInteractStation={(zone) => setActiveZone(zone)}
          onCloseInteraction={() => setActiveZone(null)}
          onPlayerMove={(pos, rotY) => {
            setPlayerPos(pos);
            setPlayerRotY(rotY);
          }}
          targetTeleport={targetTeleport}
          onTeleportComplete={() => setTargetTeleport(null)}
        />
      </div>

      {/* Interactive 3D MiniMap / Radar HUD (Bottom-Right) */}
      <div className="fixed bottom-5 right-6 z-30 pointer-events-auto">
        <MiniMap 
          playerPos={playerPos}
          playerRotY={playerRotY}
          onTeleport={handleTeleportFromRadar}
        />
      </div>

      {/* Adaptive Interaction Modal / Drawer with Viewport Mode Toggle */}
      {activeZone && (
        <div 
          className={`fixed z-50 animate-fade-in pointer-events-auto transition-all duration-300 ${
            dialogMode === 'dock'
              ? 'bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 flex justify-center'
              : 'inset-y-0 right-0 p-6 flex items-center justify-end bg-slate-900/30 backdrop-blur-sm'
          }`}
        >
          <div className="relative w-full max-w-xl">
            {/* Viewport Mode Controls (Dock vs Drawer) */}
            <div className="absolute -top-10 right-2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg text-slate-300 text-xs font-mono shadow-lg border border-slate-700/80">
              <button
                onClick={() => setDialogMode(dialogMode === 'drawer' ? 'dock' : 'drawer')}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title={dialogMode === 'drawer' ? 'Switch to Lower-Third Dock (Full View)' : 'Switch to Side Drawer'}
              >
                {dialogMode === 'drawer' ? (
                  <>
                    <PanelBottom className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dock Mode</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Drawer Mode</span>
                  </>
                )}
              </button>
            </div>

            {activeZone === 'lobby' && (
              <LobbyPanel 
                userProfile={dossier.profile}
                dossierSummary={buildDossierSummary()}
                onProfileUpdate={handleProfileUpdate}
                onNavigateZone={(zone) => setActiveZone(zone)}
                onClose={() => setActiveZone(null)}
              />
            )}

            {activeZone === 'scanner' && (
              <ScannerPanel 
                userProfile={dossier.profile} 
                onProfileUpdate={handleProfileUpdate}
                onAuditComplete={handleAuditComplete}
                onClose={() => setActiveZone(null)}
              />
            )}

            {activeZone === 'warroom' && (
              <WarRoomPanel 
                userProfile={dossier.profile}
                missingSkills={dossier.resumeAudit?.missingSkills || []}
                onInterviewComplete={handleInterviewComplete}
                onClose={() => setActiveZone(null)}
              />
            )}

            {activeZone === 'corner' && (
              <CornerPanel 
                userProfile={dossier.profile}
                dossierStats={{
                  resumeScore: dossier.resumeAudit?.atsScore,
                  resumeVerdict: dossier.resumeAudit?.atsVerdict,
                  interviewScore: dossier.interviewEvaluation?.overallScore,
                  interviewGrade: dossier.interviewEvaluation?.grade,
                  missingSkills: dossier.resumeAudit?.missingSkills,
                  weaknesses: dossier.interviewEvaluation?.weaknesses
                }}
                onRoastComplete={handleRoastComplete}
                onClose={() => setActiveZone(null)}
              />
            )}

            {activeZone === 'holodeck' && (
              <HolodeckPanel 
                userProfile={dossier.profile}
                onSimulationComplete={handleSimulationComplete}
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
          <span>Move (Third-Person)</span>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold">Drag</kbd>
            <span>Orbit</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300 text-[10px] font-bold">E</kbd>
            <span>Sit & Talk</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold">ESC</kbd>
            <span>Stand Up</span>
          </div>
        </div>
      </div>
    </div>
  );
}
