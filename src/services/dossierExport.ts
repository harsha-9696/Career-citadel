import { CitadelDossier } from '../types';

export function calculateReadinessScore(dossier: Partial<CitadelDossier>): number {
  let totalWeight = 0;
  let weightedSum = 0;

  // Profile completeness (weight 20%)
  if (dossier.profile) {
    let profileScore = 0;
    if (dossier.profile.name) profileScore += 25;
    if (dossier.profile.targetRole) profileScore += 25;
    if (dossier.profile.skills && dossier.profile.skills.length >= 3) profileScore += 30;
    if (dossier.profile.education) profileScore += 20;
    weightedSum += profileScore * 0.2;
    totalWeight += 0.2;
  }

  // ATS Resume Audit (weight 40%)
  if (dossier.resumeAudit) {
    weightedSum += dossier.resumeAudit.atsScore * 0.4;
    totalWeight += 0.4;
  }

  // Interview Evaluation (weight 40%)
  if (dossier.interviewEvaluation) {
    weightedSum += dossier.interviewEvaluation.overallScore * 0.4;
    totalWeight += 0.4;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

export function exportDossierAsMarkdown(dossier: CitadelDossier): string {
  const readiness = calculateReadinessScore(dossier);
  const p = dossier.profile;
  const audit = dossier.resumeAudit;
  const interview = dossier.interviewEvaluation;
  const roast = dossier.latestRoast;
  const sims = dossier.simulations || [];

  return `# THE CAREER CITADEL // EXECUTIVE FORENSIC DOSSIER
Generated: ${new Date().toLocaleDateString()} | Overall Citadel Readiness: ${readiness}%

---

## 1. CANDIDATE PROFILE
- **Name:** ${p.name || 'Anonymous'}
- **Target Role:** ${p.targetRole || 'Not specified'}
- **Experience Tier:** ${p.experience.toUpperCase()}
- **Education:** ${p.education || 'Not specified'}
- **Declared Skill Matrix:** ${p.skills.join(', ') || 'None listed'}

---

## 2. BABU'S FORENSIC ATS AUDIT
${audit ? `
- **ATS Match Score:** ${audit.atsScore}% (${audit.atsVerdict})
- **Forensic Summary:** ${audit.atsSummary}

### Discovered vs Missing Skills
- **Detected Skills:** ${audit.extractedSkills.join(', ')}
- **Flagged Missing Skills:** ${audit.missingSkills.join(', ')}

### Keyword Insertion Strategy
- **Keywords to Add:** ${audit.keywordsToAdd.join(', ')}
- **Placement Directive:** ${audit.keywordsTip}

### Actionable Resume Improvements
${audit.improvements.map((imp, i) => `${i + 1}. **[${imp.priority.toUpperCase()}] ${imp.title}:** ${imp.description}`).join('\n')}
` : '_No resume audit conducted yet in Vault 02._'}

---

## 3. RAVI & RADHA'S MOCK INTERVIEW EVALUATION
${interview ? `
- **Panel Score:** ${interview.overallScore}% (${interview.grade})
- **Executive Summary:** ${interview.summary}

### Key Strengths
${interview.strengths.map(s => `- ${s}`).join('\n')}

### Core Vulnerabilities
${interview.weaknesses.map(w => `- ${w}`).join('\n')}

### Per-Question Forensic Breakdown
${interview.questionFeedback.map((qf, i) => `
#### Question ${i + 1} (Score: ${qf.score}%)
- **Critique:** ${qf.feedback}
- **Optimal Approach:** ${qf.betterApproach}
`).join('\n')}
` : '_No panel interview conducted yet in Chamber 03._'}

---

## 4. HARSHA'S EXECUTIVE REALITY CHECK (PENTHOUSE)
${roast ? `
> ${roast.split('\n\n').join('\n>\n> ')}
` : '_Harsha has not reviewed this candidate yet in the Corner Office._'}

---

## 5. RADHA'S QUANTUM CAREER SIMULATIONS
${sims.length > 0 ? sims.map(s => `
- **Skill Shift:** \`${s.skill}\` -> Projected Score: **${s.newScore}%** (${s.scoreDelta >= 0 ? '+' : ''}${s.scoreDelta}%)
  - **Market Impact:** ${s.impact}
  - **Unlocked Positions:** ${s.newOpportunities.join(', ')}
`).join('\n') : '_No timeline simulations recorded yet._'}

---
*The Career Citadel // Autonomous Engineering Career Advisory Engine*
`;
}

export function downloadDossierMarkdown(dossier: CitadelDossier): void {
  const content = exportDossierAsMarkdown(dossier);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Citadel-Dossier-${dossier.profile.name || 'Candidate'}-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function printDossierExecutiveReport(dossier: CitadelDossier): void {
  const readiness = calculateReadinessScore(dossier);
  const p = dossier.profile;
  const audit = dossier.resumeAudit;
  const interview = dossier.interviewEvaluation;
  const roast = dossier.latestRoast;
  const sims = dossier.simulations || [];

  const safeName = escapeHtml(p.name || 'Candidate');
  const safeRole = escapeHtml(p.targetRole || 'Not set');
  const safeEducation = escapeHtml(p.education || 'N/A');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Citadel Dossier - ${p.name || 'Candidate'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px auto;
      max-width: 800px;
      line-height: 1.6;
      color: #1e293b;
      background: #fff;
    }
    .header {
      border-bottom: 3px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 { margin: 0; font-size: 26px; letter-spacing: -0.5px; text-transform: uppercase; }
    .badge {
      background: #0f172a;
      color: #fff;
      font-family: monospace;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    h2 {
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 13px; }
    .score-banner {
      background: #f1f5f9;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .roast-quote {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 14px 18px;
      font-style: italic;
      color: #991b1b;
      white-space: pre-line;
    }
    .tag { display: inline-block; background: #e2e8f0; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin: 2px; }
    @media print {
      body { margin: 20px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size: 11px; font-family: monospace; color: #64748b; letter-spacing: 2px;">THE CAREER CITADEL // FORENSIC REPORT</div>
      <h1>${safeName} Dossier</h1>
      <div style="color: #64748b; font-size: 13px;">Targeting: <strong>${safeRole}</strong> (${escapeHtml(p.experience.toUpperCase())})</div>
    </div>
    <div class="badge">Citadel Readiness: ${readiness}%</div>
  </div>

  <div class="section">
    <h2>1. Verified Profile</h2>
    <div class="card">
      <div><strong>Education:</strong> ${safeEducation}</div>
      <div style="margin-top: 6px;"><strong>Skill Stack:</strong> ${p.skills.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join(' ')}</div>
    </div>
  </div>

  <div class="section">
    <h2>2. Babu's ATS Resume Audit</h2>
    ${audit ? `
      <div class="score-banner">
        <strong>ATS Score: ${audit.atsScore}%</strong> — ${escapeHtml(audit.atsVerdict)}
        <div style="margin-top: 4px; font-size: 12px; color: #475569;">${escapeHtml(audit.atsSummary)}</div>
      </div>
      <div class="grid">
        <div class="card">
          <strong>Flagged Missing Competencies:</strong>
          <div style="margin-top: 6px;">${audit.missingSkills.map(s => `<span class="tag" style="background:#fee2e2;color:#991b1b;">${escapeHtml(s)}</span>`).join(' ')}</div>
        </div>
        <div class="card">
          <strong>Recommended Keywords:</strong>
          <div style="margin-top: 6px;">${audit.keywordsToAdd.map(k => `<span class="tag" style="background:#ecfdf5;color:#065f46;">${escapeHtml(k)}</span>`).join(' ')}</div>
        </div>
      </div>
    ` : '<p style="font-size: 12px; color: #94a3b8;">No ATS audit conducted.</p>'}
  </div>

  <div class="section">
    <h2>3. Ravi & Radha Mock Interview</h2>
    ${interview ? `
      <div class="score-banner" style="border-left-color: #9333ea;">
        <strong>Panel Rating: ${escapeHtml(interview.grade)} (${interview.overallScore}%)</strong>
        <div style="margin-top: 4px; font-size: 12px; color: #475569;">${escapeHtml(interview.summary)}</div>
      </div>
      <div class="grid">
        <div class="card">
          <strong>Strengths:</strong>
          <ul style="margin: 6px 0 0 16px; padding: 0;">${interview.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>
        <div class="card">
          <strong>Areas for Growth:</strong>
          <ul style="margin: 6px 0 0 16px; padding: 0;">${interview.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>
        </div>
      </div>
    ` : '<p style="font-size: 12px; color: #94a3b8;">No mock interview conducted.</p>'}
  </div>

  <div class="section">
    <h2>4. Harsha's Executive Roast (The Corner Office)</h2>
    ${roast ? `
      <div class="roast-quote">${escapeHtml(roast)}</div>
    ` : '<p style="font-size: 12px; color: #94a3b8;">No executive roast recorded.</p>'}
  </div>

  <div style="text-align: center; margin-top: 40px; font-size: 11px; font-family: monospace; color: #94a3b8;">
    CONFIDENTIAL CITADEL REPORT // AUTONOMOUS CAREER COMPASS
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); }, 500);
    };
  </script>
</body>
</html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
