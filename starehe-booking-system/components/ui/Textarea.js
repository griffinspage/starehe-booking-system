'use client';

import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({ label, error, id, rows = 4, ...props }, ref) {
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <textarea id={id} ref={ref} rows={rows} className="input-field resize-none" {...props} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

export default Textarea;
