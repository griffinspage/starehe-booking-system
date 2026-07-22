'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuUsers, LuUserPlus, LuTrash2 } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const ROLE_OPTIONS = [
  { value: 'club_patron', label: 'Club Patron' },
  { value: 'sm1', label: 'Senior Master 1' },
  { value: 'sm2', label: 'Senior Master 2' },
  { value: 'sm3', label: 'Senior Master 3' },
  { value: 'sm4', label: 'Senior Master 4' },
  { value: 'welfare_head', label: 'Head of Student Welfare' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

function generatePassword() {
  // Simple readable temp password: e.g. "Starehe-7f2k9c"
  return `Starehe-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'sm1', password: generatePassword() });
  const [lastCreated, setLastCreated] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not load users.');
        return;
      }
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error('Enter an email address.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Could not create the account.');
        return;
      }

      setUsers((prev) => [data.user, ...prev]);
      setLastCreated({ email: form.email, password: form.password, role: form.role });
      setForm({ email: '', fullName: '', role: 'sm1', password: generatePassword() });
      toast.success('Account created — share the temporary password with them securely.');
    } catch (err) {
      console.error(err);
      toast.error('Network error.');
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(id, role) {
    const previous = users;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));

    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Could not update the role.');
      setUsers(previous); // revert on failure
      return;
    }

    toast.success('Role updated — they now have access to their queue immediately.');
  }

  async function deleteUser(id) {
    if (!confirm('Remove this account permanently? This cannot be undone.')) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || 'Could not delete the account.');
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success('Account removed.');
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5">
        <LuUsers className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Manage Users</h1>
          <p className="text-sm text-ink-muted">
            Create approver accounts and assign roles — no Supabase table editing required.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Create an Account</h2>
        <p className="mb-4 text-xs text-ink-faint">
          Use this to set up Senior Masters, the Head of Student Welfare, or another admin. They&apos;ll be able to
          log in immediately with the temporary password shown after creation — have them change it from their
          Profile page afterward.
        </p>
        <form onSubmit={createUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            placeholder="e.g. Mr. Otieno"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
          <Input
            type="email"
            label="Email"
            placeholder="staff@starehe.ac.ke"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Select label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {ROLE_OPTIONS.filter((r) => r.value !== 'club_patron').map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
          <Input
            label="Temporary Password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            hint="Auto-generated — feel free to edit it."
          />
          <div className="sm:col-span-2">
            <Button type="submit" icon={LuUserPlus} loading={creating}>
              Create Account
            </Button>
          </div>
        </form>

        {lastCreated && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
            <p className="font-medium text-status-approved">Account ready — share these credentials securely:</p>
            <p className="mt-1 font-mono text-xs text-ink">
              {lastCreated.email} · {lastCreated.password} · {ROLE_LABELS[lastCreated.role]}
            </p>
          </div>
        )}
      </Card>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="rounded-lg border border-border bg-white px-2 py-1 text-xs"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteUser(u.id)} className="text-ink-faint hover:text-status-rejected">
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-faint">No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}