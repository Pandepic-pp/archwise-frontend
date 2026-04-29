import { useEffect, useRef } from 'react';
import { TranscriptEntry, JobProcessingEvent } from '../../types';

interface Props {
  entries: TranscriptEntry[];
  processingEvent: JobProcessingEvent | null;
  streamingText?: string;
}

const typeLabels: Record<string, string> = {
  clarification: 'Clarification',
  tradeoff: 'Trade-off',
  general: 'General',
  finalAnswer: 'Final Answer',
  followUp: 'Follow-up',
  diagramReview: 'Diagram Review',
  response: '',
};

const roleStyles = {
  user: {
    container: 'ml-4',
    bubble: 'bg-brand-600/20 border border-brand-500/30 text-gray-200',
    label: 'text-brand-400',
    avatar: 'bg-brand-600 text-white',
  },
  ai: {
    container: 'mr-4',
    bubble: 'bg-surface-700 border border-surface-500 text-gray-200',
    label: 'text-purple-400',
    avatar: 'bg-purple-700 text-white',
  },
  system: {
    container: '',
    bubble: 'bg-surface-700/50 border border-dashed border-surface-500 text-gray-500 text-center',
    label: 'text-gray-500',
    avatar: 'bg-gray-700 text-gray-400',
  },
};

function formatTime(ts: string | Date): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Transcript({ entries, processingEvent, streamingText }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, processingEvent, streamingText]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-600">
        <h3 className="text-sm font-semibold text-gray-300">Discussion Log</h3>
        <span className="text-xs text-gray-500">{entries.length} entries</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-sm">
            <p>No messages yet.</p>
            <p className="mt-1 text-xs">Start by asking a clarifying question or discussing the design.</p>
          </div>
        )}

        {entries.map((entry, idx) => {
          const styles = roleStyles[entry.role] || roleStyles.system;
          const typeLabel = typeLabels[entry.type];

          return (
            <div key={entry._id || idx} className={`flex flex-col gap-1 animate-fade-in ${styles.container}`}>
              <div className="flex items-center gap-1.5">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${styles.avatar}`}>
                  {entry.role === 'user' ? 'Y' : entry.role === 'ai' ? 'I' : 'S'}
                </div>
                <span className={`text-xs font-medium ${styles.label}`}>
                  {entry.role === 'user' ? 'You' : entry.role === 'ai' ? 'Interviewer' : 'System'}
                </span>
                {typeLabel && (
                  <span className="text-xs text-gray-600 italic">· {typeLabel}</span>
                )}
                <span className="text-xs text-gray-700 ml-auto">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
              <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${styles.bubble}`}>
                {entry.content}
              </div>
            </div>
          );
        })}

        {/* Streaming AI response — shown in real time as tokens arrive */}
        {streamingText && (
          <div className="flex flex-col gap-1 animate-fade-in mr-4" data-ai-last>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">I</div>
              <span className="text-xs font-medium text-purple-400">Interviewer</span>
            </div>
            <div className="bg-surface-700 border border-surface-500 rounded-xl px-3 py-2 text-sm leading-relaxed text-gray-200">
              {streamingText}
              <span className="inline-block w-0.5 h-3.5 bg-purple-400 ml-0.5 animate-pulse align-text-bottom" />
            </div>
          </div>
        )}

        {/* Processing indicator — shown only when transcribing/waiting, not during streaming */}
        {processingEvent && !streamingText && (
          <div className="flex items-center gap-2 mr-4 animate-fade-in">
            <div className="h-5 w-5 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white">I</div>
            <div className="bg-surface-700 border border-surface-500 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-gray-500">{processingEvent.message}</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
