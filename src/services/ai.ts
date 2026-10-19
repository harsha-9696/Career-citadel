import { 
  AgentId, 
  InterviewAnswer, 
  InterviewEvaluation, 
  InterviewQuestion, 
  ResumeAnalysisResult, 
  UserProfile,
  CareerSimulation 
} from '../types';

const DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || 'YOUR_GROQ_API_KEY';

export function getApiKey(): string {
  return localStorage.getItem('citadel_groq_key') || DEFAULT_GROQ_KEY;
}

export function setApiKey(key: string): void {
  localStorage.setItem('citadel_groq_key', key.trim());
}

const GROQ_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

async function callGroqChat(messages: { role: string; content: string }[], jsonMode: boolean = false): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Please set your free Groq API Key in settings (top right).');
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
      // Handle reasoning models where output may be provided in reasoning
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
 * Robust JSON Parser that safely handles LLM markdown code blocks, prefixes, or trailing tokens
 */
function cleanAndParseJson<T>(raw: string): T {
  let clean = raw.trim();
  // Strip markdown code fences like ```json ... ``` or ``` ... ```
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(clean);
  } catch (initialErr) {
    // If wrapped in surrounding commentary, extract outermost JSON object or array
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
 */
export async function auditResumeWithBabu(
  resumeText: string,
  targetRole: string,
  jobDesc?: string
): Promise<ResumeAnalysisResult> {
  const prompt = `You are Babu, an elite FAANG-tier ATS (Applicant Tracking System) forensic auditor and hiring committee member.
Conduct an exhaustive forensic audit on this candidate's resume for the target role: "${targetRole}".
${jobDesc ? `Target Job Description & Requirements:\n${jobDesc}\n` : ''}

CANDIDATE RESUME TEXT:
${resumeText.slice(0, 8000)}

AUDIT PRINCIPLES:
1. Scoring: Calibrate strictly. 85+ is only for resumes with quantified metrics on every bullet and high keyword alignment. Below 70 means weak verbs or missing core technologies.
2. Improvements: MUST provide 4 detailed, high-impact fixes. For each improvement, provide a concrete rewrite using Google's X-Y-Z formula: "Accomplished [X] as measured by [Y] by doing [Z]". Format the description explicitly with:
BEFORE: "<weak passive sentence from resume or typical mistake>"
AFTER: "<quantified, active, high-impact senior engineering rewrite>"
WHY: "<exact explanation of why this passes ATS filters and impresses engineering directors>"
3. Keywords: Identify the top 5-6 hard architectural/technical competencies missing for this specific role, and give an actionable tip on how to embed them into project context rather than keyword-stuffing.

Return ONLY valid JSON matching this exact structure:
{
  "atsScore": <number 0-100>,
  "atsVerdict": "<3-4 words verdict like 'High Impact Match' or 'Needs Critical Revision'>",
  "atsSummary": "<2-3 dense sentences evaluating keyword density, metric quantification, and recruiter readability>",
  "extractedSkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>", "<skill6>"],
  "missingSkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>"],
  "roleMatch": [
    {"category": "Core Technical Architecture", "score": <0-100>, "note": "<1 line evaluation>"},
    {"category": "Metrics & Business Quantification", "score": <0-100>, "note": "<1 line evaluation>"},
    {"category": "Keyword Density & Nomenclature", "score": <0-100>, "note": "<1 line evaluation>"},
    {"category": "Structural Layout & Parseability", "score": <0-100>, "note": "<1 line evaluation>"}
  ],
  "improvements": [
    {"title": "<Action-oriented title>", "description": "BEFORE: '<weak bullet>'\nAFTER: '<quantified senior rewrite>'\nWHY: '<strategic reason>'", "priority": "high"},
    {"title": "<Action-oriented title>", "description": "BEFORE: '<weak bullet>'\nAFTER: '<quantified senior rewrite>'\nWHY: '<strategic reason>'", "priority": "high"},
    {"title": "<Action-oriented title>", "description": "BEFORE: '<weak bullet>'\nAFTER: '<quantified senior rewrite>'\nWHY: '<strategic reason>'", "priority": "medium"},
    {"title": "<Action-oriented title>", "description": "BEFORE: '<weak bullet>'\nAFTER: '<quantified senior rewrite>'\nWHY: '<strategic reason>'", "priority": "low"}
  ],
  "keywordsToAdd": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>", "<kw6>"],
  "keywordsTip": "<1-2 sentences on contextual placement in project bullets>"
}`;

  const raw = await callGroqChat([{ role: 'user', content: prompt }], true);
  return cleanAndParseJson<ResumeAnalysisResult>(raw);
}

/**
 * RAVI & RADHA: Mock Interview Panel Question Generation
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
    ? `\nCRITICAL CONTEXT FROM BABU'S ATS AUDIT:\nCandidate was flagged for missing key competencies: [${missingSkills.join(', ')}].\nRavi (Technical Lead) MUST directly drill the candidate on at least one or two of these exact missing skills to test real-world architectural competence.\n` 
    : '';

  const jobDescContext = jobDesc ? `\nTarget Job Description:\n${jobDesc}\n` : '';

  const prompt = `You are orchestrating an elite engineering interview panel consisting of two interviewers:
1. "ravi" - Principal Systems Architect: Probes deep system design, state management, concurrency, database indexing, caching strategies, and production failure modes.
2. "radha" - Engineering Director & Behavioral Lead: Tests behavioral competence using the STAR methodology (cross-functional conflicts, pushing back on scope creep, incident response, mentorship).

Generate exactly ${count} alternating questions tailored to a ${experience}-level candidate targeting "${role}".
Candidate declared stack: ${skills.join(', ')}.
${gapInstructions}${jobDescContext}

STANDARDS:
- Seniority Calibration: Questions for a ${experience} must not be textbook definitions ("What is React?"). They must be real production scenarios with trade-offs.
- Clear Hints: Provide candidate with a structural clue (e.g. "Consider cache invalidation strategies like write-through vs write-back" or "Use the STAR method: emphasize your personal decision and quantifiable outcome").

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "<scenario-based technical question>",
      "type": "technical",
      "hint": "<1-2 sentence architectural hint>",
      "interviewer": "ravi"
    },
    {
      "id": "q2",
      "question": "<STAR-format behavioral question>",
      "type": "situational",
      "hint": "<1-2 sentence behavioral framework hint>",
      "interviewer": "radha"
    }
  ]
}`;

  const raw = await callGroqChat([{ role: 'user', content: prompt }], true);
  const parsed = cleanAndParseJson<{ questions: InterviewQuestion[] }>(raw);
  return parsed.questions;
}

/**
 * RAVI & RADHA: Interview Transcript Evaluation
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
1. Technical Answers: Grade technical accuracy, recognition of trade-offs, scalability/edge-case awareness, and clarity.
2. Behavioral Answers: Grade STAR completeness (Situation, Task, Action, Result) and degree of personal ownership vs vague "we did" teamwork claims.
3. Constructive Feedback: Each question must have actionable, high-signal critique and an explicit Staff-level optimal response model ("betterApproach").

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "grade": "<Strong Hire / Hire / Mixed / Needs Work>",
  "summary": "<2-3 sentence executive summary balancing technical mastery and executive presence>",
  "strengths": ["<strength 1 with specific evidence>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<vulnerability 1 with specific evidence>", "<vulnerability 2>", "<vulnerability 3>"],
  "questionFeedback": [
    {
      "score": <0-100>,
      "feedback": "<2 sentences of constructive critique identifying what was missing>",
      "betterApproach": "<Concrete outline of the ideal Staff-level answer with specific architecture or STAR resolution>"
    }
  ]
}`;

  const raw = await callGroqChat([{ role: 'user', content: prompt }], true);
  return cleanAndParseJson<InterviewEvaluation>(raw);
}

/**
 * HARSHA: Brutal Executive Mentor Roast & Reality Check
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

  const prompt = `You are Harsha, an elite, demanding Executive Engineering Partner at a Tier-1 tech firm.
The candidate claims they are ready for "${profile.targetRole}".
Experience Tier: ${profile.experience}
Declared Skills: ${profile.skills.join(', ')}
${contextDossier ? `\nCITADEL AGENT FORENSIC DOSSIER ON CANDIDATE:${contextDossier}\n` : ''}

Deliver a legendary, brutally honest executive reality check (4 structured sections, raw truth, zero sugarcoating):

1. THE UNFILTERED REALITY: Call out their specific gaps, interview flaws, or shallow resume phrasing BY NAME. Expose why hiring committees reject resumes like this in 6 seconds.
2. THE TIER-1 BAR: Explain exactly what an exceptional ${profile.experience}-level ${profile.targetRole} actually delivers compared to where they are today.
3. THE BLINDSPOTS: Identify the exact technical or behavioral traps (tutorial-hell projects, buzzword fluff without distributed systems or testing knowledge) holding them back.
4. THE 90-DAY TACTICAL TURNAROUND: Provide an uncompromising, actionable 3-part blueprint:
   - Days 1-30: Fundamentals, testing, and eliminating the flagged gaps.
   - Days 31-60: Architectural depth (concrete production-grade system to build and deploy).
   - Days 61-90: Interview presence, portfolio articulation, and metric-driven storytelling.

Make it sting with truth, but make it the single most valuable wake-up call of their career.`;

  return await callGroqChat([{ role: 'user', content: prompt }], false);
}

/**
 * RADHA: What-If Quantum Career Simulator
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

Return ONLY valid JSON:
{
  "skill": "${newSkill}",
  "newScore": <number 0-100 reflecting realistic role match post-mastery>,
  "scoreDelta": <positive or negative number>,
  "impact": "<2 concise sentences explaining market demand, compensation shift e.g. +$20k-$35k base, and architectural leverage>",
  "newOpportunities": ["<specific unlocked title 1>", "<specific unlocked title 2>", "<specific unlocked title 3>"],
  "verdict": "<1 punchy executive verdict on whether this skill is a high-ROI career pivot>"
}`;

  const raw = await callGroqChat([{ role: 'user', content: prompt }], true);
  return cleanAndParseJson<CareerSimulation>(raw);
}

/**
 * VEENA: Concierge Dialogue & Routing
 */
export async function chatWithVeena(
  userMessage: string,
  profile: UserProfile,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  dossierSummary?: string
): Promise<string> {
  const systemPrompt = `You are Veena, the brilliant, articulate, and strategic Concierge of the Career Citadel.
You don't just give pleasantries; you actively assess candidate readiness and prescribe the fastest route to career advancement through the 4 Citadel Chambers:
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
- Keep responses concise (2-3 sentences), highly actionable, and motivating.
- Proactively guide them to the specific room they need next based on their dossier progress.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6),
    { role: 'user', content: userMessage }
  ];

  return await callGroqChat(messages, false);
}
