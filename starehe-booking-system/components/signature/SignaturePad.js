'use client';

import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { LuEraser } from 'react-icons/lu';

/**
 * Digital signature pad. Use a ref to call:
 *   - isEmpty()   -> boolean
 *   - getBlob()   -> Promise<Blob|null> (PNG, ready to upload to Supabase Storage)
 *   - clear()     -> void
 */
const SignaturePad = forwardRef(function SignaturePad(props, ref) {
  const padRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useImperativeHandle(ref, () => ({
    isEmpty() {
      return padRef.current?.isEmpty() ?? true;
    },
    async getBlob() {
      if (!padRef.current || padRef.current.isEmpty()) return null;
      const dataUrl = padRef.current.getTrimmedCanvas().toDataURL('image/png');
      const res = await fetch(dataUrl);
      return res.blob();
    },
    clear() {
      padRef.current?.clear();
      setIsEmpty(true);
    },
  }));

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <SignatureCanvas
          ref={padRef}
          penColor="#1c2530"
          canvasProps={{ className: 'h-40 w-full' }}
          onEnd={() => setIsEmpty(padRef.current?.isEmpty() ?? true)}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-ink-faint">
          {isEmpty ? 'Sign above using your mouse, stylus, or finger.' : 'Signature captured.'}
        </p>
        <button
          type="button"
          onClick={() => {
            padRef.current?.clear();
            setIsEmpty(true);
          }}
          className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-status-rejected"
        >
          <LuEraser className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
    </div>
  );
});

export default SignaturePad;