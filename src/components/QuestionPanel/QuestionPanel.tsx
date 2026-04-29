import { Question, SessionStatus } from '../../types';
import Timer from '../Timer/Timer';

interface Props {
  question: Question;
  status: SessionStatus;
  /** ISO string or Date from session.startedAt — used to restore elapsed time after refresh */
  sessionStartedAt?: string | Date;
  onStartFinalAnswer: () => void;
  onTimerExpire?: () => void;
  onWarn5Min?: () => void;
  onWarn1Min?: () => void;
}

const difficultyColors = {
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  hard: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  expert: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export default function QuestionPanel({ question, status, sessionStartedAt, onStartFinalAnswer, onTimerExpire, onWarn5Min, onWarn1Min }: Props) {
  // Compute elapsed seconds from DB-stored startedAt so a page refresh doesn't reset the timer
  const initialElapsedSeconds = sessionStartedAt
    ? Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000)
    : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="bg-surface-800 rounded-xl border border-surface-600 p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 className="text-base font-semibold text-white leading-tight">{question.title}</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${difficultyColors[question.difficulty]}`}>
            {question.difficulty}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {question.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-surface-700 text-gray-400">
              {tag}
            </span>
          ))}
        </div>

        {/* Timer — seeded from DB startedAt so refresh doesn't give free time */}
        <Timer
          totalMinutes={question.durationMinutes}
          initialElapsedSeconds={initialElapsedSeconds}
          autoStart={status === 'active'}
          onExpire={onTimerExpire}
          onWarn5Min={onWarn5Min}
          onWarn1Min={onWarn1Min}
          className="mt-2"
        />
      </div>

      {/* Question Prompt */}
      <div className="bg-surface-800 rounded-xl border border-surface-600 p-4 flex-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Question</h3>
        <p className="text-sm text-gray-200 leading-relaxed">{question.prompt}</p>
      </div>

      {/* Phase-specific rubric */}
      <div className="bg-surface-800 rounded-xl border border-surface-600 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Evaluation Areas
        </h3>
        <div className="space-y-1.5">
          {question.rubric.map((item) => (
            <div key={item.category} className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-300">{item.category}</span>
                <span className="text-xs text-gray-600 ml-1">({Math.round(item.weight * 100)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Action Buttons */}
      {status === 'active' && (
        <button
          onClick={onStartFinalAnswer}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors"
        >
          Submit & Record Final Answer →
        </button>
      )}
    </div>
  );
}
