import { 
  AgentId, 
  InterviewAnswer, 
  InterviewEvaluation, 
  InterviewQuestion, 
  ResumeAnalysisResult, 
  UserProfile,
  CareerSimulation 
} from '../types';

// API Key Management & Configuration
const DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
const DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

export type AiProvider = 'auto' | 'gemini' | 'groq';

export function getActiveProvider(): AiProvider {
  return (localStorage.getItem('citadel_ai_provider') as AiProvider) || 'auto';
}

export function setActiveProvider(provider: AiProvider): void {
  localStorage.setItem('citadel_ai_provider', provider);
}

export function getGeminiApiKey(): string {
  return localStorage.getItem('citadel_gemini_key') || DEFAULT_GEMINI_KEY;
}

export function setGeminiApiKey(key: string): void {
  localStorage.setItem('citadel_gemini_key', key.trim());
}

export function getGroqApiKey(): string {
  return localStorage.getItem('citadel_groq_key') || DEFAULT_GROQ_KEY;
}

export function setGroqApiKey(key: string): void {
  localStorage.setItem('citadel_groq_key', key.trim());
}

// Backward compatibility alias
export function getApiKey(): string {
  return getGroqApiKey();
}

export function setApiKey(key: string): void {
  setGroqApiKey(key);
}

// Model Fallback Lists (Gemini 3.8 Flash is active)
const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
  'gemini-pro-latest',
];

const GROQ_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

/**
 * Direct call to Google Gemini REST API (v1beta)
 */
async function callGeminiChat(
  messages: { role: string; content: string }[],
  jsonMode: boolean = false
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  // Extract system instructions and convert messages to Gemini's format
  let systemInstruction = '';
  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction = systemInstruction ? `${systemInstruction}\n\n${msg.content}` : msg.content;
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }

  // If no user messages were passed, convert systemInstruction into the first user message
  if (contents.length === 0 && systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: systemInstruction }]
    });
    systemInstruction = '';
  }

  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents,
        generationConfig: {
          temperature: jsonMode ? 0.2 : 0.7,
          maxOutputTokens: 4096,
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      if (jsonMode) {
        payload.generationConfig.responseMimeType = 'application/json';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Google Gemini Error (${response.status})`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Gemini model ${model} failed, trying fallback:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Google Gemini models failed.');
}

/**
 * Direct call to Groq LPU Chat Completions API
 */
async function callGroqChat(
  messages: { role: string; content: string }[],
  jsonMode: boolean = false
): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq API Key is not configured.');
  }

  let lastError: Error | null = null;

  for (const model of GROQ_MODELS) {
    try {
      const payload: any = {
        model,
        messages,
        temperature: jsonMode ? 0.15 : 0.7,
        max_tokens: 3800,
      };

      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Groq API Error (${response.status})`);
      }

      const data = await response.json();
      const msg = data.choices?.[0]?.message;
      let text = msg?.content;
      if ((!text || text.trim() === '') && msg?.reasoning) {
        text = msg.reasoning;
      }
      if (text !== undefined && text !== null && text.trim() !== '') {
        return text;
      }
    } catch (err: any) {
      console.warn(`Groq model ${model} failed, trying fallback:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq AI models failed to respond.');
}

/**
 * Smart Dual-Engine Orchestrator:
 * Automatically uses Google Gemini if available, or seamlessly falls back to Groq.
 */
async function callAiChat(
  messages: { role: string; content: string }[],
  jsonMode: boolean = false
): Promise<string> {
  const provider = getActiveProvider();
  const geminiKey = getGeminiApiKey();

  if (provider === 'gemini') {
    return await callGeminiChat(messages, jsonMode);
  }

  if (provider === 'groq') {
    return await callGroqChat(messages, jsonMode);
  }

  // 'auto' mode: Prefer Gemini if key exists, otherwise fall back to Groq
  if (geminiKey) {
    try {
      return await callGeminiChat(messages, jsonMode);
    } catch (geminiErr: any) {
      console.warn('Gemini chat failed, falling back to Groq:', geminiErr.message);
    }
  }

  return await callGroqChat(messages, jsonMode);
}

/**
 * Robust JSON Parser that safely handles LLM markdown code blocks, prefixes, or trailing tokens
 */
function cleanAndParseJson<T>(raw: string): T {
  let clean = raw.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(clean);
  } catch (initialErr) {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
      } catch (e) {}
    }
    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(clean.slice(firstBracket, lastBracket + 1));
      } catch (e) {}
    }
    throw initialErr;
  }
}

/**
 * BABU: Forensic ATS Resume Auditor
 * Deep intelligence, but crystal-clear human explanations for the player.
 */
export async function auditResumeWithBabu(
  resumeText: string,
  targetRole: string,
  jobDesc?: string
): Promise<ResumeAnalysisResult> {
  const prompt = `You are Babu, an elite FAANG-tier ATS forensic auditor and hiring committee member.
Conduct an exhaustive forensic audit on this candidate's resume for the target role: "${targetRole}".
${jobDesc ? `Target Job Description & Requirements:\n${jobDesc}\n` : ''}

CANDIDATE RESUME TEXT:
${resumeText.slice(0, 10000)}

AUDIT PRINCIPLES:
1. DEEP INTELLIGENCE, SIMPLE EXPLANATIONS:
   - Use all your technical acumen to analyze keyword frequency, system scale, and passive phrases.
   - Deliver findings in simple, punchy, conversational language so the player instantly understands what to fix without wading through corporate jargon.
2. ATS SCORE & VERDICT:
   - 85+ is reserved for resumes with quantified metrics on every bullet and high keyword alignment.
   - 70-84 means good foundation with missing metrics or cloud tooling.
   - Below 70 means passive duty-listing or missing core technical competencies.
3. EXECUTIVE SUMMARY (atsSummary):
   - Exactly 2-3 short, clear sentences:
     1) What the candidate does well (e.g. "Your React and TypeScript foundations are strong.").
     2) The exact reason recruiters or bots will reject it (e.g. "However, 80% of your bullets list daily tasks instead of business results, and you're missing Docker and CI/CD.").
     3) A clear, encouraging action step (e.g. "Fix the 4 bullet points below to easily pass senior ATS filters.").
