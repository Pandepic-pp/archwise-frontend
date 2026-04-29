import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionApi } from '../services/api';
import { InterviewSession, Question } from '../types';
import EvaluationPanel from '../components/Evaluation/Evaluation';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    sessionApi.get(id)
      .then(({ data }) => setSession(data.session))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading results…" />
      </div>
    );
  }

  if (!session?.evaluation) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No evaluation available yet.</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const question = typeof session.questionId === 'object' ? session.questionId as Question : null;

  return (
    <EvaluationPanel
      evaluation={session.evaluation}
      questionTitle={question?.title ?? 'System Design Interview'}
      durationSeconds={session.durationSeconds}
      onRetry={() => navigate('/')}
      onHome={() => navigate('/')}
    />
  );
}
