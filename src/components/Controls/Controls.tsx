import { useState, useCallback } from 'react';
import { InteractionType, SessionStatus } from '../../types';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { sessionApi } from '../../services/api';
import { parseExcalidrawScene, diagramToTextDescription } from '../../utils/diagramParser';

interface Props {
  sessionId: string;
  sessionStatus: SessionStatus;
  getSceneJson: () => string;
  getSceneImageBase64: () => Promise<string | null>;
  onProcessingStart: (message: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

const INTERACTION_BUTTONS: {
  type: InteractionType;
  label: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  {
    type: 'clarification',
    label: 'Ask Clarifying Question',
    icon: '❓',
    color: 'border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10',
    description: 'Ask about requirements, constraints, or scope',
  },
];

const FINAL_ANSWER_BUTTONS: {
  type: InteractionType;
  label: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  {
    type: 'finalAnswer',
    label: 'Record Final Answer',
    icon: '🎯',
    color: 'border-green-500/50 hover:border-green-400 hover:bg-green-500/10',
    description: 'Present your complete system design solution',
  },
];

function speakText(text: string): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang === 'en-US' && v.name.toLowerCase().includes('natural')) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices[0];
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

export default function Controls({
  sessionId,
  sessionStatus,
  getSceneJson,
  getSceneImageBase64,
  onProcessingStart,
  onError,
  disabled = false,
}: Props) {
  const [activeType, setActiveType] = useState<InteractionType | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { recordingState, startRecording, stopRecording, error: recError } = useAudioRecorder();

  const handleStartRecording = useCallback(
    async (type: InteractionType) => {
      setActiveType(type);
      await startRecording();
    },
    [startRecording]
  );

  const handleStopAndSubmit = useCallback(async () => {
    if (!activeType) return;

    const blob = await stopRecording();
    if (!blob) {
      onError('No audio captured. Please try again.');
      return;
    }

    onProcessingStart('Transcribing your response...');

    try {
      const [sceneJson, imageBase64] = await Promise.all([
        Promise.resolve(getSceneJson()),
        getSceneImageBase64(),
      ]);
      await sessionApi.submitAudio({
        audio: blob,
        sessionId,
        interactionType: activeType,
        socketRoomId: sessionId,
        diagramJson: sceneJson,
        diagramImageBase64: imageBase64 ?? undefined,
      });
    } catch {
      onError('Failed to submit audio. Please try again.');
    } finally {
      setActiveType(null);
    }
  }, [activeType, stopRecording, sessionId, getSceneJson, getSceneImageBase64, onProcessingStart, onError]);

  const handleDiscussDrawing = useCallback(async () => {
    if (isAnalyzing || disabled) return;

    setIsAnalyzing(true);
    onProcessingStart('Analyzing your architecture...');

    try {
      const sceneJson = getSceneJson();
      const diagram = parseExcalidrawScene(sceneJson);
      const diagramTextDescription = diagramToTextDescription(diagram);

      const imageBase64 = await getSceneImageBase64();

      await sessionApi.discussDiagram({
        sessionId,
        socketRoomId: sessionId,
        sceneJson,
        diagramTextDescription,
        diagramImageBase64: imageBase64 ?? undefined,
      });
    } catch {
      onError('Failed to analyze diagram. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, disabled, sessionId, getSceneJson, getSceneImageBase64, onProcessingStart, onError]);

  const buttons = sessionStatus === 'finalAnswer' ? FINAL_ANSWER_BUTTONS : INTERACTION_BUTTONS;
  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  const anyBusy = disabled || isRecording || isProcessing || isAnalyzing;

  return (
    <div className="flex flex-col gap-3">
      {recError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2">
          {recError}
        </div>
      )}

      {sessionStatus === 'finalAnswer' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
          <p className="text-xs text-green-400 font-medium">Final Answer Phase</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Present your complete design solution clearly and concisely.
          </p>
        </div>
      )}

      {/* Audio interaction buttons */}
      <div className="grid grid-cols-1 gap-2">
        {buttons.map(({ type, label, icon, color, description }) => (
          <div key={type}>
            {activeType === type ? (
              <div className="rounded-xl border border-red-500/50 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-red-400">Recording...</span>
                  <span className="text-xs text-gray-500 ml-auto">{label}</span>
                </div>
                <button
                  onClick={handleStopAndSubmit}
                  disabled={isProcessing}
                  className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Stop & Submit'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartRecording(type)}
                disabled={anyBusy}
                className={`w-full rounded-xl border bg-transparent px-3 py-3 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  <span className="ml-auto text-gray-600 text-xs">🎙</span>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Discuss Drawing — diagram-aware AI analysis (no audio required) */}
      {sessionStatus !== 'finalAnswer' && (
        <div className="pt-1 border-t border-surface-600">
          <button
            onClick={handleDiscussDrawing}
            disabled={anyBusy}
            className="w-full rounded-xl border border-teal-500/50 bg-transparent px-3 py-3 text-left transition-all hover:border-teal-400 hover:bg-teal-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              {isAnalyzing ? (
                <>
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '240ms' }} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-teal-400">Analyzing...</p>
                    <p className="text-xs text-gray-500">Reviewing your architecture</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-base">🖼️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">Discuss Drawing</p>
                    <p className="text-xs text-gray-500">AI reviews your current whiteboard</p>
                  </div>
                  <span className="ml-auto text-teal-600 text-xs">✦</span>
                </>
              )}
            </div>
          </button>
        </div>
      )}

      {/* TTS replay controls */}
      <div className="mt-1 flex items-center gap-2 pt-2 border-t border-surface-600">
        <button
          onClick={() => {
            const lastAiMsg = document.querySelector('[data-ai-last]');
            if (lastAiMsg?.textContent) {
              setIsSpeaking(true);
              speakText(lastAiMsg.textContent);
              setTimeout(() => setIsSpeaking(false), 5000);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 border border-surface-500 text-xs text-gray-400 transition-colors"
        >
          <span>{isSpeaking ? '🔊' : '🔈'}</span>
          Replay Last Response
        </button>
        <button
          onClick={() => window.speechSynthesis?.cancel()}
          className="px-2 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 border border-surface-500 text-xs text-gray-500 transition-colors"
        >
          ✕ Stop
        </button>
      </div>
    </div>
  );
}