4. 4 HIGH-IMPACT REWRITES (improvements):
   - Provide 4 concrete bullet point rewrites using Google's X-Y-Z formula: "Accomplished [X] as measured by [Y] by doing [Z]".
   - Format each description strictly and clearly as:
BEFORE: "<weak or passive bullet from resume>"
AFTER: "<quantified, active, high-impact rewrite with metrics and tools>"
WHY: "<plain-English 1-sentence reason why recruiters love this>"
5. MISSING SKILLS & KEYWORD TIP:
   - Identify the top 4-5 hard skills missing for this role.
   - keywordsTip: Give 1-2 simple sentences explaining how to weave these skills into real project achievements rather than just dumping them into a list.

Return ONLY valid JSON matching this exact structure:
{
  "atsScore": <number 0-100>,
  "atsVerdict": "<3-4 words verdict like 'High Impact Match' or 'Needs Metric Polish'>",
  "atsSummary": "<2-3 clear, simple sentences evaluating keyword match and bullet impact>",
  "extractedSkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>", "<skill6>"],
  "missingSkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>"],
  "roleMatch": [
    {"category": "Core Technical Architecture", "score": <0-100>, "note": "<1 simple line explanation>"},
    {"category": "Metrics & Business Impact", "score": <0-100>, "note": "<1 simple line explanation>"},
    {"category": "Keyword Density & Nomenclature", "score": <0-100>, "note": "<1 simple line explanation>"},
    {"category": "Layout & Parseability", "score": <0-100>, "note": "<1 simple line explanation>"}
  ],
  "improvements": [
    {"title": "<Action-oriented title>", "description": "BEFORE: '<weak bullet>'\nAFTER: '<quantified senior rewrite>'\nWHY: '<simple strategic reason>'", "priority": "high"},
    {"title": "<Action-oriented title>", "description": "BEFORE: '<weak bullet>'\nAFTER: '<quantified senior rewrite>'\nWHY: '<simple strategic reason>'", "priority": "high"},
    {"title": "<Action-oriented title>", "description": "BEFORE: '<weak bullet>'\nAFTER: '<quantified senior rewrite>'\nWHY: '<simple strategic reason>'", "priority": "medium"},
    {"title": "<Action-oriented title>", "description": "BEFORE: '<weak bullet>'\nAFTER: '<quantified senior rewrite>'\nWHY: '<simple strategic reason>'", "priority": "low"}
  ],
  "keywordsToAdd": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>", "<kw6>"],
  "keywordsTip": "<1-2 simple sentences on contextual placement in project bullets>"
}`;

  const raw = await callAiChat([{ role: 'user', content: prompt }], true);
  return cleanAndParseJson<ResumeAnalysisResult>(raw);
}

/**
 * RAVI & RADHA: Mock Interview Panel Question Generation
 * Deep scenarios, but relatable and clear to understand.
 */
export async function generateInterviewQuestions(
  role: string,
  experience: string,
  skills: string[],
  count: number = 4,
  missingSkills?: string[],
  jobDesc?: string
): Promise<InterviewQuestion[]> {
  const gapInstructions = missingSkills && missingSkills.length > 0 
    ? `\nCRITICAL CONTEXT FROM BABU'S ATS AUDIT:\nCandidate was flagged for missing key competencies: [${missingSkills.join(', ')}].\nRavi (Technical Lead) MUST directly question the candidate on at least one or two of these exact missing skills to test real-world depth.\n` 
    : '';

  const jobDescContext = jobDesc ? `\nTarget Job Description:\n${jobDesc}\n` : '';

  const prompt = `You are orchestrating an elite engineering interview panel consisting of two interviewers:
1. "ravi" - Principal Systems Architect: Probes real-world systems design, latency bottlenecks, caching strategies, state management, and production failure modes.
2. "radha" - Engineering Director & Behavioral Lead: Tests behavioral competence using the STAR methodology (handling cross-functional conflicts, pushing back on scope creep, incident response, mentorship).

Generate exactly ${count} alternating questions tailored to a ${experience}-level candidate targeting "${role}".
Candidate declared stack: ${skills.join(', ')}.
${gapInstructions}${jobDescContext}

STANDARDS:
- High Depth, Relatable Scenarios: Frame questions as realistic engineering dilemmas or production incidents (e.g. "It's 2 PM on Cyber Monday and checkout latency spikes from 50ms to 2.5s because Redis memory is exhausted. Walk me step-by-step through how you isolate and fix this.").
- Simple Cheat-Sheet Hint: Provide candidate with a practical 1-2 sentence clue on how to structure their answer (e.g. "💡 Tip: Structure your response in 3 steps: triage/metrics first, quick mitigation, then permanent architectural fix.").

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "<engaging, realistic scenario-based technical question>",
      "type": "technical",
      "hint": "<simple, actionable 1-2 sentence clue>",
      "interviewer": "ravi"
    },
    {
      "id": "q2",
      "question": "<realistic STAR-format behavioral workplace question>",
      "type": "situational",
      "hint": "<simple, actionable 1-2 sentence clue>",
      "interviewer": "radha"
    }
  ]
}`;

  const raw = await callAiChat([{ role: 'user', content: prompt }], true);
  const parsed = cleanAndParseJson<{ questions: InterviewQuestion[] }>(raw);
  return parsed.questions;
}

