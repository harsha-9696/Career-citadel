export type AgentId = 'veena' | 'babu' | 'harsha' | 'ravi' | 'radha';

export type OfficeZone = 'lobby' | 'scanner' | 'corner' | 'warroom' | 'holodeck';

export interface AgentInfo {
  id: AgentId;
  name: string;
  title: string;
  zone: OfficeZone;
  avatarColor: string;
  voiceName: string;
  description: string;
}

export interface UserProfile {
  name: string;
  targetRole: string;
  skills: string[];
  experience: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  education: string;
}

export interface ResumeAnalysisResult {
  atsScore: number;
  atsVerdict: string;
  atsSummary: string;
  extractedSkills: string[];
  missingSkills: string[];
  roleMatch: {
    category: string;
    score: number;
    note: string;
  }[];
  improvements: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  keywordsToAdd: string[];
  keywordsTip: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'technical' | 'situational';
  hint: string;
  interviewer: 'ravi' | 'radha';
}

export interface InterviewAnswer {
  questionId: string;
  question: string;
  answer: string;
  timeSeconds: number;
  interviewer: 'ravi' | 'radha';
}

export interface InterviewEvaluation {
  overallScore: number;
  grade: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  questionFeedback: {
    score: number;
    feedback: string;
    betterApproach: string;
  }[];
}

export interface CareerSimulation {
  skill: string;
  newScore: number;
  scoreDelta: number;
  impact: string;
  newOpportunities: string[];
  verdict: string;
}
