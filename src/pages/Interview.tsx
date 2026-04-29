import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { sessionApi } from '../services/api';
import {
  InterviewSession,
  Question,
  TranscriptEntry,
  JobProcessingEvent,
  TranscriptUpdateEvent,
  JobCompleteEvent,
  FollowUpsReadyEvent,
  StreamChunkEvent,
} from '../types';
import Whiteboard, { WhiteboardHandle } from '../components/Whiteboard/Whiteboard';
import QuestionPanel from '../components/QuestionPanel/QuestionPanel';
import Transcript from '../components/Transcript/Transcript';
import Controls from '../components/Controls/Controls';
import FinalAnswerAndFollowUp from '../components/FinalAnswerAndFollowUp/FinalAnswerAndFollowUp';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Shared AudioContext — browsers suspend a newly created one after user inactivity,
// so we reuse one instance and always resume() before scheduling beeps.
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === 'closed') _audioCtx = new AudioContext();
  return _audioCtx;
}

/** Play N short beeps at the given Hz using Web Audio API */
function playAlert(beeps: number, hz: number) {
  try {
    const ctx = getAudioCtx();
    const schedule = () => {
      let t = ctx.currentTime;
      for (let i = 0; i < beeps; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = hz;
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
        t += 0.45;
      }
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(schedule);
    } else {
      schedule();
    }
  } catch { /* ignore in environments without AudioContext */ }
}

