import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { extractTextFromPDF } from '../../services/pdf';
import { auditResumeWithBabu } from '../../services/ai';
import { ResumeAnalysisResult, UserProfile } from '../../types';
import { speakAsAgent } from '../../services/voice';
import confetti from 'canvas-confetti';

interface ScannerPanelProps {
  userProfile: UserProfile;
  onProfileUpdate: (updated: Partial<UserProfile>) => void;
}

export function ScannerPanel({ userProfile, onProfileUpdate }: ScannerPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    if (uploaded.type !== 'application/pdf' && !uploaded.name.endsWith('.pdf') && !uploaded.type.includes('text')) {
      setError('Please upload a PDF or plain text resume.');
      return;
    }

    setFile(uploaded);
    setError(null);
  };

  const handleRunAudit = async () => {
    if (!file) {
      setError('Please upload your resume first.');
      return;
    }

    setError(null);
    setIsExtracting(true);

    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }

      setIsExtracting(false);
      setIsAuditing(true);

      const audit = await auditResumeWithBabu(text, userProfile.targetRole || 'Software Engineer', jobDesc);
      setResult(audit);
      setIsAuditing(false);

      if (audit.extractedSkills?.length > 0) {
        onProfileUpdate({
          skills: Array.from(new Set([...userProfile.skills, ...audit.extractedSkills.slice(0, 8)]))
        });
      }

      // Voice response from Babu
      speakAsAgent('babu', `ATS audit complete. Your score is ${audit.atsScore} percent. Verdict: ${audit.atsVerdict}.`);

      if (audit.atsScore >= 75) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setIsExtracting(false);
      setIsAuditing(false);
      setError(err.message || 'Audit failed. Check your Groq API key.');
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full text-left max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#6e8fff] uppercase">Vault 02 // Diagnostic Scanner</span>
          <h2 className="font-display italic text-2xl text-[#f0efe8]">Babu's Forensic ATS Audit</h2>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-[#6e8fff]/10 text-[#6e8fff] border border-[#6e8fff]/20 rounded-full">
          Deep PDF Parsing
        </span>
      </div>

      {/* Target Role & JD */}
      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-[11px] font-mono text-muted uppercase tracking-wider mb-1">Target Role</label>
          <input
            type="text"
            className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            placeholder="e.g. Senior Full Stack Engineer"
            value={userProfile.targetRole}
            onChange={(e) => onProfileUpdate({ targetRole: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-muted uppercase tracking-wider mb-1">Optional Job Description (Keywords to Match)</label>
          <textarea
            rows={2}
            className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-accent resize-none"
            placeholder="Paste target job listing requirements to calculate keyword match..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>
      </div>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center hover:border-[#6e8fff]/50 transition-colors mb-5 bg-[#0a0a0f]/40">
        <input 
          type="file" 
          id="resumeUpload" 
          accept=".pdf,.txt" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <label htmlFor="resumeUpload" className="cursor-pointer flex flex-col items-center">
          <Upload className="w-8 h-8 text-[#6e8fff] mb-2 animate-bounce" />
          {file ? (
            <div className="flex items-center gap-2 text-sm text-accent">
              <FileText className="w-4 h-4" />
              <span className="font-mono">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-text">Drop your PDF resume onto the scanner</p>
              <p className="text-xs text-muted mt-1">Real text stream extraction with pdfjs-dist</p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="p-3 bg-brutal/10 border border-brutal/30 text-brutal text-xs rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleRunAudit}
        disabled={isExtracting || isAuditing || !file}
        className="w-full py-3 bg-[#6e8fff] hover:bg-[#5b7cee] disabled:opacity-40 text-[#0a0a0f] font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#6e8fff]/20"
      >
        {isExtracting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Extracting Full PDF Text Stream...</span>
          </>
        ) : isAuditing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Babu is Auditing ATS Keywords...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Execute Forensic Audit</span>
          </>
        )}
      </button>

      {/* Results View */}
      {result && (
        <div className="mt-6 pt-6 border-t border-white/10 space-y-5 animate-fade-in">
          {/* Score header */}
          <div className="flex items-center justify-between bg-surface2 p-4 rounded-xl border border-white/10">
            <div>
              <div className="text-xs font-mono text-muted uppercase">ATS Compatibility Score</div>
              <div className="text-3xl font-mono font-bold text-accent">{result.atsScore}%</div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-md text-xs font-mono font-semibold">
                {result.atsVerdict}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted leading-relaxed">{result.atsSummary}</p>

          {/* Extracted vs Missing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface2 p-3 rounded-xl border border-white/5">
              <div className="text-[11px] font-mono text-accent mb-2 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.extractedSkills.map((s, i) => (
                  <span key={i} className="text-[10px] font-mono bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-surface2 p-3 rounded-xl border border-white/5">
              <div className="text-[11px] font-mono text-brutal mb-2 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Missing Gaps
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missingSkills.map((s, i) => (
                  <span key={i} className="text-[10px] font-mono bg-brutal/10 text-brutal px-2 py-0.5 rounded border border-brutal/20">
                    ! {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Improvements */}
          <div>
            <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Babu's Recommended Fixes</h3>
            <div className="space-y-2">
              {result.improvements.map((imp, i) => (
                <div key={i} className="p-3 bg-surface2/60 border border-white/5 rounded-lg text-xs">
                  <div className="font-semibold text-text flex items-center justify-between mb-1">
                    <span>{imp.title}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-muted">
                      {imp.priority}
                    </span>
                  </div>
                  <p className="text-muted leading-relaxed">{imp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
