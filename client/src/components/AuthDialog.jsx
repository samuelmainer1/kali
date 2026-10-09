import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Store, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useLang } from '../context/LangContext';
import { api } from '../lib/api';
import RequiredMark from './RequiredMark';

function Field({ id, label, hint, required = false, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-800">
        {label}
        {required ? <RequiredMark /> : null}
        {hint ? <span className="ml-1 text-xs font-normal text-gray-400">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-60';

export function AuthCard({ defaultTab = 'login', defaultRole = 'customer', asPage = false, onSuccess, onLogout }) {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [tab, setTab] = useState(defaultTab);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState(defaultRole === 'vendor' ? 'vendor' : 'customer');
  const [storeName, setStoreName] = useState('');
  const [businessNote, setBusinessNote] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    setRegRole(defaultRole === 'vendor' ? 'vendor' : 'customer');
  }, [defaultRole]);

  function afterAuth(nextUser) {
    if (onSuccess) {
      onSuccess(nextUser);
      return;
    }
    if (asPage) {
      const dest = nextUser.role === 'vendor' || nextUser.role === 'admin' ? '/dashboard' : '/account';
      navigate(dest);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all fields');
      return;
    }
    setLoginLoading(true);
    try {
      const nextUser = await login(loginEmail.trim(), loginPassword);
      setLoginEmail('');
      setLoginPassword('');
      afterAuth(nextUser);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegisterError('');
    if (!regName || !regEmail || !regPassword) {
      setRegisterError('Please fill in all required fields');
      return;
    }
    if (regRole === 'vendor' && !storeName.trim()) {
      setRegisterError('Store name is required to sell on BigDrop');
      return;
    }
    setRegisterLoading(true);
    try {
      const nextUser = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        role: regRole,
        storeName: storeName.trim(),
        businessNote: businessNote.trim(),
      });
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setStoreName('');
      setBusinessNote('');
      afterAuth(nextUser);
    } catch (err) {
      setRegisterError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    if (!forgotEmail.trim()) {
      setForgotError('Email is required');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot', { email: forgotEmail.trim() });
      setForgotMsg(res.message || 'If that email is registered, we sent a reset link.');
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  }

  function handleLogout() {
    logout();
    if (asPage) navigate('/');
    if (onLogout) onLogout();
  }

  if (user) {
    const dest = user.role === 'vendor' || user.role === 'admin' ? '/dashboard' : '/account';
    return (
      <div className="px-6 pb-6 space-y-5">
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            {user.role === 'vendor' ? (
              <Store className="h-8 w-8 text-orange-600" />
            ) : (
              <User className="h-8 w-8 text-orange-600" />
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {user.phone ? (
            <div className="flex justify-between px-1">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-800">{user.phone}</span>
            </div>
          ) : null}
          <div className="flex justify-between px-1">
            <span className="text-gray-500">Role</span>
            <span className="font-medium text-gray-800 capitalize">{user.role}</span>
          </div>
          {user.storeName ? (
            <div className="flex justify-between px-1">
              <span className="text-gray-500">Store</span>
              <span className="font-medium text-gray-800">{user.storeName}</span>
            </div>
          ) : null}
          {user.role === 'vendor' && user.status && user.status !== 'approved' ? (
            <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Your vendor application is {user.status}. You can log in, but listings go live after admin approval.
            </p>
          ) : null}
        </div>
        <Link
          to={dest}
          className="flex h-10 w-full items-center justify-center rounded-md bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600"
        >
          {user.role === 'vendor' || user.role === 'admin' ? 'Go to dashboard' : 'My orders'}
        </Link>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {[
          ['login', t('login')],
          ['register', t('register')],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-3 text-sm font-semibold ${
              tab === id ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        showForgot ? (
          <form onSubmit={handleForgot} className="p-6 pt-4 space-y-4">
            <p className="text-sm text-gray-600">Enter your account email. We will send a reset link if it is registered.</p>
            {forgotError ? (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{forgotError}</div>
            ) : null}
            {forgotMsg ? (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">{forgotMsg}</div>
            ) : null}
            <Field id="forgot-email" label={t('email')} required>
              <input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
                className={inputClass}
              />
            </Field>
            <button
              type="submit"
              disabled={forgotLoading}
              className="flex h-10 w-full items-center justify-center rounded-md bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {forgotLoading ? 'Sending…' : 'Send reset link'}
            </button>
            <button type="button" onClick={() => setShowForgot(false)} className="w-full text-xs font-semibold text-gray-500 hover:underline">
              Back to login
            </button>
          </form>
        ) : (
        <form onSubmit={handleLogin} className="p-6 pt-4 space-y-4">
          {loginError ? (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loginError}</div>
          ) : null}
          <Field id="login-email" label={t('email')} required>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              disabled={loginLoading}
              required
              className={inputClass}
            />
          </Field>
          <Field id="login-password" label={t('password')} required>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={loginLoading}
              required
              className={inputClass}
            />
          </Field>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForgot(true);
                setForgotEmail(loginEmail);
                setForgotMsg('');
                setForgotError('');
              }}
              className="text-xs font-semibold text-orange-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="flex h-10 w-full items-center justify-center rounded-md bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {loginLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              t('login')
            )}
          </button>
        </form>
        )
      ) : (
        <form onSubmit={handleRegister} className="p-6 pt-4 space-y-4">
          {registerError ? (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{registerError}</div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {[
              ['customer', 'Shop as customer'],
              ['vendor', 'Sell on BigDrop'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRegRole(id)}
                className={`rounded-md border px-2 py-2 text-xs font-semibold ${
                  regRole === id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {regRole === 'vendor' ? (
            <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Vendor stores need admin approval before you can list products — usually within one business day.
            </p>
          ) : null}
          <Field id="reg-name" label="Full Name" required>
            <input
              id="reg-name"
              placeholder="Jane Wanjiku"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              disabled={registerLoading}
              required
              className={inputClass}
            />
          </Field>
          {regRole === 'vendor' ? (
            <>
              <Field id="reg-store" label="Store name" required>
                <input
                  id="reg-store"
                  placeholder="Nairobi Beauty Co."
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  disabled={registerLoading}
                  required
                  className={inputClass}
                />
              </Field>
              <Field id="reg-note" label="About your business" hint="(optional)">
                <textarea
                  id="reg-note"
                  rows={2}
                  placeholder="What do you sell?"
                  value={businessNote}
                  onChange={(e) => setBusinessNote(e.target.value)}
                  disabled={registerLoading}
                  className={`${inputClass} h-auto py-2`}
                />
              </Field>
            </>
          ) : null}
          <Field id="reg-email" label="Email" required>
            <input
              id="reg-email"
              type="email"
              placeholder="you@email.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              disabled={registerLoading}
              required
              className={inputClass}
            />
          </Field>
          <Field id="reg-phone" label="Phone Number" hint="(optional)">
            <input
              id="reg-phone"
              placeholder="+254 7XX XXX XXX"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              disabled={registerLoading}
              className={inputClass}
            />
          </Field>
          <Field id="reg-password" label="Password" required>
            <input
              id="reg-password"
              type="password"
              placeholder="Create a password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              disabled={registerLoading}
              minLength={6}
              required
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            disabled={registerLoading}
            className="flex h-10 w-full items-center justify-center rounded-md bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {registerLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : regRole === 'vendor' ? (
              'Apply to sell'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AuthDialog() {
  const { user } = useAuth();
  const { authOpen, closeAuth, authTab } = useUI();

  useEffect(() => {
    if (!authOpen) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') closeAuth();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [authOpen, closeAuth]);

  if (!authOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={closeAuth} />
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl">
        <button
          type="button"
          onClick={closeAuth}
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold text-center text-gray-900">{user ? 'My Account' : 'Welcome to BigDrop'}</h2>
        </div>
        <AuthCard defaultTab={authTab} onLogout={closeAuth} />
      </div>
    </div>
  );
}
