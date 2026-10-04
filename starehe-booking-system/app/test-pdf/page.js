'use client';

import { useState } from 'react';

export default function TestPdfPage() {
  const [status, setStatus] = useState('Ready');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const bookingId = 'a1c26f96-e98d-4c1a-8145-1211b5db5667';

  async function generatePdf() {
    setLoading(true);
    setStatus('Starting PDF generation...');
    setResult('');

    try {
      console.log('Starting PDF generation for:', bookingId);

      setStatus('Sending request to /api/pdf/generate...');

      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
  bookingId,
  sendEmail: false,
}),
      });

      console.log('Response received:', response.status);

      setStatus(
        `Server responded with HTTP ${response.status}`
      );

      // Read the response as text first.
      // This lets us see errors even if the server doesn't return JSON.
      const rawText = await response.text();

      console.log('Raw server response:', rawText);

      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        data = {
          rawResponse: rawText,
        };
      }

      setResult(
        JSON.stringify(data, null, 2)
      );

      if (!response.ok) {
        setStatus(
          `PDF generation failed — HTTP ${response.status}`
        );
        return;
      }

      setStatus('PDF generation completed successfully.');
    } catch (error) {
      console.error('Fetch error:', error);

      setStatus('Request failed before receiving a response.');

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
      <div className="mx-auto max-w-3xl">

        <div className="rounded-2xl bg-white p-6 shadow-lg">

          <h1 className="text-2xl font-bold text-slate-900">
            PDF Generation Diagnostic
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            This page tests PDF generation for the existing
            approved booking.
          </p>

          <div className="mt-5 rounded-lg bg-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Booking ID
            </p>

            <p className="mt-1 break-all font-mono text-sm text-slate-800">
              {bookingId}
            </p>
          </div>

          <button
            type="button"
            onClick={generatePdf}
            disabled={loading}
            className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Generating PDF...'
              : 'Generate PDF'}
          </button>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">
                {status}
              </p>
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
      </div>
    </main>
  );
}