import { useState } from 'react';
import { api } from '../lib/api';

export default function ChangePasswordForm({ className = '' }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/auth/password', { currentPassword, newPassword });
      setMsg(res.message || 'Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.message || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  }

  const field = 'mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5';

  return (
    <form onSubmit={onSubmit} className={`rounded-2xl border border-ink/5 bg-white p-6 shadow-lift space-y-3 max-w-xl ${className}`}>
      <h2 className="font-display text-xl font-bold">Change password</h2>
      <p className="text-xs text-ink-mute">Use this when you are already signed in. Forgot password is still on the login screen.</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-leaf">{msg}</p> : null}
      <label className="block text-sm">
        <span className="text-ink-mute">Current password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={field}
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink-mute">New password</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={field}
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink-mute">Confirm new password</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={field}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}
