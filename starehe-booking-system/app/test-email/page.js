'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [status, setStatus] = useState('Ready');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const bookingId = 'a1c26f96-e98d-4c1a-8145-1211b5db5667';

  async function sendEmail() {
    setLoading(true);
    setStatus('Sending approval email...');
    setResult('');

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          pdfPath:
            'a1c26f96-e98d-4c1a-8145-1211b5db5667/approved-function.pdf',
        }),
      });

      const rawText = await response.text();

      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        data = {
          rawResponse: rawText,
        };
      }

      setResult(JSON.stringify(data, null, 2));

      if (!response.ok) {
        setStatus(
          `Email failed — HTTP ${response.status}`
        );
        return;
      }

      setStatus('Email request completed successfully.');
    } catch (error) {
      console.error('Email test error:', error);

      setStatus('Request failed.');

      setResult(
        JSON.stringify(
          {
            error: error.message,
            name: error.name,
            stack: error.stack,
          },
          null,
          2
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 sm:p-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-lg">

        <h1 className="text-2xl font-bold text-slate-900">
          Email Diagnostic
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          This tests the Function Approved email for an
          existing approved booking.
        </p>

        <div className="mt-5 rounded-lg bg-slate-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Booking ID
          </p>

          <p className="mt-1 break-all font-mono text-sm">
            {bookingId}
          </p>
        </div>

        <button
          type="button"
          onClick={sendEmail}
          disabled={loading}
          className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Test Approval Email'}
        </button>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </p>

          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            {status}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Server Response
          </p>

          <pre className="mt-2 min-h-32 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-green-400">
            {result || 'No response yet.'}
          </pre>
        </div>

      </div>
    </main>
  );
}