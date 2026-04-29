// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Questions ────────────────────────────────────────────────────────────────
export interface RubricItem {
  category: string;
  description: string;
  weight: number;
}

export interface Question {
  _id: string;
  title: string;
  prompt: string;
  difficulty: 'medium' | 'hard' | 'expert';
  tags: string[];
  durationMinutes: number;
  rubric: RubricItem[];
}

// ─── Session ──────────────────────────────────────────────────────────────────
export type SessionStatus =
  | 'pending'
  | 'active'
  | 'finalAnswer'
  | 'followUp'
  | 'evaluating'
  | 'completed';

export type TranscriptRole = 'user' | 'ai' | 'system';
export type TranscriptType =
  | 'clarification'
  | 'tradeoff'
  | 'general'
  | 'finalAnswer'
  | 'followUp'
  | 'response'
  | 'diagramReview';

export type InteractionType = 'clarification' | 'tradeoff' | 'general' | 'finalAnswer' | 'followUp';

export interface TranscriptEntry {
  _id?: string;
  role: TranscriptRole;
  content: string;
  type: TranscriptType;
  timestamp: string | Date;
}

export interface DiagramSnapshot {
  sceneJson: string;
  imageBase64?: string;
  label: string;
  timestamp: string | Date;
}

export interface FollowUpQuestion {
  question: string;
  answer?: string;
  startedAt?: string | Date;
  answeredAt?: string | Date;
  responseTimeSeconds?: number;
  penaltyApplied: boolean;
}

export interface EvaluationScores {
  requirementsGathering: number;
  highLevelComponents: number;
  apisAndDataModel: number;
  scalabilityAndReliability: number;
  tradeoffsAndDepth: number;
  communicationClarity: number;
  overall: number;
}

export interface Evaluation {
  scores: EvaluationScores;
  strengths: string[];
  improvements: string[];
  confidencePercent: number;
  confidenceLabel: string;
  detailedFeedback: string;
  diagramFeedback?: string;
  generatedAt: string | Date;
}

export interface InterviewSession {
  _id: string;
  userId: string;
  questionId: Question | string;
  status: SessionStatus;
  startedAt: string | Date;
  completedAt?: string | Date;
  durationSeconds: number;
  transcripts: TranscriptEntry[];
  diagramHistory: DiagramSnapshot[];
  currentDiagramJson?: string;
  followUpQuestions: FollowUpQuestion[];
  activeFollowUpIndex: number;
  evaluation?: Evaluation;
}

// ─── Socket Events ────────────────────────────────────────────────────────────
export interface JobProcessingEvent {
  type: 'audio' | 'llm' | 'followUps' | 'evaluation';
  message: string;
}

export interface TranscriptUpdateEvent {
  userEntry: TranscriptEntry;
  aiEntry: TranscriptEntry;
}

export interface JobCompleteEvent {
  type: string;
  aiResponse: string;
  transcript: string;
}

export interface StreamChunkEvent {
  text: string;
}

export interface FollowUpsReadyEvent {
  questions: string[];
  currentIndex: number;
}

export interface EvaluationReadyEvent {
  evaluation: Evaluation;
  sessionId: string;
}

// ─── Whiteboard / Diagram ─────────────────────────────────────────────────────
export interface WhiteboardState {
  sessionId: string;
  sceneJson: string;
  updatedAt: string | Date;
}

export interface StructuredComponent {
  id: string;
  type: string;
  label: string;
  shape: string;
}

export interface StructuredConnection {
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  arrowLabel?: string;
}

export interface StructuredDiagram {
  components: StructuredComponent[];
  connections: StructuredConnection[];
  freeTextAnnotations: string[];
  isEmpty: boolean;
}

// ─── UI State ─────────────────────────────────────────────────────────────────
export type RecordingState = 'idle' | 'recording' | 'processing';

export type InterviewPhase = 'setup' | 'discussion' | 'finalAnswer' | 'followUp' | 'evaluating' | 'results';

export interface TimerState {
  elapsed: number;     // seconds
  remaining: number;   // seconds (for countdown phases)
  isRunning: boolean;
}
