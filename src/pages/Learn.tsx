import { useRef, useState } from 'react';
import AppNavbar from '../components/AppNavbar';

type LearnProps = {
  topic: 'HLD' | 'LLD';
};

type Chapter = {
  number: number;
  title: string;
  summary: string;
  keyIdeas: string[];
  interviewMoves: string[];
  practicePrompt: string;
};

const hldChapters: Chapter[] = [
  {
    number: 1,
    title: 'Learn System Design',
    summary:
      'Start with the map before walking the road. System design is the practice of turning vague product goals into reliable, scalable, maintainable architecture. This opening chapter explains what you are learning, why interviews test it, and how the rest of the learning path fits together.',
    keyIdeas: [
      'System design is about requirements, trade-offs, data flow, scale, reliability, and operational simplicity.',
      'A good design connects product behavior to technical choices instead of listing technologies randomly.',
      'Most interview systems are combinations of a small set of recurring building blocks.',
      'The goal is not a perfect architecture; it is a defensible architecture that fits the stated constraints.',
      'Your communication matters as much as your diagram because interviewers evaluate your decision process.',
    ],
    interviewMoves: [
      'Start by naming the product goal in one sentence.',
      'Separate functional requirements from non-functional requirements early.',
      'Use simple components first, then add scale and reliability mechanisms when justified.',
      'Explain trade-offs out loud so the interviewer can follow your thinking.',
    ],
    practicePrompt:
      'Pick a familiar app and write a one-paragraph description of its users, core actions, data, and likely scale.',
  },
  {
    number: 2,
    title: 'In a Hurry',
    summary:
      'If you have limited time, focus on the highest-leverage interview habits: clarify, estimate, draw a clean high-level design, choose the most important bottleneck, and summarize trade-offs. This chapter gives users a compressed path through the essentials.',
    keyIdeas: [
      'A minimal answer still needs requirements, API shape, data model, architecture, bottlenecks, and trade-offs.',
      'Do not spend too long on perfect estimates; use rough numbers to guide the design.',
      'Favor clear request flows over crowded diagrams.',
      'Prepare reusable patterns for feeds, chat, file upload, search, notifications, and rate limiting.',
      'Practice transitions between sections so the answer feels deliberate under time pressure.',
    ],
    interviewMoves: [
      'Use a 5-minute structure: clarify, estimate, design, deep dive, recap.',
      'Ask the interviewer which area they want to explore if time is short.',
      'Keep a small list of common bottlenecks ready: hot keys, fanout, storage growth, latency, and failure handling.',
      'End with the top two trade-offs even if the design is incomplete.',
    ],
    practicePrompt:
      'Give a 10-minute answer for designing a URL shortener, then note what you skipped and why.',
  },
  {
    number: 3,
    title: 'Introduction',
    summary:
      'This chapter introduces the mental model for designing systems. You will learn how users, requests, services, data stores, queues, caches, and external systems interact to deliver a product experience.',
    keyIdeas: [
      'Every system has inputs, processing, storage, outputs, and failure modes.',
      'Architecture is easier to reason about when you trace one request from client to backend and back.',
      'Stateful components are usually harder to scale than stateless components.',
      'Latency, availability, consistency, and cost often pull the design in different directions.',
      'Good diagrams show boundaries, data ownership, and communication paths.',
    ],
    interviewMoves: [
      'Explain the core entities and request flows before choosing specialized tools.',
      'Identify which parts of the system are synchronous and which can be asynchronous.',
      'Point out the main source of truth for each important type of data.',
      'Use diagrams to simplify the conversation, not to decorate it.',
    ],
    practicePrompt:
      'Trace the request flow for posting a comment on a social platform, including write path and read path.',
  },
  {
    number: 4,
    title: 'How to Prepare',
    summary:
      'Preparation is about building repeatable instincts. Learn the common components, practice estimation, study common product categories, and rehearse explaining trade-offs clearly.',
    keyIdeas: [
      'Practice both breadth and depth: know many patterns, but be able to deep dive into a few.',
      'Review fundamentals such as networking, databases, caching, queues, consistency, and partitioning.',
      'Keep notes for recurring designs like feeds, messaging, search, storage, analytics, and payments.',
      'Time-box practice sessions to mirror interview pressure.',
      'After each mock, write down what was unclear, what was slow, and what trade-offs you missed.',
    ],
    interviewMoves: [
      'Build a personal checklist for each interview stage.',
      'Practice speaking while drawing so your diagram and explanation stay synchronized.',
      'Use post-practice reviews to improve your next answer instead of collecting more passive notes.',
      'Prepare concise definitions for common technologies and patterns.',
    ],
    practicePrompt:
      'Create a one-week preparation plan with daily topics, one design prompt per day, and one review action.',
  },
  {
    number: 5,
    title: 'Delivery Framework',
    summary:
      'A delivery framework keeps open-ended design questions organized. Use it to move from requirements to architecture, from architecture to deep dives, and from deep dives to a strong conclusion.',
    keyIdeas: [
      'Clarify functional requirements, non-functional requirements, scale, constraints, and out-of-scope areas.',
      'Define APIs and data models before drawing too many services.',
      'Create a high-level design that handles the happy path first.',
      'Choose deep dives based on the riskiest or most interesting parts of the system.',
      'Close with trade-offs, limitations, monitoring, and future improvements.',
    ],
    interviewMoves: [
      'Ask clarifying questions before committing to the design.',
      'State assumptions explicitly and keep them visible through the answer.',
      'Use the interviewer as a collaborator when choosing deep dives.',
      'Summarize why the final design meets the requirements.',
    ],
    practicePrompt:
      'Apply the framework to designing a food delivery order tracking system.',
  },
  {
    number: 6,
    title: 'Core Concepts',
    summary:
      'Core concepts are the reusable fundamentals behind most designs. They help you explain why a system scales, fails, recovers, and remains maintainable.',
    keyIdeas: [
      'Scalability can be vertical or horizontal, and horizontal scaling usually requires stateless services or partitioned state.',
      'Availability and consistency often require explicit trade-offs in distributed systems.',
      'Caching improves latency and load but introduces invalidation, staleness, and capacity concerns.',
      'Partitioning and replication improve scale and availability but add operational complexity.',
      'Observability, rate limiting, idempotency, and retries are production concerns that strengthen designs.',
    ],
    interviewMoves: [
      'Use concepts to justify architecture choices instead of dropping terminology.',
      'Discuss failure handling for critical paths.',
      'Call out data consistency requirements for each major workflow.',
      'Mention operational signals such as latency, error rate, saturation, and queue depth.',
    ],
    practicePrompt:
      'For a ticket booking system, identify where consistency matters most and where eventual consistency is acceptable.',
  },
  {
    number: 7,
    title: 'Key Technologies',
    summary:
      'This chapter covers the common technologies used in system designs and when to reach for them. The important skill is matching a technology to a requirement, not memorizing product names.',
    keyIdeas: [
      'Relational databases work well for structured data, transactions, and strong consistency.',
      'NoSQL stores are useful for flexible schema, high throughput, wide-column access, document data, or key-value workloads.',
      'Queues and streams decouple producers from consumers and absorb bursts.',
      'Search indexes support text search, filtering, ranking, and retrieval patterns that primary databases do not handle well.',
      'Object storage and CDNs are standard choices for large files and global static delivery.',
    ],
    interviewMoves: [
      'Choose storage based on access patterns, consistency needs, and data shape.',
      'Use queues when work can happen asynchronously or needs buffering.',
      'Add CDN/object storage for media-heavy systems instead of pushing files through application servers.',
      'Explain one drawback for each major technology choice.',
    ],
    practicePrompt:
      'Choose technologies for a video upload and playback platform, then explain the reason for each choice.',
  },
  {
    number: 8,
    title: 'Common Patterns',
    summary:
      'Common patterns are reusable solutions for problems that appear across many systems. Recognizing them helps you design faster and communicate with more precision.',
    keyIdeas: [
      'Read-through and cache-aside patterns reduce repeated database reads.',
      'Fanout-on-write and fanout-on-read solve different feed generation trade-offs.',
      'Event-driven processing helps with notifications, analytics, indexing, and background workflows.',
      'Rate limiting protects services from abuse and overload.',
      'Idempotency keys make retries safer for payments, orders, and other critical writes.',
    ],
    interviewMoves: [
      'Name the pattern, explain why it fits, and describe its main trade-off.',
      'Use async patterns when the user does not need immediate completion.',
      'Call out hot partitions or celebrity-user problems in feed and social designs.',
      'Discuss retry behavior and duplicate handling for distributed workflows.',
    ],
    practicePrompt:
      'Compare fanout-on-write and fanout-on-read for a Twitter-like home timeline.',
  },
  {
    number: 9,
    title: 'Question Breakdowns',
    summary:
      'Question breakdowns teach you how to recognize the shape of a prompt and choose an appropriate design path. Most interview questions belong to families with shared requirements and bottlenecks.',
    keyIdeas: [
      'URL shortener questions emphasize redirects, key generation, storage, caching, and analytics.',
      'Chat systems emphasize low latency, connection management, message ordering, and offline delivery.',
      'Feed systems emphasize fanout strategy, ranking, caching, and hot users.',
      'File storage systems emphasize upload flow, metadata, object storage, deduplication, and CDN delivery.',
      'Search/autocomplete systems emphasize indexing, ranking, freshness, and query latency.',
    ],
    interviewMoves: [
      'Identify the question family before designing from scratch.',
      'List the unique bottleneck for the prompt and spend deep-dive time there.',
      'Reuse proven patterns while tailoring requirements to the specific product.',
      'Close by comparing alternatives the interviewer might expect you to mention.',
    ],
    practicePrompt:
      'Pick one common prompt and write its requirements, core entities, APIs, high-level design, and top three bottlenecks.',
  },
];

