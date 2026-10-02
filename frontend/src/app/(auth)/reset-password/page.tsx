'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Extract token from URL (better-auth passes token as query parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token') || urlParams.get('token_hash');
    if (tokenParam) {
        setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }
    if (!token && !window.location.search.includes('token')) {
        setError('Invalid or missing reset token.');
        return;
    }

    setLoading(true);
    setError('');
    
    let err = null;
    try {
        const method = (authClient as any).resetPassword;
        const { data, error } = await method({
            newPassword: password,
            token: token
        });
        err = error;
    } catch (e: any) {
        err = e;
    }

    setLoading(false);

    if (err) {
        setError(err.message || 'An error occurred. Please try again.');
    } else {
        setSuccess(true);
        setTimeout(() => {
            router.push('/login');
        }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Reset Password</h2>
        
        {success ? (
            <div className="text-center">
                <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                    Your password has been successfully reset. Redirecting to login...
                </div>
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    Click here if not redirected
                </Link>
            </div>
        ) : (
            <>
                <p className="text-sm text-gray-600 text-center mb-6">
                    Enter your new password below.
                </p>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input 
                      type="password" 
                      required 
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      required 
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
            </>
        )}
      </div>
    </div>
  );
}
