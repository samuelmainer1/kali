import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthDialog';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  function onSuccess(nextUser) {
    const next = params.get('next');
    const dest =
      next ||
      location.state?.from ||
      (nextUser.role === 'vendor' || nextUser.role === 'admin' ? '/dashboard' : '/account');
    navigate(dest);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold text-center text-gray-900">
            {user ? 'My Account' : 'Welcome to BigDrop'}
          </h1>
        </div>
        <AuthCard defaultTab="login" asPage onSuccess={onSuccess} />
      </div>
      {!user && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Prefer not to? You can still{' '}
          <Link to="/checkout" className="font-semibold text-orange-600">
            checkout as a guest
          </Link>
          .
        </p>
      )}
    </div>
  );
}
