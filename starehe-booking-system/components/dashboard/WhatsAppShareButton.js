'use client';

import { LuMessageCircle } from 'react-icons/lu';

/**
 * Opens WhatsApp's share intent with a message linking to the approved PDF.
 * Works on both mobile (opens the app) and desktop (opens WhatsApp Web).
 */
export default function WhatsAppShareButton({ functionName, pdfUrl }) {
  function share() {
    const text = `${functionName ? `"${functionName}" ` : ''}Approved function documents: ${pdfUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-muted"
    >
      <LuMessageCircle className="h-3.5 w-3.5" /> Share via WhatsApp
    </button>
  );
}