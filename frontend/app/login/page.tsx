"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    email: '',
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { user, setUser } = useUser();
  const searchParams = useSearchParams();

  
  
  useEffect(() => {
    const err = searchParams?.get('error');
    if (err) {
      
      const map: Record<string, string> = {
        AccessDenied: "Google sign-in was denied or the account isn't linked. If you just registered, please sign in using the same Google account you used during registration; otherwise try signing in again.",
        OAuthSignin: 'OAuth sign-in failed. Please try again.',
        OAuthCallback: 'OAuth callback error. Please try again.',
        OAuthAccountNotLinked: 'This Google account is not linked to a student account. Please register first.',
      };
      setError(map[err] || 'Authentication failed. Please try again.');
    }
  }, [searchParams]);

  
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const res = await signIn('google', { callbackUrl: '/departments', redirect: false });

      
      if ((res as any)?.error) {
        setError('Google sign-in failed. Please try again.');
        return;
      }

      
      if ((res as any)?.url) {
        window.location.href = (res as any).url;
      }
    } catch (e: any) {
      console.error('Google sign-in error:', e);
      setError(e?.message || 'Google sign-in failed.');
    }
  };

  
  
  
  const handleRegisterThenGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const url = `${apiUrl.replace(/\/$/, '')}/auth/register`;
      const payload = { name: formData.name, studentId: formData.studentId, email: formData.email };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.status === 201) {
        
        await handleGoogleSignIn();
        return;
      }

      if (resp.status === 409) {
        
        setIsRegistering(false);
        setError('You already registered. Please Login.');
        return;
      }

      
      let body = null;
      try { body = await resp.json(); } catch (e) { /* ignore */ }
      setError(body?.message || `Registration failed: ${resp.statusText || resp.status}`);
    } catch (e: any) {
      console.error('Registration request error:', e);
      setError(e?.message || 'Registration request failed');
    } finally {
      setLoading(false);
    }
  };

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isRegistering) {
      
      if (!formData.email || !formData.password) {
        setError('Please provide email and password');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const url = `${apiUrl.replace(/\/$/, '')}/auth/login`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });

        const responseData = await res.json().catch(() => null);
        if (res.ok && responseData?.success) {
          
          const data = responseData.data;
          setUser({ name: data.name, authToken: undefined, number: data.number ?? 1 } as any);
          router.push('/departments');
          return;
        } else {
          setError(responseData?.message || res.statusText || 'Login failed');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.error('Login request failed:', err);
        setError(err?.message || 'Login request failed');
        setLoading(false);
        return;
      }
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

      const payload: any = { name: formData.name, studentId: formData.studentId, email: formData.email };
      if (formData.password) payload.password = formData.password;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let responseData: LoginFormResponse | null = null;
      try {
        responseData = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON response', parseErr);
      }
      if (res.ok && responseData?.success) {
        
        
        setIsRegistering(false);
        
        setFormData(prev => ({ ...prev, password: '', name: '', studentId: '' }));
        setError('Registration successful. Please sign in using the same Google account you used to register (use "Sign in with Google").');
      } else {
        setError(responseData?.message || res.statusText || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Network or fetch error:', err);
      
      setError(err?.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="min-h-screen p-4 relative flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #F4E8D0 0%, #FFF8E7 50%, #E8D5B5 100%)'
      }}
    >
      {/* Parchment texture overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        opacity: 0.2,
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Map grid */}
      <div className="absolute inset-0 map-grid" style={{ zIndex: 0 }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="parchment-card rounded-2xl shadow-2xl p-8 backdrop-blur-sm relative">
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-left" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration top-right" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration bottom-left" />
          <img src="/corner-decoration.svg" alt="" className="corner-decoration bottom-right" />
          {/* Login Icon and Heading */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg relative">
              <img src="/wax-seal.svg" alt="" className="w-full h-full" />
              <LogIn className="w-7 h-7 absolute" style={{ color: '#F4E8D0' }} />
            </div>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Cinzel, serif', color: '#651321', letterSpacing: '0.05em' }}>Scholar's Entry</h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="border-2 px-4 py-3 rounded-lg mb-6" style={{
              background: 'rgba(139, 0, 0, 0.1)',
              borderColor: '#8B0000',
              color: '#651321'
            }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode toggle */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm handwritten" style={{ color: '#4A3426' }}>{isRegistering ? 'Register a new scholar' : 'Scholar Login'}</div>
              <button
                type="button"
                onClick={() => setIsRegistering(prev => !prev)}
                className="text-sm font-medium"
                style={{ color: '#651321', fontFamily: 'Cinzel, serif', letterSpacing: '0.02em' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#DF7500'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#651321'}
              >
                {isRegistering ? 'Switch to Login' : 'Switch to Register'}
              </button>
            </div>

            {isRegistering ? (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#2C1810', letterSpacing: '0.03em' }}>Full Name</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: '#704214',
                      backgroundColor: 'rgba(255, 248, 231, 0.5)',
                      color: '#2C1810',
                      fontFamily: 'Crimson Text, serif'
                    }}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#2C1810', letterSpacing: '0.03em' }}>Gmail</label>
                  <p className="text-xs mb-1 handwritten" style={{ color: '#4A3426' }}>Use a working Gmail address.</p>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: '#704214',
                      backgroundColor: 'rgba(255, 248, 231, 0.5)',
                      color: '#2C1810',
                      fontFamily: 'Crimson Text, serif'
                    }}
                    placeholder="Enter your Gmail address"
                    required
                  />
                  </div>

                <div>
                  <label htmlFor="studentId" className="block text-sm font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#2C1810', letterSpacing: '0.03em' }}>Student ID</label>
                  <input
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: '#704214',
                      backgroundColor: 'rgba(255, 248, 231, 0.5)',
                      color: '#2C1810',
                      fontFamily: 'Crimson Text, serif'
                    }}
                    placeholder="Enter student ID"
                    required
                  />
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleRegisterThenGoogle}
                    disabled={loading}
                    className="ancient-button w-full py-3 px-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {loading ? 'Processing…' : 'Register'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full border-2 py-3 my-5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all"
                    style={{
                      borderColor: '#704214',
                      backgroundColor: 'rgba(244, 232, 208, 0.5)',
                      color: '#651321',
                      fontFamily: 'Cinzel, serif',
                      letterSpacing: '0.03em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(232, 213, 181, 0.7)';
                      e.currentTarget.style.borderColor = '#C9A961';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(244, 232, 208, 0.5)';
                      e.currentTarget.style.borderColor = '#704214';
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              </>
            )}
            
          </form>

          {/* Back to Home */}
          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => router.push('/')}
              className="font-bold transition-colors block w-full cursor-pointer"
              style={{ 
                color: '#651321',
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.03em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#DF7500'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#651321'}
            >
              Return to Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