/**
 * RAVI & RADHA: Interview Transcript Evaluation
 * Deep evaluation, structured into clean takeaways and a 3-step model answer.
 */
export async function evaluateInterview(
  role: string,
  experience: string,
  answers: InterviewAnswer[]
): Promise<InterviewEvaluation> {
  const transcript = answers.map((a, i) => 
    `Q${i+1} (${a.interviewer === 'ravi' ? 'Ravi - Tech Architect' : 'Radha - Behavioral Director'}): ${a.question}\nCandidate Answer: ${a.answer}\nResponse Duration: ${a.timeSeconds}s`
  ).join('\n\n');

  const prompt = `You are evaluating a candidate interview transcript on behalf of Ravi (Tech Lead) and Radha (Engineering Director).
Target Role: ${role} | Seniority Tier: ${experience}

INTERVIEW TRANSCRIPT:
${transcript}

EVALUATION RUBRIC:
1. Clarity & Depth: Grade technical accuracy, trade-off awareness, and STAR structure.
2. Simple Executive Summary: 2-3 clear sentences summarizing their communication poise and technical depth in plain English.
3. Strengths & Weaknesses: Exactly 2-3 bullet points each, citing specific evidence from what they said.
4. Model Answer (betterApproach): Provide a crisp, 3-step cheat-sheet outline ("1. First... 2. Next... 3. Finally...") that the candidate can easily memorize for their real interviews.

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "grade": "<Strong Hire / Hire / Mixed / Needs Work>",
  "summary": "<2-3 clear, jargon-free sentences summarizing overall interview performance>",
  "strengths": ["<strength 1 with specific evidence>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<vulnerability 1 with specific evidence>", "<vulnerability 2>", "<vulnerability 3>"],
  "questionFeedback": [
    {
      "score": <0-100>,
      "feedback": "<1-2 simple sentences explaining what was good and what was missing>",
      "betterApproach": "1. [Step 1 action]\n2. [Step 2 action]\n3. [Step 3 action & business result]"
    }
  ]
}`;

  const raw = await callAiChat([{ role: 'user', content: prompt }], true);
  return cleanAndParseJson<InterviewEvaluation>(raw);
}

