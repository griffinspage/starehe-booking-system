'use client';

import clsx from 'clsx';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  icon: Icon,
  className,
  ...props
}) {
  return (
    <button className={clsx(VARIANTS[variant], className)} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  );
}
