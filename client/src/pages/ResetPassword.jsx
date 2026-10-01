import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset', { token, password });
      setMsg(res.message || 'Password updated. You can log in now.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Reset password</h1>
        <p className="mt-3 text-sm text-gray-600">This reset link is missing. Request a new one from the login page.</p>
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-orange-600">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-bold text-center">Choose a new password</h1>
      {error ? <p className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {msg ? (
        <div className="mt-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {msg}{' '}
          <Link to="/login" className="font-semibold text-orange-600">
            Log in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
          <label className="block text-sm">
            <span className="font-medium">New password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Confirm password</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-md bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}
