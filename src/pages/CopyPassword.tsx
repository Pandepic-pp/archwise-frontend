import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function CopyPassword() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'copying' | 'copied' | 'error'>('copying');

  useEffect(() => {
    const raw = params.get('p');
    if (!raw) { setState('error'); return; }
    try {
      const decoded = atob(raw);
      navigator.clipboard.writeText(decoded)
        .then(() => {
          setState('copied');
          // Close the tab after a short moment — feels like a native copy action
          setTimeout(() => window.close(), 1200);
        })
        .catch(() => setState('error'));
    } catch {
      setState('error');
    }
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, background: '#0d1018', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {state === 'copying' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: '#9ca3af', fontFamily: 'system-ui, sans-serif', fontSize: 14, margin: 0 }}>Copying…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {state === 'copied' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#14532d22', border: '1px solid #16a34a55', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p style={{ color: '#f9fafb', fontFamily: 'system-ui, sans-serif', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Copied to clipboard</p>
          <p style={{ color: '#6b7280', fontFamily: 'system-ui, sans-serif', fontSize: 13, margin: 0 }}>This tab will close automatically</p>
        </div>
      )}

      {state === 'error' && (
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#7f1d1d22', border: '1px solid #dc262655', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p style={{ color: '#f9fafb', fontFamily: 'system-ui, sans-serif', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>Couldn't copy</p>
          <p style={{ color: '#6b7280', fontFamily: 'system-ui, sans-serif', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Check your email for the password and copy it manually.
          </p>
        </div>
      )}
    </div>
  );
}
