import ApprovalTopBar from '@/components/layout/ApprovalTopBar';

export default function ApprovalsLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-muted">
      <ApprovalTopBar />
      <main className="mx-auto max-w-4xl px-5 py-8 lg:px-8">{children}</main>
    </div>
  );
}