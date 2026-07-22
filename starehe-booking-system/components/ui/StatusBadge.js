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
  cancelled: 'badge bg-surface-muted text-ink-faint',
};

export default function StatusBadge({ status }) {
  return <span className={CLASSES[status] || 'badge bg-surface-muted text-ink-faint'}>{LABELS[status] || status}</span>;
}
