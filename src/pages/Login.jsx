import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('wandoor.papermart@gmail.com');
  const [password, setPassword] = useState('papermart123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Sign-in failed:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#358FFF] text-white flex items-center justify-center mb-3 shadow-xs">
            <Store size={26} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-[#222222]">
            Wandoor Paper Mart
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            School & Office Stationery Billing
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-semibold text-[#222222] mb-1">
            Sign In
          </h2>
          <p className="text-xs text-[#6B7280] mb-6">
            Enter your shop credentials to access billing
          </p>

          {error && (
            <Alert variant="error" className="mb-5" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shop@wandoorpaper.com"
              icon={Mail}
              required
              autoComplete="email"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In to Store
            </Button>
          </form>

          {/* Quick Staff Credentials Hint */}
          <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-center">
            <p className="text-[11px] text-[#6B7280]">
              Default Staff Login: <br />
              <span className="font-mono text-[#222222]">wandoor.papermart@gmail.com</span> / <span className="font-mono text-[#222222]">papermart123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