/**
 * HARSHA: Brutal Executive Mentor Reality Check
 * Uses all the Citadel Brain memory, but organized into 4 punchy, scannable cards.
 */
export async function getBrutalRoastWithHarsha(
  profile: UserProfile,
  dossierStats?: {
    resumeScore?: number;
    resumeVerdict?: string;
    interviewScore?: number;
    interviewGrade?: string;
    missingSkills?: string[];
    weaknesses?: string[];
  }
): Promise<string> {
  let contextDossier = '';
  if (dossierStats) {
    if (dossierStats.resumeScore !== undefined) {
      contextDossier += `\n- Babu's ATS Audit: Score ${dossierStats.resumeScore}%, Verdict: "${dossierStats.resumeVerdict || 'Audited'}"`;
    }
    if (dossierStats.missingSkills && dossierStats.missingSkills.length > 0) {
      contextDossier += `\n- Flagged Missing Core Skills: ${dossierStats.missingSkills.join(', ')}`;
    }
    if (dossierStats.interviewScore !== undefined) {
      contextDossier += `\n- Ravi & Radha Mock Interview: Score ${dossierStats.interviewScore}%, Rating: "${dossierStats.interviewGrade || 'Evaluated'}"`;
    }
    if (dossierStats.weaknesses && dossierStats.weaknesses.length > 0) {
      contextDossier += `\n- Flagged Interview Vulnerabilities: ${dossierStats.weaknesses.join('; ')}`;
    }
  }

  const prompt = `You are Harsha, an elite, demanding Executive Partner at a Tier-1 tech firm.
The candidate claims they are ready for "${profile.targetRole}".
Experience Tier: ${profile.experience}
Declared Skills: ${profile.skills.join(', ')}
${contextDossier ? `\nCITADEL AGENT FORENSIC DOSSIER ON CANDIDATE:${contextDossier}\n` : ''}

Deliver an unforgettable, brutally honest executive reality check. Use all your brain and cross-agent memory, but make the delivery razor-sharp, scannable, and simple to understand. Zero corporate buzzword salad.

Structure your response into EXACTLY these 4 clear sections:

### 🚨 1. THE RAW TRUTH
Call out their exact gaps, weak resume habits, or interview flaws by name. Explain in 2 punchy paragraphs why hiring committees reject profiles like this in under 10 seconds.

### 🎯 2. THE TIER-1 BAR
Give a direct, simple contrast:
- What average applicants do: (e.g. build tutorial clones, list daily duties).
- What gets you hired at $180k+: (e.g. owns system reliability, articulates latency trade-offs, deploys production metrics).

### ⚠️ 3. YOUR 2 BIGGEST BLINDSPOTS
Point out the 2 specific technical or career traps holding them back right now.

### 🗺️ 4. THE 90-DAY ACTION PLAN
A clear, step-by-step gameplan they can actually execute:
- **Month 1 (Eliminate Gaps)**: The exact skills to learn and weak bullets to cut.
- **Month 2 (Build Proof-of-Work)**: One non-trivial, production-grade system to build and deploy.
- **Month 3 (Interview Mastery)**: How to speak with authority about trade-offs and metrics.

Make it sting with truth, but make it the single most empowering wake-up call of their career.`;

  return await callAiChat([{ role: 'user', content: prompt }], false);
}

