"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogIn } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { signIn } from 'next-auth/react';

interface LoginFormResponse {
  success: boolean;
  data: {
    name: string;
    authToken: string;
    number: number;
  };
  message?: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Removed session state
  const router = useRouter();
  const { user, setUser } = useUser();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isRegistering) {
      setLoading(false);
      signIn('google', { callbackUrl: '/quiz' });
      return;
    }

    if (!formData.name || !formData.studentId || !formData.email) {
      setError('Please provide name, email and student ID');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const url = `${apiUrl.replace(/\/$/, '')}/auth/register`;
      console.log('Register POST ->', url, { name: formData.name, studentId: formData.studentId, email: formData.email });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, studentId: formData.studentId, email: formData.email })
      });

      let responseData: LoginFormResponse | null = null;
      try {
        responseData = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON response', parseErr);
      }
      if (res.ok && responseData?.success) {
        const data = responseData.data;
        // Persist auth token only.
        localStorage.setItem('authToken', data.authToken);
        // Normalize and set user context — use `name` per updated User model.
        setUser({
          name: formData.name,
          authToken: data.authToken,
          number: data.number ?? 1
        } as any);
        router.push('/quiz');
      } else {
        setError(responseData?.message || res.statusText || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Network or fetch error:', err);
      // If the browser/extension blocked the request, err.message may be generic — show it.
      setError(err?.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="min-h-screen bg-gradient-to-br p-4 relative flex items-center justify-center"
      style={{
        backgroundImage: 'url("/Container.png")',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      {/* Background overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(255,255,255,0.7)',
        zIndex: 1
      }} />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="absolute w-96 h-96 bg-[#df7500]/10 rounded-full blur-3xl animate-pulse top-1/4 left-1/4" />
        <div className="absolute w-64 h-64 bg-[#651321]/10 rounded-full blur-2xl animate-bounce top-3/4 right-1/4"
          style={{ animationDuration: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Login Icon and Heading */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#df7500] to-[#651321] flex items-center justify-center mb-3 shadow-lg">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#651321] mb-1">Student Login</h2>
            <p className="text-sm text-[#651321] opacity-80">Enter your credentials to start the quiz</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode toggle */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">{isRegistering ? 'Register a new student' : 'Student Login'}</div>
              <button
                type="button"
                onClick={() => setIsRegistering(prev => !prev)}
                className="text-sm text-[#651321] hover:text-[#df7500] font-medium"
              >
                {isRegistering ? 'Switch to Login' : 'Switch to Register'}
              </button>
            </div>

            {isRegistering ? (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#df7500] focus:border-transparent text-[#651321]"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#df7500] focus:border-transparent text-[#651321]"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                  <input
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#df7500] focus:border-transparent text-[#651321]"
                    placeholder="Enter student ID"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Use Google to sign in</p>
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/quiz' })}
                  className="w-full border border-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 bg-white text-[#651321] hover:bg-gray-50"
                >
                  <img src="/google-logo.svg" alt="Google" className="h-5 w-5" />
                  Continue with Google
                </button>
              </div>
            )}

            {/* Submit Button (only for registration) */}
            {isRegistering && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#df7500] to-[#651321] text-white py-3 px-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:shadow-lg hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Register and start quiz
                  </>
                )}
              </button>
            )}
          </form>

          {/* Back to Home */}
          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => router.push('/')}
              className="text-[#651321] hover:text-[#df7500] font-medium transition-colors block w-full cursor-pointer"
            >
              Back to Home
            </button>
            {/* <div className="text-gray-400">•</div>
            <button
              onClick={() => router.push('/admin/login')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Login</span>
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
