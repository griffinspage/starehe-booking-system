'use client';

import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, hint, id, className, ...props }, ref) {
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <input id={id} ref={ref} className={`input-field ${className || ''}`} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

export default Input;
