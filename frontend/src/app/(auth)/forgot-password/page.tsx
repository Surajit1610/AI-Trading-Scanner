'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Using better-auth client
    let err = null;
    try {
        const method = (authClient as any).requestPasswordReset; 
        const { data, error } = await method({
            email,
            redirectTo: window.location.origin + '/reset-password',
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Forgot Password</h2>
        
        {success ? (
            <div className="text-center">
                <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                    If an account exists with that email, we have sent a password reset link.
                </div>
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    Return to Login
                </Link>
            </div>
        ) : (
            <>
                <p className="text-sm text-gray-600 text-center mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-600">
                  Remember your password? <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
                </div>
            </>
        )}
      </div>
    </div>
  );
}
