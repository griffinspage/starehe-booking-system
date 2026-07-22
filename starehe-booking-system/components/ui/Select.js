'use client';

import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, id, children, ...props }, ref) {
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <select id={id} ref={ref} className="input-field" {...props}>
        {children}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

export default Select;
