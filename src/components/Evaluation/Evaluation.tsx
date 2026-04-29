import { useEffect, useRef, useState } from 'react';
import { Evaluation as EvaluationType } from '../../types';

interface Props {
  evaluation: EvaluationType;
  questionTitle: string;
  durationSeconds: number;
  onRetry: () => void;
  onHome: () => void;
}

const scoreCategories = [
  { key: 'requirementsGathering' as const, label: 'Requirements Gathering', icon: '📋' },
  { key: 'highLevelComponents' as const, label: 'High-Level Components', icon: '🏗️' },
  { key: 'apisAndDataModel' as const, label: 'APIs & Data Model', icon: '🗄️' },
  { key: 'scalabilityAndReliability' as const, label: 'Scalability & Reliability', icon: '📈' },
  { key: 'tradeoffsAndDepth' as const, label: 'Trade-offs & Depth', icon: '⚖️' },
  { key: 'communicationClarity' as const, label: 'Communication Clarity', icon: '🗣️' },
];

function ScoreBar({ score, label, icon }: { score: number; label: string; icon: string }) {
  const color =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="text-sm text-gray-300">{label}</span>
        </div>
        <span className={`text-sm font-bold font-mono ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {score}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ConfidenceGauge({ percent, label }: { percent: number; label: string }) {
  const [animated, setAnimated] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1400;
    const start = performance.now();

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setAnimated(Math.round(easeOutCubic(t) * percent));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [percent]);

  const angle = (animated / 100) * 180 - 90;
  const color = animated >= 80 ? '#22c55e' : animated >= 60 ? '#eab308' : '#ef4444';
  const bgColor = animated >= 80 ? 'text-green-400 bg-green-500/10 border-green-500/30' : animated >= 60 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg width="192" height="96" viewBox="0 0 192 96">
          <path d="M 16 96 A 80 80 0 0 1 176 96" fill="none" stroke="#1e2640" strokeWidth="16" strokeLinecap="round" />
          <path
            d="M 16 96 A 80 80 0 0 1 176 96"
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(animated / 100) * 251.2} 251.2`}
          />
          <line
            x1="96"
            y1="96"
            x2={96 + 65 * Math.cos(((angle - 90) * Math.PI) / 180)}
            y2={96 + 65 * Math.sin(((angle - 90) * Math.PI) / 180)}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="96" cy="96" r="5" fill="white" />
        </svg>
      </div>
      <div className={`px-4 py-2 rounded-xl border font-bold text-lg ${bgColor}`}>
        {animated}% — {label}
      </div>
    </div>
  );
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function EvaluationPanel({ evaluation, questionTitle, durationSeconds, onRetry, onHome }: Props) {
  return (
    <div className="min-h-screen bg-surface-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Interview Complete</h1>
          <p className="text-gray-400 text-sm">{questionTitle} · {formatDuration(durationSeconds)}</p>
        </div>

        {/* Final Score Hero */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-8 flex flex-col items-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Final Score</p>
          <div className={`text-7xl font-black font-mono leading-none ${
            evaluation.scores.overall >= 80 ? 'text-green-400' :
            evaluation.scores.overall >= 60 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {evaluation.scores.overall}
          </div>
          <p className="text-sm text-gray-500 mt-2">out of 100</p>
          <div className={`mt-3 px-4 py-1.5 rounded-full text-xs font-semibold border ${
            evaluation.scores.overall >= 80
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : evaluation.scores.overall >= 60
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {evaluation.scores.overall >= 80 ? 'Strong Hire' : evaluation.scores.overall >= 60 ? 'Lean Hire' : 'No Hire'}
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-6 flex flex-col items-center">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Hiring Confidence</h2>
          <ConfidenceGauge percent={evaluation.confidencePercent} label={evaluation.confidenceLabel} />
        </div>

        {/* Score breakdown */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Score Breakdown</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Overall:</span>
              <span className={`text-xl font-bold font-mono ${evaluation.scores.overall >= 80 ? 'text-green-400' : evaluation.scores.overall >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {evaluation.scores.overall}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {scoreCategories.map(({ key, label, icon }) => (
              <ScoreBar key={key} score={evaluation.scores[key]} label={label} icon={icon} />
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-800 rounded-2xl border border-green-500/20 p-5">
            <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              ✅ Strengths
            </h3>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface-800 rounded-2xl border border-orange-500/20 p-5">
            <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
              🔧 Areas to Improve
            </h3>
            <ul className="space-y-2">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed feedback */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Detailed Feedback</h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{evaluation.detailedFeedback}</p>
        </div>

        {/* Diagram feedback */}
        {evaluation.diagramFeedback && (
          <div className="bg-surface-800 rounded-2xl border border-brand-500/20 p-6">
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
              📐 Diagram Feedback
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">{evaluation.diagramFeedback}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center pb-8">
          <button onClick={onHome} className="px-6 py-3 rounded-xl border border-surface-500 text-gray-300 hover:bg-surface-700 transition-colors text-sm font-medium">
            ← Dashboard
          </button>
          <button onClick={onRetry} className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors">
            Try Another Question →
          </button>
        </div>
      </div>
    </div>
  );
}
