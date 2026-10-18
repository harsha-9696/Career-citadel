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
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
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
        temperature: jsonMode ? 0.2 : 0.7,
        max_tokens: 2500,
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
      const content = data.choices?.[0]?.message?.content;
      if (content !== undefined && content !== null) {
        return content;
      }
    } catch (err: any) {
      console.warn(`Groq model ${model} failed, trying fallback:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq AI models failed to respond.');
}

/**
 * BABU: Forensic ATS Resume Auditor
 */
export async function auditResumeWithBabu(
  resumeText: string,
  targetRole: string,
  jobDesc?: string
): Promise<ResumeAnalysisResult> {
  const prompt = `You are Babu, an uncompromising ATS (Applicant Tracking System) forensic auditor.
Analyze this resume for the target role: "${targetRole}".
${jobDesc ? `Target Job Description:\n${jobDesc}\n` : ''}

RESUME TEXT:
${resumeText.slice(0, 8000)}

Return ONLY valid JSON matching this exact structure:
{
  "atsScore": <number 0-100>,
  "atsVerdict": "<3-4 words verdict like 'High Impact Match' or 'Needs Critical Revision'>",
  "atsSummary": "<2 precise sentences on ATS keyword density and formatting fit>",
  "extractedSkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>"],
  "missingSkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>"],
  "roleMatch": [
    {"category": "Core Technical Skills", "score": <0-100>, "note": "<1 line reason>"},
    {"category": "Experience & Quantification", "score": <0-100>, "note": "<1 line reason>"},
    {"category": "Keywords & Terminology", "score": <0-100>, "note": "<1 line reason>"},
    {"category": "Structural Readability", "score": <0-100>, "note": "<1 line reason>"}
  ],
  "improvements": [
    {"title": "<title>", "description": "<actionable bullet rewrite advice>", "priority": "high"},
    {"title": "<title>", "description": "<actionable advice>", "priority": "high"},
    {"title": "<title>", "description": "<actionable advice>", "priority": "medium"},
    {"title": "<title>", "description": "<actionable advice>", "priority": "low"}
  ],
  "keywordsToAdd": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"],
  "keywordsTip": "<1 sentence on where to place these keywords naturally>"
}`;

  const raw = await callGroqChat([{ role: 'user', content: prompt }], true);
  return JSON.parse(raw);
}

/**
 * RAVI & RADHA: Mock Interview Panel Question Generation
 */
export async function generateInterviewQuestions(
  role: string,
  experience: string,
  skills: string[],
  count: number = 4
): Promise<InterviewQuestion[]> {
  const prompt = `You are orchestrating a technical interview panel with two interviewers:
1. "ravi" - Senior Technical Architect (asking technical, architecture, systems questions)
2. "radha" - Behavioral Lead & Director of Engineering (asking situational, STAR, leadership, conflict questions)

Generate exactly ${count} alternating questions for a ${experience} candidate interviewing for "${role}".
Candidate skills: ${skills.join(', ')}.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "<question string>",
      "type": "technical",
      "hint": "<1 sentence hint for candidate>",
      "interviewer": "ravi"
    },
    {
      "id": "q2",
      "question": "<question string>",
      "type": "situational",
      "hint": "<1 sentence hint for candidate>",
      "interviewer": "radha"
    }
  ]
}`;

  const raw = await callGroqChat([{ role: 'user', content: prompt }], true);
  const parsed = JSON.parse(raw);
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
    `Q${i+1} (${a.interviewer === 'ravi' ? 'Ravi - Tech' : 'Radha - Behavioral'}): ${a.question}\nAnswer: ${a.answer}\nTime: ${a.timeSeconds}s`
  ).join('\n\n');

  const prompt = `You are evaluating a candidate interview transcript on behalf of Ravi (Tech Lead) and Radha (HR Director).
Role: ${role} | Experience: ${experience}

TRANSCRIPT:
${transcript}

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "grade": "<Excellent / Strong Hire / Mixed / Needs Work>",
  "summary": "<2-3 sentence balanced executive summary>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "weaknesses": ["<weakness1>", "<weakness2>", "<weakness3>"],
  "questionFeedback": [
    {
      "score": <0-100>,
      "feedback": "<2 sentences of constructive critique>",
      "betterApproach": "<1 sentence on the ideal answer structure>"
    }
  ]
}`;

  const raw = await callGroqChat([{ role: 'user', content: prompt }], true);
  return JSON.parse(raw);
}

/**
 * HARSHA: Brutal Executive Mentor Roast & Reality Check
 */
export async function getBrutalRoastWithHarsha(
  profile: UserProfile,
  latestStats?: { resumeScore?: number; interviewScore?: number; missingSkills?: string[] }
): Promise<string> {
  const prompt = `You are Harsha, an elite, demanding, no-bullshit Executive Engineering Partner.
The candidate claims they are ready for "${profile.targetRole}".
Experience: ${profile.experience}
Current Skills: ${profile.skills.join(', ')}
${latestStats?.resumeScore !== undefined ? `ATS Resume Score: ${latestStats.resumeScore}%` : ''}
${latestStats?.interviewScore !== undefined ? `Mock Interview Score: ${latestStats.interviewScore}%` : ''}
${latestStats?.missingSkills ? `Glaring Gaps: ${latestStats.missingSkills.join(', ')}` : ''}

Deliver an uncompromising, brutally honest reality check (3-4 punchy paragraphs):
1. Cut through their delusions and tell them why they are getting rejected or filtered right now.
2. Call out their shallow learning habits or missing engineering depth directly.
3. Give them a strict, uncompromising 90-day action plan that actually commands respect.
No sugarcoating, no participation trophies. Raw truth.`;

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
  const prompt = `You are Radha, Quantum Career Strategist.
Candidate targeting "${targetRole}" has skills: [${currentSkills.join(', ')}] with current match score ${currentScore}%.
Simulate the precise career trajectory if they master "${newSkill}".

Return ONLY valid JSON:
{
  "skill": "${newSkill}",
  "newScore": <number 0-100>,
  "scoreDelta": <positive or negative number>,
  "impact": "<1 concise sentence on how this shifts their market value>",
  "newOpportunities": ["<role 1>", "<role 2>", "<role 3>"],
  "verdict": "<punchy 1-sentence verdict>"
}`;

  const raw = await callGroqChat([{ role: 'user', content: prompt }], true);
  return JSON.parse(raw);
}

/**
 * VEENA: Concierge Dialogue & Routing
 */
export async function chatWithVeena(
  userMessage: string,
  profile: UserProfile,
  chatHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const systemPrompt = `You are Veena, the warm, articulate, and highly intelligent Concierge of the Career Citadel.
You guide candidates through the 3D office rooms:
- "The Diagnostic Vault" where Babu audits resumes
- "The War Room" where Ravi and Radha conduct mock technical/behavioral interviews
- "The Timeline Deck" where Radha simulates what-if career pivots
- "The Corner Office" where Harsha gives brutal reality checks

Candidate Profile:
Name: ${profile.name || 'Candidate'}
Target Role: ${profile.targetRole || 'Not set'}
Skills: ${profile.skills.join(', ') || 'None listed'}

Be concise, motivating, and steer them toward the right room based on what they need.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6),
    { role: 'user', content: userMessage }
  ];

  return await callGroqChat(messages, false);
}
