import React, { useState, useEffect } from 'react';
import { Play, Volume2, HelpCircle, Clock, ArrowRight, Loader2, X } from 'lucide-react';
import { generateInterviewQuestions, evaluateInterview } from '../../services/ai';
import { speakAsAgent } from '../../services/voice';
import { InterviewAnswer, InterviewEvaluation, InterviewQuestion, UserProfile } from '../../types';

interface WarRoomPanelProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export function WarRoomPanel({ userProfile, onClose }: WarRoomPanelProps) {
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
    <div className="glass-panel p-6 rounded-2xl max-w-xl w-full text-left max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-purple-600 uppercase font-semibold">Chamber 03 // War Room</span>
          <h2 className="font-display italic text-2xl text-slate-900">Ravi & Radha Mock Panel</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
            💻 Ravi (Tech)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            🧠 Radha (HR)
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ml-1"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Start State */}
      {questions.length === 0 && !evaluation && (
        <div className="text-center py-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 mx-auto flex items-center justify-center">
            <Play className="w-6 h-6 ml-1" />
          </div>
          <div>
            <h3 className="font-display italic text-2xl text-slate-900">Take a seat across the table</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Ravi will test your technical depth and system architecture. Radha will evaluate conflict resolution, leadership, and STAR behavioral answers.
            </p>
          </div>
          <button
            onClick={handleStartInterview}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 mx-auto transition-all shadow-lg shadow-purple-500/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Commence Panel Interview</span>
          </button>
        </div>
      )}

      {/* Question Active State */}
      {questions.length > 0 && !evaluation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentQ.interviewer === 'ravi' ? 'bg-purple-500' : 'bg-blue-500'}`} />
              Question {currentIndex + 1} of {questions.length} (Interviewer: <strong className="text-slate-800 uppercase">{currentQ.interviewer}</strong>)
            </span>
            <span className="flex items-center gap-1 text-purple-600 font-bold">
              <Clock className="w-3.5 h-3.5" /> {timer}s
            </span>
          </div>

          {/* Question Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-base text-slate-800 font-medium leading-relaxed mb-2">
              "{currentQ.question}"
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => speakAsAgent(currentQ.interviewer, currentQ.question)}
                className="text-xs font-mono text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors font-semibold"
              >
                <Volume2 className="w-3.5 h-3.5" /> Replay Voice
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors font-semibold"
              >
                <HelpCircle className="w-3.5 h-3.5" /> {showHint ? 'Hide Hint' : 'View Hint'}
              </button>
            </div>
            {showHint && (
              <div className="mt-3 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-800 border border-blue-200">
                💡 <strong>Hint:</strong> {currentQ.hint}
              </div>
            )}
          </div>

          {/* Answer Input */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1">Your Answer</label>
            <textarea
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white resize-none"
              placeholder="Structure your answer clearly. For technical, cover edge cases; for behavioral, use Situation-Task-Action-Result..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
            />
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={isEvaluating}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
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
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase">Overall Performance</div>
              <div className="text-3xl font-mono font-bold text-emerald-600">{evaluation.overallScore}%</div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-mono font-semibold">
                {evaluation.grade}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{evaluation.summary}</p>

          <div className="space-y-3">
            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">Per-Question Feedback</h4>
            {evaluation.questionFeedback.map((fb, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>Question {i + 1}</span>
                  <span className="font-mono text-emerald-600 font-bold">{fb.score}%</span>
                </div>
                <p className="text-slate-600">{fb.feedback}</p>
                <div className="text-[11px] text-blue-700 pt-1 border-t border-slate-200">
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
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono text-slate-700 rounded-lg transition-colors font-semibold"
          >
            ↺ Restart Mock Interview
          </button>
        </div>
      )}
    </div>
  );
}