function UnderConstruction({ topic }: LearnProps) {
  return (
    <div className="min-h-screen bg-surface-900">
      <AppNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <section className="bg-gradient-to-br from-brand-900/40 to-surface-800 rounded-2xl border border-brand-500/20 p-8 sm:p-12 min-h-[420px] flex items-center justify-center text-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-5">
              Learn {topic}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{topic} Learning Page</h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              This page is under construction.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function ChapterCard({
  chapter,
  onPrevious,
  onNext,
}: {
  chapter: Chapter;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <article id={`chapter-${chapter.number}`} className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
      <div className="px-5 sm:px-6 py-5 border-b border-surface-600 bg-surface-750/50">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-300 flex items-center justify-center text-sm font-bold shrink-0">
            {chapter.number}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium mb-1">Chapter {chapter.number}</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{chapter.title}</h2>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{chapter.summary}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section>
            <h3 className="text-sm font-semibold text-white mb-3">Core Concepts</h3>
            <ul className="space-y-2.5">
              {chapter.keyIdeas.map((idea) => (
                <li key={idea} className="flex gap-2.5 text-sm text-gray-400 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-white mb-3">How To Use This In Interviews</h3>
            <ul className="space-y-2.5">
              {chapter.interviewMoves.map((move) => (
                <li key={move} className="flex gap-2.5 text-sm text-gray-400 leading-relaxed">
                  <span className="mt-1.5 text-brand-300 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>{move}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-4">
          <p className="text-xs font-semibold text-brand-300 mb-1">Practice Prompt</p>
          <p className="text-sm text-gray-300 leading-relaxed">{chapter.practicePrompt}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <button
            onClick={onPrevious}
            disabled={chapter.number === 1}
            className="px-4 py-2 rounded-xl border border-surface-600 text-sm font-medium text-gray-300 hover:text-white hover:bg-surface-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous Chapter
          </button>
          <button
            onClick={onNext}
            disabled={chapter.number === hldChapters.length}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Chapter
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Learn({ topic }: LearnProps) {
  const [selectedChapterNumber, setSelectedChapterNumber] = useState(1);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const selectedChapter = hldChapters.find((chapter) => chapter.number === selectedChapterNumber) ?? hldChapters[0];

  const selectChapter = (chapterNumber: number) => {
    setSelectedChapterNumber(chapterNumber);
    window.requestAnimationFrame(() => {
      readerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const selectRelativeChapter = (direction: -1 | 1) => {
    const nextChapter = Math.min(hldChapters.length, Math.max(1, selectedChapterNumber + direction));
    if (nextChapter !== selectedChapterNumber) {
      selectChapter(nextChapter);
    }
  };

  if (topic === 'LLD') {
    return <UnderConstruction topic={topic} />;
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <AppNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <section className="bg-gradient-to-br from-brand-900/40 to-surface-800 rounded-2xl border border-brand-500/20 p-5 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="max-w-2xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-4">
                Learn HLD
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">High Level Design Foundations</h1>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                A structured starting path for system design fundamentals, from interview preparation and delivery to core concepts, technologies, patterns, and question breakdowns.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <div className="rounded-xl bg-surface-800/80 border border-surface-600 px-4 py-3 text-center">
                <p className="text-xl font-bold text-white">9</p>
                <p className="text-xs text-gray-500">Chapters</p>
              </div>
              <div className="rounded-xl bg-surface-800/80 border border-surface-600 px-4 py-3 text-center">
                <p className="text-xl font-bold text-white">45</p>
                <p className="text-xs text-gray-500">Concepts</p>
              </div>
              <div className="rounded-xl bg-surface-800/80 border border-surface-600 px-4 py-3 text-center">
                <p className="text-xl font-bold text-white">9</p>
                <p className="text-xs text-gray-500">Prompts</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="lg:sticky lg:top-6 lg:self-start bg-surface-800 rounded-2xl border border-surface-600 p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Chapters</h2>
            <nav className="space-y-1">
              {hldChapters.map((chapter) => (
                <button
                  key={chapter.number}
                  onClick={() => selectChapter(chapter.number)}
                  className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    chapter.number === selectedChapterNumber
                      ? 'bg-brand-500/10 text-white border border-brand-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-surface-700 border border-transparent'
                  }`}
                >
                  <span className="text-brand-300 font-semibold">{chapter.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug">{chapter.title}</span>
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          <div ref={readerRef}>
            <ChapterCard
              key={selectedChapter.number}
              chapter={selectedChapter}
              onPrevious={() => selectRelativeChapter(-1)}
              onNext={() => selectRelativeChapter(1)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