/** Queue a sentence for speech — utterances stack automatically in Web Speech API */
function queueSpeak(text: string) {
  if (!window.speechSynthesis || !text.trim()) return;
  const u = new SpeechSynthesisUtterance(text.trim());
  u.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find((x) => x.lang === 'en-US') || voices[0];
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [processingEvent, setProcessingEvent] = useState<JobProcessingEvent | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [currentFollowUp, setCurrentFollowUp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(288);
  const [rightWidth, setRightWidth] = useState(288);
  const [streamingText, setStreamingText] = useState('');
  const [triggerFollowUps, setTriggerFollowUps] = useState(false);

  const leftDragRef = useRef<{ active: boolean; startX: number; startWidth: number }>({ active: false, startX: 0, startWidth: 288 });
  const rightDragRef = useRef<{ active: boolean; startX: number; startWidth: number }>({ active: false, startX: 0, startWidth: 288 });

  const whiteboardRef = useRef<WhiteboardHandle>(null);
  const sentenceBufferRef = useRef('');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedJsonRef = useRef('');
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { joinRoom, on } = useSocket(token);

  // ─── Load Session ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise<void>((r) => setTimeout(r, 700));
        try {
          const { data } = await sessionApi.get(id);
          const s: InterviewSession = data.session;
          setSession(s);
          setTranscripts(s.transcripts);
          const q = typeof s.questionId === 'object' ? s.questionId as Question : null;
          setQuestion(q);

          // Auto-start if still pending
          if (s.status === 'pending') {
            await sessionApi.start(id);
            setSession((prev) => prev ? { ...prev, status: 'active' } : prev);
          }

          // Rejoin in-progress follow-ups
          if (s.status === 'followUp') {
            setFollowUpQuestions(s.followUpQuestions.map((f) => f.question));
            setCurrentFollowUp(s.activeFollowUpIndex);
          }
          setLoading(false);
          return;
        } catch (err) {
          console.error(`Session load attempt ${attempt + 1}:`, err);
          if (attempt === 2) {
            setError('Failed to load session. Please try again.');
            setLoading(false);
          }
        }
      }
    };
    load();
  }, [id]);

  // ─── Restore diagram after Excalidraw mounts ─────────────────────────────────
  useEffect(() => {
    if (!session?.currentDiagramJson) return;
    const t = setTimeout(() => {
      whiteboardRef.current?.restoreScene(session.currentDiagramJson!);
      lastSavedJsonRef.current = session.currentDiagramJson!;
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?._id]); // only once per session load

  // ─── Safety timeout: clear stuck processingEvent after 45s ───────────────────
  useEffect(() => {
    if (processingEvent) {
      processingTimeoutRef.current = setTimeout(() => setProcessingEvent(null), 45000);
    } else {
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
    }
    return () => { if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current); };
  }, [processingEvent]);

  // ─── Socket Room ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !token) return;
    joinRoom(id);
  }, [id, token, joinRoom]);

  // ─── Socket Listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const off1 = on<JobProcessingEvent>('job:processing', (e) => {
      setProcessingEvent(e);
    });

    const off2 = on<TranscriptUpdateEvent>('transcript:update', (e) => {
      setTranscripts((prev) => [...prev, e.userEntry, e.aiEntry]);
      // Drain any remaining sentence buffer on completion
      if (sentenceBufferRef.current.trim()) {
        queueSpeak(sentenceBufferRef.current);
        sentenceBufferRef.current = '';
      }
      setStreamingText('');
      setProcessingEvent(null);
    });

    const off3 = on<JobCompleteEvent>('job:complete', (e) => {
      setProcessingEvent(null);
      if (e.type === 'finalAnswer') setTriggerFollowUps(true);
    });

    const off_stream_start = on<{ sessionId: string }>('stream:start', () => {
      window.speechSynthesis?.cancel();
      sentenceBufferRef.current = '';
      setStreamingText('');
      setProcessingEvent({ type: 'audio', message: 'Interviewer is responding…' });
    });

    const off_stream_chunk = on<StreamChunkEvent>('stream:chunk', (e) => {
      setStreamingText((prev) => prev + e.text);
      sentenceBufferRef.current += e.text;
      // Speak each complete sentence as it arrives
      const parts = sentenceBufferRef.current.split(/(?<=[.?!])\s+/);
      if (parts.length > 1) {
        parts.slice(0, -1).forEach((s) => queueSpeak(s));
        sentenceBufferRef.current = parts[parts.length - 1];
      }
    });

    const off4 = on<FollowUpsReadyEvent>('followUps:ready', (e) => {
      setFollowUpQuestions(e.questions);
      setCurrentFollowUp(e.currentIndex);
      setSession((prev) => prev ? { ...prev, status: 'followUp' } : prev);
      setProcessingEvent(null);
    });

    const off5 = on<{ evaluation: unknown; sessionId: string }>('evaluation:ready', (e) => {
      navigate(`/results/${e.sessionId}`);
    });

    const off6 = on<{ message: string }>('job:error', (e) => {
      setProcessingEvent(null);
      setError(e.message);
      setTimeout(() => setError(null), 5000);
    });

    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off_stream_start(); off_stream_chunk(); };
  }, [id, on, navigate]);

  // ─── Panel resize drag ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (leftDragRef.current.active) {
        const delta = e.clientX - leftDragRef.current.startX;
        setLeftWidth(Math.max(200, Math.min(520, leftDragRef.current.startWidth + delta)));
      }
      if (rightDragRef.current.active) {
        const delta = rightDragRef.current.startX - e.clientX;
        setRightWidth(Math.max(200, Math.min(520, rightDragRef.current.startWidth + delta)));
      }
    };
    const handleMouseUp = () => {
      leftDragRef.current.active = false;
      rightDragRef.current.active = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startLeftDrag = useCallback((e: React.MouseEvent) => {
    leftDragRef.current = { active: true, startX: e.clientX, startWidth: leftWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftWidth]);

  const startRightDrag = useCallback((e: React.MouseEvent) => {
    rightDragRef.current = { active: true, startX: e.clientX, startWidth: rightWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [rightWidth]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const getSceneJson = useCallback(() => {
    return whiteboardRef.current?.getSceneJson() ?? '{}';
  }, []);

  const handleSceneChange = useCallback((elementCount: number) => {
    setSnapshotCount(elementCount);
    if (!id || elementCount === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      const sceneJson = getSceneJson();
      if (sceneJson === lastSavedJsonRef.current || sceneJson === '{}') return;
      lastSavedJsonRef.current = sceneJson;
      try { await sessionApi.updateCurrentDiagram(id, sceneJson); } catch { /* silent */ }
    }, 3000);
  }, [id, getSceneJson]);

  const getSceneImageBase64 = useCallback(async () => {
    return whiteboardRef.current?.getImageBase64() ?? null;
  }, []);

  const handleStartFinalAnswer = useCallback(async () => {
    if (!id) return;
    await sessionApi.startFinalAnswer(id);
    setSession((prev) => prev ? { ...prev, status: 'finalAnswer' } : prev);

    // Auto-save diagram snapshot at this point
    const [sceneJson, imageBase64] = await Promise.all([
      getSceneJson(),
      getSceneImageBase64(),
    ]);
    await sessionApi.saveDiagram({
      sessionId: id,
      sceneJson,
      imageBase64: imageBase64 ?? undefined,
      label: 'Pre-final-answer snapshot',
    });
  }, [id, getSceneJson, getSceneImageBase64]);

  const handleRequestFollowUps = useCallback(async () => {
    if (!id) return;
    setProcessingEvent({ type: 'followUps', message: 'Generating follow-up questions…' });
    await sessionApi.requestFollowUps({ sessionId: id, socketRoomId: id });
  }, [id]);

  // Auto-trigger follow-up generation when finalAnswer job completes
  useEffect(() => {
    if (!triggerFollowUps) return;
    setTriggerFollowUps(false);
    handleRequestFollowUps();
  }, [triggerFollowUps, handleRequestFollowUps]);

  const handleAllFollowUpsAnswered = useCallback(async () => {
    if (!id) return;
    setSession((prev) => prev ? { ...prev, status: 'evaluating' } : prev);
    setProcessingEvent({ type: 'evaluation', message: 'Evaluating your performance…' });
    await sessionApi.triggerEvaluation({ sessionId: id, socketRoomId: id });
  }, [id]);

  const handleFollowUpNext = useCallback(() => {
    setCurrentFollowUp((prev) => prev + 1);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading interview…" />
      </div>
    );
  }

  if (!session || !question) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Session not found'}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isFinalAnswerPhase = session.status === 'finalAnswer';
  const isFollowUpPhase = session.status === 'followUp';
  const isEvaluating = session.status === 'evaluating';
  const isCompleted = session.status === 'completed';

  if (isCompleted) {
    navigate(`/results/${session._id}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col" style={{ height: '100vh' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-700 bg-surface-800">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Exit
          </button>
          <span className="text-gray-600">|</span>
          <span className="text-sm text-gray-300 font-medium truncate max-w-xs">{question.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            session.status === 'active' ? 'bg-green-500/20 text-green-400' :
            session.status === 'finalAnswer' ? 'bg-yellow-500/20 text-yellow-400' :
            session.status === 'followUp' ? 'bg-purple-500/20 text-purple-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {session.status === 'active' ? '● Discussion' :
             session.status === 'finalAnswer' ? '● Final Answer' :
             session.status === 'followUp' ? '● Follow-ups' :
             session.status === 'evaluating' ? '⏳ Evaluating' : session.status}
          </span>
          <span className="text-xs text-gray-500">{user?.name}</span>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-xs text-red-400 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Main layout */}
      {(isFinalAnswerPhase || isFollowUpPhase) ? (
        <div className="flex-1 overflow-hidden">
          <FinalAnswerAndFollowUp
            sessionId={session._id}
            sessionStatus={session.status as 'finalAnswer' | 'followUp'}
            followUpQuestions={followUpQuestions}
            currentFollowUpIndex={currentFollowUp}
            onFollowUpNext={handleFollowUpNext}
            onAllFollowUpsAnswered={handleAllFollowUpsAnswered}
            onProcessingStart={(msg) => setProcessingEvent({ type: 'followUps', message: msg })}
            onError={setError}
          />
        </div>
      ) : isEvaluating ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold text-white">Evaluating your performance…</h2>
            <p className="text-gray-400 text-sm">GPT-4o is analyzing your design, discussion, and diagrams.</p>
            <div className="flex gap-2 justify-center text-xs text-gray-600">
              <span>✓ Transcripts analyzed</span>
              <span>•</span>
              <span>✓ Diagram reviewed</span>
              <span>•</span>
              <span>⏳ Generating scores</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>

          {/* ── Left panel: Question + Controls ──────────────────────── */}
          {leftOpen ? (
            <>
              <div style={{ width: leftWidth }} className="shrink-0 flex flex-col bg-surface-800 overflow-y-auto relative">
                <button
                  onClick={() => setLeftOpen(false)}
                  title="Collapse panel"
                  className="absolute top-2 right-2 z-10 h-6 w-6 flex items-center justify-center rounded-md bg-surface-700 hover:bg-surface-600 text-gray-400 hover:text-gray-200 transition-colors text-xs"
                >
                  ◀
                </button>
                <div className="flex-1 p-3 pt-8">
                  <QuestionPanel
                    question={question}
                    status={session.status}
                    sessionStartedAt={session.startedAt}
                    onStartFinalAnswer={handleStartFinalAnswer}
                    onTimerExpire={handleStartFinalAnswer}
                    onWarn5Min={() => playAlert(2, 660)}
                    onWarn1Min={() => playAlert(3, 880)}
                  />
                </div>
                <div className="border-t border-surface-700 p-3">
                  <Controls
                    sessionId={session._id}
                    sessionStatus={session.status}
                    getSceneJson={getSceneJson}
                    getSceneImageBase64={getSceneImageBase64}
                    onProcessingStart={(msg) => setProcessingEvent({ type: 'audio', message: msg })}
                    onError={setError}
                    disabled={!!processingEvent}
                  />
                </div>
              </div>
              {/* Left resize handle */}
              <div
                onMouseDown={startLeftDrag}
                className="w-1 shrink-0 cursor-col-resize bg-surface-700 hover:bg-brand-500 transition-colors"
              />
            </>
          ) : (
            /* Collapsed left — thin strip with expand button */
            <div className="w-8 shrink-0 border-r border-surface-700 bg-surface-800 flex flex-col items-center py-3 gap-2">
              <button
                onClick={() => setLeftOpen(true)}
                title="Expand panel"
                className="h-6 w-6 flex items-center justify-center rounded-md bg-surface-700 hover:bg-surface-600 text-gray-400 hover:text-gray-200 transition-colors text-xs"
              >
                ▶
              </button>
              <span className="text-gray-600 text-xs [writing-mode:vertical-rl] rotate-180 mt-2 select-none">
                Question
              </span>
            </div>
          )}

          {/* ── Center: Whiteboard ────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden relative">
            <Whiteboard ref={whiteboardRef} onSceneChange={handleSceneChange} />
            {/* Element count + panel toggle hints */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {!leftOpen && (
                <button
                  onClick={() => setLeftOpen(true)}
                  className="bg-surface-800/90 backdrop-blur px-2 py-1 rounded-lg text-xs text-brand-400 border border-surface-600 hover:bg-surface-700 transition-colors"
                >
                  ◀ Panel
                </button>
              )}
              <div className="bg-surface-800/80 backdrop-blur px-2 py-1 rounded-lg text-xs text-gray-500 border border-surface-600">
                {snapshotCount} element{snapshotCount !== 1 ? 's' : ''}
              </div>
              {!rightOpen && (
                <button
                  onClick={() => setRightOpen(true)}
                  className="bg-surface-800/90 backdrop-blur px-2 py-1 rounded-lg text-xs text-brand-400 border border-surface-600 hover:bg-surface-700 transition-colors"
                >
                  Log ▶
                </button>
              )}
            </div>
          </div>

          {/* ── Right panel: Transcript ───────────────────────────────── */}
          {rightOpen ? (
            <>
              {/* Right resize handle */}
              <div
                onMouseDown={startRightDrag}
                className="w-1 shrink-0 cursor-col-resize bg-surface-700 hover:bg-brand-500 transition-colors"
              />
              <div style={{ width: rightWidth }} className="shrink-0 flex flex-col bg-surface-800 relative">
                <button
                  onClick={() => setRightOpen(false)}
                  title="Collapse panel"
                  className="absolute top-2 left-2 z-10 h-6 w-6 flex items-center justify-center rounded-md bg-surface-700 hover:bg-surface-600 text-gray-400 hover:text-gray-200 transition-colors text-xs"
                >
                  ▶
                </button>
                <div className="pt-8 flex flex-col flex-1 overflow-hidden">
                  <Transcript entries={transcripts} processingEvent={processingEvent} streamingText={streamingText} />
                </div>
              </div>
            </>
          ) : (
            <div className="w-8 shrink-0 border-l border-surface-700 bg-surface-800 flex flex-col items-center py-3 gap-2">
              <button
                onClick={() => setRightOpen(true)}
                title="Expand panel"
                className="h-6 w-6 flex items-center justify-center rounded-md bg-surface-700 hover:bg-surface-600 text-gray-400 hover:text-gray-200 transition-colors text-xs"
              >
                ◀
              </button>
              {transcripts.length > 0 && (
                <span className="text-brand-400 text-xs font-mono">{transcripts.length}</span>
              )}
              <span className="text-gray-600 text-xs [writing-mode:vertical-rl] mt-2 select-none">
                Discussion Log
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