/**
 * RADHA: What-If Quantum Career Simulator
 * Deep calculation, simple ROI and salary impact.
 */
export async function simulateSkillWithRadha(
  targetRole: string,
  currentSkills: string[],
  currentScore: number,
  newSkill: string
): Promise<CareerSimulation> {
  const prompt = `You are Radha, Director of Engineering and Quantum Career Strategist.
Candidate targeting "${targetRole}" has skills: [${currentSkills.join(', ')}] with current match score ${currentScore}%.
Simulate the precise career trajectory and compensation impact if they achieve production mastery of "${newSkill}".

GUIDELINES:
- impact: Exactly 2 simple sentences explaining why companies pay for this skill and the estimated base salary boost (e.g. +$20k-$35k base).
- verdict: Exactly 1 punchy line explaining why this skill is (or isn't) a high-ROI pivot.

Return ONLY valid JSON:
{
  "skill": "${newSkill}",
  "newScore": <number 0-100 reflecting realistic role match post-mastery>,
  "scoreDelta": <positive or negative number>,
  "impact": "<2 simple, clear sentences on market demand and compensation shift>",
  "newOpportunities": ["<specific unlocked title 1>", "<specific unlocked title 2>", "<specific unlocked title 3>"],
  "verdict": "<1 punchy executive verdict e.g. '🟢 High-ROI Upgrade: Moves you into senior candidate bracket'>"
}`;

  const raw = await callAiChat([{ role: 'user', content: prompt }], true);
  return cleanAndParseJson<CareerSimulation>(raw);
}

/**
 * VEENA: Concierge Dialogue & Routing
 * Friendly, executive, and gives clear next steps.
 */
export async function chatWithVeena(
  userMessage: string,
  profile: UserProfile,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  dossierSummary?: string
): Promise<string> {
  const systemPrompt = `You are Veena, the brilliant and articulate Concierge of the Career Citadel.
You don't just exchange pleasantries; you actively assess candidate readiness and prescribe the fastest route to career advancement through the 4 Citadel Chambers:
1. Vault 02 // Babu (ATS Diagnostic Scanner): Audit resume keyword density and bullet point impact.
2. Chamber 03 // Ravi & Radha (The War Room): Rigorous technical systems design & behavioral mock interview.
3. Deck 04 // Radha (Quantum HoloDeck): Career pivot simulation and trajectory forecasting.
4. Penthouse // Harsha (The Corner Office): Brutal executive reality check and 90-day turnaround plan.

Candidate Profile:
Name: ${profile.name || 'Candidate'}
Target Role: ${profile.targetRole || 'Not set'}
Skills: ${profile.skills.join(', ') || 'None listed'}
Experience: ${profile.experience || 'Junior'}
${dossierSummary ? `Candidate Progress Dossier:\n${dossierSummary}` : ''}

Guidelines:
- Keep responses concise (2-3 sentences), warm, and crystal clear.
- Always guide them to the single most impactful room to visit next based on their dossier score.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6),
    { role: 'user', content: userMessage }
  ];

  return await callAiChat(messages, false);
}
