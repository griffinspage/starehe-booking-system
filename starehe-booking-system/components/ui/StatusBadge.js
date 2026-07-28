import { LuClock, LuCircleCheck, LuCircleX, LuCheckCheck } from 'react-icons/lu';

const LABELS = {
  pending: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const CLASSES = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  completed: 'badge-approved',
  cancelled: 'badge bg-slate-100 text-slate-600 border-slate-200',
};

const ICONS = {
  pending: LuClock,
  approved: LuCircleCheck,
  rejected: LuCircleX,
  completed: LuCheckCheck,
  cancelled: LuCircleX,
};

export default function StatusBadge({ status }) {
  const Icon = ICONS[status];
  return (
    <span className={CLASSES[status] || 'badge bg-slate-100 text-slate-600 border-slate-200'}>
      {Icon && <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />}
      {LABELS[status] || status}
    </span>
  );
}
