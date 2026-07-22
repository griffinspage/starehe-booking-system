import Sidebar from '@/components/layout/Sidebar';

export default function PatronLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
