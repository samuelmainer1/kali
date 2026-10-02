import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthDialog';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultRole = params.get('role') === 'vendor' ? 'vendor' : 'customer';

  function onSuccess(nextUser) {
    const next = params.get('next');
    navigate(next || (nextUser.role === 'vendor' || nextUser.role === 'admin' ? '/dashboard' : '/shop'));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold text-center text-gray-900">
            {user ? 'My Account' : defaultRole === 'vendor' ? 'Sell on BigDrop' : 'Welcome to BigDrop'}
          </h1>
          {defaultRole === 'vendor' && !user ? (
            <p className="mt-1 text-center text-sm text-gray-500">Create a vendor account to list products.</p>
          ) : null}
        </div>
        <AuthCard defaultTab="register" defaultRole={defaultRole} asPage onSuccess={onSuccess} />
      </div>
      {!user && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-orange-600">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
