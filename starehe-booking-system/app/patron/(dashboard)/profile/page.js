'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { LuUserRound, LuCamera, LuLock } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [clubName, setClubName] = useState('');
  const [patronName, setPatronName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setEmail(user.email);

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    const { data: patron } = await supabase.from('club_patrons').select('*').eq('id', user.id).single();

    if (profile) {
      setClubName(profile.club_name || '');
      setAvatarUrl(profile.avatar_url || null);
    }
    if (patron) {
      setPatronName(patron.patron_name || '');
      setPhoneNumber(patron.phone_number || '');
    }

    setLoading(false);
  }

  async function saveDetails() {
    setSaving(true);
    const supabase = createClient();

    try {
      const { error: usersError } = await supabase
        .from('users')
        .update({ club_name: clubName, full_name: patronName || clubName })
        .eq('id', userId);
      if (usersError) throw usersError;

      const { error: patronError } = await supabase
        .from('club_patrons')
        .update({ club_name: clubName, patron_name: patronName, phone_number: phoneNumber })
        .eq('id', userId);
      if (patronError) throw patronError;

      toast.success('Profile updated.');
    } catch (err) {
      console.error(err);
      toast.error('Could not save your details.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const supabase = createClient();

    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${publicUrlData.publicUrl}?t=${Date.now()}`; // cache-bust so the new image shows immediately

      const { error: updateError } = await supabase.from('users').update({ avatar_url: url }).eq('id', userId);
      if (updateError) throw updateError;

      setAvatarUrl(url);
      toast.success('Profile picture updated.');
    } catch (err) {
      console.error(err);
      toast.error('Could not upload the image.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password changed.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Could not change your password.');
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-2.5">
        <LuUserRound className="h-5 w-5 text-navy-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Profile</h1>
          <p className="text-sm text-ink-muted">Update your club details and account settings.</p>
        </div>
      </div>

      <Card className="mb-5 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-navy-50">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profile picture" fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-navy-400">
              <LuUserRound className="h-7 w-7" />
            </div>
          )}
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <Button
            variant="secondary"
            icon={LuCamera}
            loading={uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
          >
            Change Photo
          </Button>
          <p className="mt-1.5 text-xs text-ink-faint">JPG or PNG, up to a few MB.</p>
        </div>
      </Card>

      <Card className="mb-5 space-y-5">
        <Input id="clubName" label="Club Name" value={clubName} onChange={(e) => setClubName(e.target.value)} />
        <Input id="patronName" label="Patron Name" value={patronName} onChange={(e) => setPatronName(e.target.value)} />
        <Input id="phoneNumber" label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        <Input id="email" label="Email" value={email} disabled hint="Contact the office to change your registered email." />

        <Button loading={saving} onClick={saveDetails}>
          Update Details
        </Button>
      </Card>

      <Card className="space-y-5">
        <div className="flex items-center gap-2">
          <LuLock className="h-4 w-4 text-navy-600" />
          <h2 className="text-sm font-semibold text-ink">Change Password</h2>
        </div>
        <Input
          id="newPassword"
          type="password"
          label="New Password"
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          id="confirmPassword"
          type="password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button loading={changingPassword} onClick={changePassword}>
          Update Password
        </Button>
      </Card>
    </div>
  );
}