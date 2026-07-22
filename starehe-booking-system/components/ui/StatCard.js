import clsx from 'clsx';

export default function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-navy-50 text-navy-600',
    pending: 'bg-amber-50 text-status-pending',
    approved: 'bg-green-50 text-status-approved',
    rejected: 'bg-red-50 text-status-rejected',
  };

  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1.5 text-sm text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
