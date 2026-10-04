'use client';

import { useState } from 'react';
import { LuDownload, LuLoaderCircle } from 'react-icons/lu';

export default function DownloadApprovedPdf({ bookingId }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/pdf/download?bookingId=${encodeURIComponent(bookingId)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not access the PDF.'
        );
      }

      window.open(
        data.url,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      console.error('PDF download error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="mt-3 inline-flex items-center rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <LuLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Preparing PDF...
        </>
      ) : (
        <>
          <LuDownload className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </button>
  );
}