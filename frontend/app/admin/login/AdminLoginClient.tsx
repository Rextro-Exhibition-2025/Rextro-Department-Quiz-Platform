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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#df7500] to-[#651321] rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#651321] mb-1">Admin Login</h1>
          <p className="text-gray-600">Sign in with your Google account to access the admin panel</p>
        </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            
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
