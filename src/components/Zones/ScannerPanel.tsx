import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, Loader2, X } from 'lucide-react';
import { extractTextFromPDF } from '../../services/pdf';
import { auditResumeWithBabu } from '../../services/ai';
import { ResumeAnalysisResult, UserProfile } from '../../types';
import { speakAsAgent } from '../../services/voice';
import confetti from 'canvas-confetti';

interface ScannerPanelProps {
  userProfile: UserProfile;
  onProfileUpdate: (updated: Partial<UserProfile>) => void;
  onAuditComplete?: (result: ResumeAnalysisResult) => void;
  onClose: () => void;
}

export function ScannerPanel({ userProfile, onProfileUpdate, onAuditComplete, onClose }: ScannerPanelProps) {
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

      onAuditComplete?.(audit);

      if (audit.extractedSkills?.length > 0) {
        onProfileUpdate({
          skills: Array.from(new Set([...userProfile.skills, ...audit.extractedSkills.slice(0, 8)]))
        });
      }

      speakAsAgent('babu', `ATS audit complete. Your score is ${audit.atsScore} percent. Verdict: ${audit.atsVerdict}.`);

      if (audit.atsScore >= 75) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setIsExtracting(false);
      setIsAuditing(false);
      setError(err.message || 'Audit failed. Please try again.');
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-xl w-full text-left max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-blue-600 uppercase font-semibold">Vault 02 // Diagnostic Scanner</span>
          <h2 className="font-display italic text-2xl text-slate-900">Babu's Forensic ATS Audit</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          title="Close (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Target Role & JD */}
      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1">Target Role</label>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            placeholder="e.g. Senior Full Stack Engineer"
            value={userProfile.targetRole}
            onChange={(e) => onProfileUpdate({ targetRole: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1">Optional Job Description (Keywords to Match)</label>
          <textarea
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
            placeholder="Paste target job listing requirements to calculate keyword match..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>
      </div>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 rounded-xl p-6 text-center transition-colors mb-5">
        <input 
          type="file" 
          id="resumeUpload" 
          accept=".pdf,.txt" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <label htmlFor="resumeUpload" className="cursor-pointer flex flex-col items-center">
          <Upload className="w-8 h-8 text-blue-500 mb-2 animate-bounce" />
          {file ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
              <FileText className="w-4 h-4" />
              <span className="font-mono">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-800">Drop your PDF resume onto Babu's scanner</p>
              <p className="text-xs text-slate-500 mt-1">Real text stream extraction with pdfjs-dist</p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleRunAudit}
        disabled={isExtracting || isAuditing || !file}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
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
        <div className="mt-6 pt-6 border-t border-slate-200 space-y-5 animate-fade-in">
          {/* Score header */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase">ATS Compatibility Score</div>
              <div className="text-3xl font-mono font-bold text-emerald-600">{result.atsScore}%</div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-mono font-semibold">
                {result.atsVerdict}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{result.atsSummary}</p>

          {/* Extracted vs Missing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] font-mono text-emerald-700 mb-2 uppercase flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.extractedSkills.map((s, i) => (
                  <span key={i} className="text-[10px] font-mono bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] font-mono text-red-600 mb-2 uppercase flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Missing Gaps
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missingSkills.map((s, i) => (
                  <span key={i} className="text-[10px] font-mono bg-red-100/70 text-red-800 px-2 py-0.5 rounded border border-red-300">
                    ! {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Improvements */}
          <div>
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">Babu's Recommended Fixes</h3>
            <div className="space-y-3">
              {result.improvements.map((imp, i) => {
                const desc = imp.description;
                const beforeMatch = desc.match(/BEFORE:\s*["']?([\s\S]*?)["']?(?=\n\s*AFTER:|$)/i);
                const afterMatch = desc.match(/AFTER:\s*["']?([\s\S]*?)["']?(?=\n\s*WHY:|$)/i);
                const whyMatch = desc.match(/WHY:\s*["']?([\s\S]*?)["']?$/i);

                return (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs shadow-sm">
                    <div className="font-semibold text-slate-800 flex items-center justify-between mb-1">
                      <span>{imp.title}</span>
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold">
                        {imp.priority} Priority
                      </span>
                    </div>

                    {beforeMatch && afterMatch ? (
                      <div className="space-y-2 mt-2 font-mono text-[11px]">
                        <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-200/80 text-slate-700">
                          <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-0.5">
                            ❌ Original / Weak Phrasing:
                          </div>
                          <p className="italic text-slate-600 font-sans text-xs">"{beforeMatch[1].trim()}"</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-slate-800">
                          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                            ✅ Google X-Y-Z Senior Rewrite:
                          </div>
                          <p className="font-semibold text-emerald-950 font-sans text-xs">"{afterMatch[1].trim()}"</p>
                        </div>

                        {whyMatch && (
                          <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200/80 text-blue-900 text-[10.5px]">
                            <strong className="text-blue-950">💡 Why Recruiters Love It: </strong>
                            <span className="font-sans text-xs">{whyMatch[1].trim()}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line font-mono text-[11px] bg-white/70 p-2.5 rounded-md border border-slate-200/80 mt-1.5">
                        {imp.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
