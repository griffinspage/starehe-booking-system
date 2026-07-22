'use client';

export default function Checkbox({ label, id, ...props }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm text-ink hover:bg-surface-muted">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-border text-navy-500 focus:ring-navy-300"
        {...props}
      />
      {label}
    </label>
  );
}
