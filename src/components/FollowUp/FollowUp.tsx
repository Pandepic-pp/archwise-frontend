import { useState, useEffect, useRef } from 'react';
import { useCountdown } from '../../hooks/useTimer';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { sessionApi } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface Props {
  sessionId: string;
  questions: string[];
  currentIndex: number;
  onAllAnswered: () => void;
  onNext: () => void;
  onProcessingStart: (msg: string) => void;
  onError: (msg: string) => void;
}

const READ_TIME = 15; // seconds before speak button enables

export default function FollowUp({
  sessionId,
  questions,
  currentIndex,
  onAllAnswered,
  onNext,
  onProcessingStart,
  onError,
}: Props) {
  const [phase, setPhase] = useState<'reading' | 'speaking' | 'submitted'>('reading');
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [penaltyApplied, setPenaltyApplied] = useState(false);
  const startedAtRef = useRef<Date | null>(null);
  const { recordingState, startRecording, stopRecording, error: recError } = useAudioRecorder();

  const { remaining, start: startCountdown } = useCountdown(READ_TIME, () => {
    setSpeakEnabled(true);
  });

  // Reset state when question changes
  useEffect(() => {
    setPhase('reading');
    setSpeakEnabled(false);
    setPenaltyApplied(false);
    startedAtRef.current = new Date();
    startCountdown();
  }, [currentIndex, startCountdown]);

  const handleStartSpeaking = async () => {
    if (!speakEnabled) {
      // Penalty: user started before read time expired
      setPenaltyApplied(true);
    }
    setPhase('speaking');
    await startRecording();
  };

  const handleStopAndSubmit = async () => {
    const blob = await stopRecording();
    if (!blob) {
      onError('No audio captured.');
      return;
    }

    onProcessingStart('Processing your follow-up answer...');
    setPhase('submitted');

    try {
      await sessionApi.submitAudio({
        audio: blob,
        sessionId,
        interactionType: 'followUp',
        socketRoomId: sessionId,
      });
    } catch {
      onError('Failed to submit answer. Please try again.');
    }
  };

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  // Auto-advance after submission — no manual button needed
  useEffect(() => {
    if (phase !== 'submitted') return;
    const delay = isLast ? 2500 : 1500;
    const t = setTimeout(() => (isLast ? onAllAnswered() : onNext()), delay);
    return () => clearTimeout(t);
  }, [phase, isLast, onAllAnswered, onNext]);

  if (!currentQ) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 animate-fade-in">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i < currentIndex
                ? 'w-8 bg-green-500'
                : i === currentIndex
                ? 'w-12 bg-brand-500'
                : 'w-8 bg-surface-600'
            }`}
          />
        ))}
      </div>

      <div className="text-xs text-gray-500 uppercase tracking-wider">
        Follow-Up {currentIndex + 1} of {questions.length}
      </div>

      {/* Question card */}
      <div className="w-full max-w-xl bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <p className="text-gray-100 font-medium leading-relaxed text-base">{currentQ}</p>
        </div>

        {penaltyApplied && (
          <div className="mt-3 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
            <p className="text-xs text-orange-400">⚠️ Response time penalty applied — started before read period.</p>
          </div>
        )}
      </div>

      {/* Countdown or action */}
      {phase === 'reading' && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-20 w-20">
            <svg className="-rotate-90" width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1e2640" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={remaining <= 5 ? '#22c55e' : '#3b82f6'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - remaining / READ_TIME)}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold font-mono text-white">
              {remaining}
            </span>
          </div>

          {!speakEnabled ? (
            <p className="text-sm text-gray-400">Read the question… speak button unlocks in {remaining}s</p>
          ) : (
            <p className="text-sm text-green-400 font-medium">✓ You may now begin speaking</p>
          )}

          <button
            onClick={handleStartSpeaking}
            className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all ${
              speakEnabled
                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/50'
                : 'bg-surface-700 border border-surface-500 text-gray-500 cursor-pointer hover:bg-surface-600'
            }`}
          >
            {speakEnabled ? '🎙 Start Speaking' : '🎙 Start Speaking Early (penalty)'}
          </button>
        </div>
      )}

      {phase === 'speaking' && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-400 font-medium">Recording…</span>
          </div>
          <button
            onClick={handleStopAndSubmit}
            disabled={recordingState === 'processing'}
            className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {recordingState === 'processing' ? 'Processing…' : '⏹ Stop & Submit Answer'}
          </button>
          {recError && <p className="text-xs text-red-400">{recError}</p>}
        </div>
      )}

      {phase === 'submitted' && (
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner label={isLast ? 'Finalizing your session…' : 'Preparing next question…'} />
          {isLast && (
            <p className="text-xs text-gray-500">Generating your evaluation — this takes a moment.</p>
          )}
        </div>
      )}
    </div>
  );
}
