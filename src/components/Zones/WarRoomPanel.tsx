import React, { useState, useEffect } from 'react';
import { Play, Volume2, HelpCircle, Check, Clock, Award, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { generateInterviewQuestions, evaluateInterview } from '../../services/ai';
import { speakAsAgent } from '../../services/voice';
import { InterviewAnswer, InterviewEvaluation, InterviewQuestion, UserProfile } from '../../types';

interface WarRoomPanelProps {
  userProfile: UserProfile;
}

export function WarRoomPanel({ userProfile }: WarRoomPanelProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [timer, setTimer] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (questions.length > 0 && !evaluation) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [questions, currentIndex, evaluation]);

  const handleStartInterview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = await generateInterviewQuestions(
        userProfile.targetRole || 'Full Stack Developer',
        userProfile.experience || 'fresher',
        userProfile.skills.length > 0 ? userProfile.skills : ['JavaScript', 'System Architecture']
      );

      setQuestions(qs);
      setCurrentIndex(0);
      setAnswers([]);
      setTimer(0);
      setIsLoading(false);

      if (qs[0]) {
        speakAsAgent(qs[0].interviewer, qs[0].question);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to generate interview questions.');
    }
  };

  const handleNextQuestion = async () => {
    const currentQ = questions[currentIndex];
    const newAnswers = [
      ...answers,
      {
        questionId: currentQ.id,
        question: currentQ.question,
        answer: userAnswer || '(No answer provided)',
        timeSeconds: timer,
        interviewer: currentQ.interviewer
      }
    ];
    setAnswers(newAnswers);
    setUserAnswer('');
    setShowHint(false);
    setTimer(0);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      const nextQ = questions[currentIndex + 1];
      speakAsAgent(nextQ.interviewer, nextQ.question);
    } else {
      // Evaluate interview
      setIsEvaluating(true);
      try {
        const evalResult = await evaluateInterview(
          userProfile.targetRole || 'Software Engineer',
          userProfile.experience || 'fresher',
          newAnswers
        );
        setEvaluation(evalResult);
        setIsEvaluating(false);

        speakAsAgent('radha', `Interview complete! Overall performance score: ${evalResult.overallScore} percent.`);
      } catch (err: any) {
        setIsEvaluating(false);
        setError(err.message || 'Evaluation failed.');
      }
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full text-left max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#7fff6e] uppercase">Chamber 03 // War Room</span>
          <h2 className="font-display italic text-2xl text-[#f0efe8]">Ravi & Radha Mock Panel</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
            💻 Ravi (Tech)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent2/10 text-accent2 border border-accent2/20">
            🧠 Radha (Behavioral)
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-brutal/10 border border-brutal/30 text-brutal text-xs rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Start State */}
      {questions.length === 0 && !evaluation && (
        <div className="text-center py-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 mx-auto flex items-center justify-center text-accent">
            <Play className="w-6 h-6 ml-1" />
          </div>
          <div>
            <h3 className="font-display italic text-xl">Ready to take the seat?</h3>
            <p className="text-xs text-muted max-w-md mx-auto mt-1">
              Ravi will test your technical depth and system architecture. Radha will evaluate conflict resolution, leadership, and STAR behavioral answers.
            </p>
          </div>
          <button
            onClick={handleStartInterview}
            disabled={isLoading}
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-bg font-semibold text-sm rounded-lg flex items-center gap-2 mx-auto transition-all shadow-lg shadow-accent/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Commence Panel Interview</span>
          </button>
        </div>
      )}

      {/* Question Active State */}
      {questions.length > 0 && !evaluation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentQ.interviewer === 'ravi' ? 'bg-accent' : 'bg-accent2'}`} />
              Question {currentIndex + 1} of {questions.length} (Interviewer: <strong className="text-text uppercase">{currentQ.interviewer}</strong>)
            </span>
            <span className="flex items-center gap-1 text-accent">
              <Clock className="w-3.5 h-3.5" /> {timer}s
            </span>
          </div>

          {/* Question Box */}
          <div className="p-4 bg-surface2 rounded-xl border border-white/10 relative">
            <p className="text-base text-text font-medium leading-relaxed mb-2">
              "{currentQ.question}"
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => speakAsAgent(currentQ.interviewer, currentQ.question)}
                className="text-xs font-mono text-muted hover:text-accent flex items-center gap-1 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" /> Replay Voice
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-mono text-muted hover:text-accent2 flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" /> {showHint ? 'Hide Hint' : 'View Hint'}
              </button>
            </div>
            {showHint && (
              <div className="mt-3 p-2.5 bg-white/5 rounded-lg text-xs text-accent2 border border-accent2/20">
                💡 <strong>Hint:</strong> {currentQ.hint}
              </div>
            )}
          </div>

          {/* Answer Input */}
          <div>
            <label className="block text-[11px] font-mono text-muted uppercase tracking-wider mb-1">Your Answer</label>
            <textarea
              rows={4}
              className="w-full bg-surface2 border border-white/10 rounded-lg p-3 text-sm text-text focus:outline-none focus:border-accent resize-none font-body"
              placeholder="Structure your answer clearly. For technical, cover edge cases; for behavioral, use Situation-Task-Action-Result..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
            />
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={isEvaluating}
            className="w-full py-3 bg-accent hover:bg-accent/90 text-bg font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Panel is Grading Your Transcript...</span>
              </>
            ) : (
              <>
                <span>{currentIndex + 1 === questions.length ? 'Submit to Panel for Evaluation' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Evaluation Result View */}
      {evaluation && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between bg-surface2 p-4 rounded-xl border border-white/10">
            <div>
              <div className="text-xs font-mono text-muted uppercase">Overall Performance</div>
              <div className="text-3xl font-mono font-bold text-accent">{evaluation.overallScore}%</div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-md text-xs font-mono font-semibold">
                {evaluation.grade}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted leading-relaxed">{evaluation.summary}</p>

          <div className="space-y-3">
            <h4 className="text-xs font-mono text-muted uppercase tracking-wider">Per-Question Feedback</h4>
            {evaluation.questionFeedback.map((fb, i) => (
              <div key={i} className="p-3 bg-surface2/60 border border-white/5 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold">
                  <span>Question {i + 1}</span>
                  <span className="font-mono text-accent">{fb.score}%</span>
                </div>
                <p className="text-muted">{fb.feedback}</p>
                <div className="text-[11px] text-accent2 pt-1 border-t border-white/5">
                  <strong>Better Approach:</strong> {fb.betterApproach}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setQuestions([]);
              setEvaluation(null);
            }}
            className="w-full py-2.5 bg-surface2 hover:bg-surface border border-white/10 text-xs font-mono text-muted hover:text-text rounded-lg transition-colors"
          >
            ↺ Restart Mock Interview
          </button>
        </div>
      )}
    </div>
  );
}
