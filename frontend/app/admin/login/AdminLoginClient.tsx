"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Shield } from 'lucide-react';

export default function AdminLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If NextAuth redirected back with an error query param, show it inline
    const err = searchParams.get('error');
    if (err) {
      // Map known NextAuth errors to friendly messages
      if (err === 'AccessDenied') setError("Access denied: your email isn't authorized for admin access.");
      else if (err === 'Verification') setError('Verification failed. The link may be invalid or expired.');
      else setError(`Authentication error: ${err}`);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      // Do a client-side signIn and prevent automatic navigation so we can show inline errors
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/add-question',
      });

      // next-auth returns an object with `error` when redirect:false is used
      if (result?.error) {
        // show friendly message for AccessDenied
        if (result.error === 'AccessDenied') {
          setError("Access denied: your email isn't authorized for admin access.");
        } else {
          setError('Authentication failed. Please try again.');
        }
        return;
      }

      // If no error and a URL was returned, navigate to it (user is authorized)
      if ((result as any)?.url) {
        router.push((result as any).url);
      }
    } catch (e) {
      setError('An unexpected error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#df7500] to-[#651321] rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#651321] mb-1">Admin Login</h1>
          <p className="text-gray-600">Sign in with your Google account to access the admin panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all duration-150 disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-spin inline-block h-4 w-4 border-b-2 border-gray-700 rounded-full" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <div className="text-center text-xs text-gray-500">
              Only authorized admin accounts can access this portal.
            </div>
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => router.push('/')} className="text-[#651321] hover:text-[#df7500] font-medium">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
