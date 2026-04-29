import { useState, useEffect } from 'react';
import { SessionStatus } from '../../types';
import { useCountdown } from '../../hooks/useTimer';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { sessionApi } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface Props {
  sessionId: string;
  sessionStatus: Extract<SessionStatus, 'finalAnswer' | 'followUp'>;
  followUpQuestions: string[];
  currentFollowUpIndex: number;
  onFollowUpNext: () => void;
  onAllFollowUpsAnswered: () => void;
  onProcessingStart: (msg: string) => void;
  onError: (msg: string) => void;
}

const FINAL_ANSWER_COUNTDOWN = 5;
const FOLLOW_UP_READ_TIME = 15;

export default function FinalAnswerAndFollowUp({
  sessionId,
  sessionStatus,
  followUpQuestions,
  currentFollowUpIndex,
  onFollowUpNext,
  onAllFollowUpsAnswered,
  onProcessingStart,
  onError,
}: Props) {
  // ── Final answer state ─────────────────────────────────────────────────────
  const [finalPhase, setFinalPhase] = useState<'countdown' | 'recording' | 'submitted'>('countdown');
  const [finalRecordingReady, setFinalRecordingReady] = useState(false);

  // ── Follow-up state ────────────────────────────────────────────────────────
  const [followPhase, setFollowPhase] = useState<'reading' | 'recording' | 'submitted'>('reading');
  const [followRecordingReady, setFollowRecordingReady] = useState(false);

  const { recordingState, startRecording, stopRecording, error: recError } = useAudioRecorder();

  const { remaining: finalRemaining, start: startFinalCountdown } = useCountdown(
    FINAL_ANSWER_COUNTDOWN,
    () => setFinalRecordingReady(true),
  );

  const { remaining: followRemaining, start: startFollowCountdown } = useCountdown(
    FOLLOW_UP_READ_TIME,
    () => setFollowRecordingReady(true),
  );

  // Start 5-second countdown when entering final answer phase
  useEffect(() => {
    if (sessionStatus !== 'finalAnswer') return;
    setFinalPhase('countdown');
    startFinalCountdown();
  }, [sessionStatus, startFinalCountdown]);

  // Auto-start final recording when countdown hits 0
  useEffect(() => {
    if (!finalRecordingReady) return;
    setFinalRecordingReady(false);
    setFinalPhase('recording');
    startRecording();
  }, [finalRecordingReady, startRecording]);

  // Reset and start read countdown for each new follow-up question
  useEffect(() => {
    if (sessionStatus !== 'followUp') return;
    setFollowPhase('reading');
    setFollowRecordingReady(false);
    startFollowCountdown();
  }, [currentFollowUpIndex, sessionStatus, startFollowCountdown]);

  // Auto-start follow-up recording when read countdown hits 0
  useEffect(() => {
    if (!followRecordingReady) return;
    setFollowRecordingReady(false);
    setFollowPhase('recording');
    startRecording();
  }, [followRecordingReady, startRecording]);

  // ── Submit handlers ────────────────────────────────────────────────────────
  const handleSubmitFinal = async () => {
    const blob = await stopRecording();
    if (!blob) { onError('No audio captured.'); return; }
    setFinalPhase('submitted');
    onProcessingStart('Processing your final answer…');
    try {
      await sessionApi.submitAudio({
        audio: blob,
        sessionId,
        interactionType: 'finalAnswer',
        socketRoomId: sessionId,
      });
    } catch {
      onError('Failed to submit final answer. Please try again.');
    }
  };

  const handleSubmitFollowUp = async () => {
    const blob = await stopRecording();
    if (!blob) { onError('No audio captured.'); return; }
    setFollowPhase('submitted');
    onProcessingStart('Processing your answer…');
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

  // Auto-advance after follow-up submission
  useEffect(() => {
    if (sessionStatus !== 'followUp' || followPhase !== 'submitted') return;
    const isLast = currentFollowUpIndex === followUpQuestions.length - 1;
    const delay = isLast ? 2500 : 1500;
    const t = setTimeout(() => (isLast ? onAllFollowUpsAnswered() : onFollowUpNext()), delay);
    return () => clearTimeout(t);
  }, [sessionStatus, followPhase, currentFollowUpIndex, followUpQuestions.length, onAllFollowUpsAnswered, onFollowUpNext]);

  const isProcessing = recordingState === 'processing';
  const isFinalDone = sessionStatus === 'followUp';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 animate-fade-in">

      {/* Progress indicator */}
      <div className="flex items-center gap-1.5">
        <div className={`h-2 rounded-full transition-all ${
          isFinalDone ? 'w-8 bg-green-500' : 'w-12 bg-brand-500'
        }`} />
        {followUpQuestions.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i < currentFollowUpIndex ? 'w-8 bg-green-500' :
              sessionStatus === 'followUp' && i === currentFollowUpIndex ? 'w-12 bg-brand-500' :
              'w-8 bg-surface-600'
            }`}
          />
        ))}
      </div>

      <div className="text-xs text-gray-500 uppercase tracking-wider">
        {sessionStatus === 'finalAnswer'
          ? 'Final Answer'
          : `Follow-Up ${currentFollowUpIndex + 1} of ${followUpQuestions.length}`}
      </div>

      {/* ── Final Answer Phase ──────────────────────────────────────────── */}
      {sessionStatus === 'finalAnswer' && (
        <>
          {finalPhase === 'submitted' ? (
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner label="Generating your follow-up questions…" />
              <p className="text-xs text-gray-500">Hang tight — this takes a moment.</p>
            </div>

          ) : finalPhase === 'countdown' ? (
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-xl bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-gray-100 font-semibold text-base leading-snug">Final Answer</p>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                      Walk through your complete system design — components, data flow, scalability decisions, and trade-offs.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-24 w-24">
                  <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#1e2640" strokeWidth="6" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      stroke="#ef4444"
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - finalRemaining / FINAL_ANSWER_COUNTDOWN)}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold font-mono text-white">
                    {finalRemaining}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Microphone starts in <span className="text-red-400 font-semibold">{finalRemaining}s</span>
                </p>
              </div>
            </div>

          ) : (
            /* recording */
            <div className="w-full max-w-xl bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-gray-100 font-semibold text-base leading-snug">Recording Your Final Answer</p>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                    Walk through your complete system design — components, data flow, scalability decisions, and trade-offs.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 w-fit mx-auto">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-red-400 font-medium">Recording…</span>
                </div>
                <button
                  onClick={handleSubmitFinal}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing…' : '⏹ Stop & Submit Final Answer'}
                </button>
                {recError && <p className="text-xs text-red-400 mt-1">{recError}</p>}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Follow-Up Phase ─────────────────────────────────────────────── */}
      {sessionStatus === 'followUp' && (() => {
        const currentQ = followUpQuestions[currentFollowUpIndex];
        if (!currentQ) return null;

        return (
          <>
            {/* Question card */}
            <div className="w-full max-w-xl bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <p className="text-gray-100 font-medium leading-relaxed text-base">{currentQ}</p>
              </div>
            </div>

            {/* Reading countdown */}
            {followPhase === 'reading' && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-20 w-20">
                  <svg className="-rotate-90" width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#1e2640" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={followRemaining <= 5 ? '#22c55e' : '#3b82f6'}
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 34}
                      strokeDashoffset={2 * Math.PI * 34 * (1 - followRemaining / FOLLOW_UP_READ_TIME)}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold font-mono text-white">
                    {followRemaining}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {followRemaining > 0
                    ? <>Microphone starts in <span className="text-blue-400 font-semibold">{followRemaining}s</span></>
                    : 'Starting microphone…'}
                </p>
              </div>
            )}

            {/* Recording */}
            {followPhase === 'recording' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-red-400 font-medium">Recording…</span>
                </div>
                <button
                  onClick={handleSubmitFollowUp}
                  disabled={isProcessing}
                  className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing…' : '⏹ Stop & Submit Answer'}
                </button>
                {recError && <p className="text-xs text-red-400">{recError}</p>}
              </div>
            )}

            {/* Submitted */}
            {followPhase === 'submitted' && (
              <div className="flex flex-col items-center gap-4">
                <LoadingSpinner label={
                  currentFollowUpIndex === followUpQuestions.length - 1
                    ? 'Finalizing your session…'
                    : 'Preparing next question…'
                } />
                {currentFollowUpIndex === followUpQuestions.length - 1 && (
                  <p className="text-xs text-gray-500">Generating your evaluation — this takes a moment.</p>
                )}
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
