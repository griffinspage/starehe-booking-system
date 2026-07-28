import clsx from 'clsx';

export default function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-navy-50 text-navy-700 border-l-navy-600',
    pending: 'bg-amber-50 text-amber-700 border-l-amber-500',
    approved: 'bg-emerald-50 text-emerald-700 border-l-emerald-600',
    rejected: 'bg-rose-50 text-rose-700 border-l-rose-600',
  };

  const iconClasses = {
    default: 'bg-navy-100/80 text-navy-700',
    pending: 'bg-amber-100/80 text-amber-800',
    approved: 'bg-emerald-100/80 text-emerald-800',
    rejected: 'bg-rose-100/80 text-rose-800',
  };

  return (
    <div
      className={clsx(
        'card flex items-center gap-4.5 border-l-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        toneClasses[tone]
      )}
    >
      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm', iconClasses[tone])}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight leading-none text-ink">{value}</p>
        <p className="mt-1.5 text-xs font-medium text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
