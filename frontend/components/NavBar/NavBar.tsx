"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminMenu from "./AdminMenu";

// Dropdown for Admin Portal
import { useState, useRef, useEffect } from "react";
import { Shield, Menu, X } from "lucide-react";
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "", label: "Admin Portal" },
];

const NavBar = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="w-full border-b-2 relative" style={{ 
      background: 'linear-gradient(180deg, #F4E8D0 0%, #E8D5B5 100%)',
      borderColor: '#704214',
      boxShadow: '0 4px 6px rgba(44, 24, 16, 0.15)'
    }}>
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 opacity-30" style={{
        background: 'repeating-linear-gradient(90deg, #704214 0px, #704214 10px, transparent 10px, transparent 20px)'
      }} />
      
      <div className="flex items-center justify-between px-4 md:px-8 py-2">
        {/* Logo Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Image
            src="/t_Final logo_light_v.svg"
            alt="Faculty of Engineering Logo"
            width={80}
            height={40}
            className="md:w-[120px] md:h-[60px]"
            style={{ objectFit: "contain", filter: 'sepia(0.3) contrast(1.1)' }}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] md:text-xs font-semibold handwritten" style={{ color: '#C9A961' }}>
              25 Years of Innovation & Excellence
            </span>
            <span className="text-sm md:text-lg font-bold" style={{ 
              fontFamily: 'Cinzel, serif',
              color: '#651321'
            }}>
              Faculty of Engineering
            </span>
            <span className="text-xs md:text-sm" style={{ color: '#4A3426' }}>University of Ruhuna</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            if (link.label === "Admin Portal") {
              return (
                <div key={link.href} className="relative">
                    <AdminPortalDropdown session={session} mounted={mounted} />
                  </div>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-bold pb-1 transition-colors ${pathname === link.href
                  ? "border-b-2"
                  : "border-b-2 border-transparent"
                  }`}
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.95rem',
                  letterSpacing: '0.03em',
                  color: pathname === link.href ? '#651321' : '#4A3426',
                  borderColor: pathname === link.href ? '#C9A961' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== link.href) {
                    e.currentTarget.style.color = '#DF7500';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== link.href) {
                    e.currentTarget.style.color = '#4A3426';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
          {/* Sign in / out button for desktop (render only after mount to avoid hydration mismatch) */}
          <div className="hidden lg:flex items-center">
            {mounted && status === 'authenticated' ? (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="ml-2 px-4 py-2 rounded font-bold transition-all"
                style={{
                  fontFamily: 'Cinzel, serif',
                  background: 'linear-gradient(180deg, #651321 0%, #704214 100%)',
                  color: '#F4E8D0',
                  border: '2px solid #704214',
                  boxShadow: '0 2px 4px rgba(44, 24, 16, 0.3)',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, #DF7500 0%, #651321 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, #651321 0%, #704214 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 transition-colors"
          aria-label="Toggle menu"
          style={{ color: '#651321' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#DF7500'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#651321'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2" style={{ 
          borderColor: '#704214',
          background: 'linear-gradient(180deg, #E8D5B5 0%, #F4E8D0 100%)'
        }}>
          <div className="flex flex-col p-4 gap-4">
            {navLinks.map((link) => {
              if (link.label === "Admin Portal") {
                return (
                  <div key={link.href}>
                      <AdminPortalDropdown session={session} mobile={true} mounted={mounted} />
                    </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-bold py-2 pl-3 transition-colors ${pathname === link.href
                    ? "border-l-4"
                    : ""
                    }`}
                  style={{
                    fontFamily: 'Cinzel, serif',
                    color: pathname === link.href ? '#651321' : '#4A3426',
                    borderColor: pathname === link.href ? '#C9A961' : 'transparent'
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            {/* Mobile sign in / out */}
            <div className="pt-2">
              {mounted && status === 'authenticated' ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                  className="w-full text-left px-4 py-2 rounded font-bold transition-all"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    background: 'linear-gradient(180deg, #651321 0%, #704214 100%)',
                    color: '#F4E8D0',
                    border: '2px solid #704214',
                    letterSpacing: '0.05em'
                  }}
                >
                  Logout
                </button>
              ) : (
                  mounted ? (
                    ''
                  ) : null
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};


const AdminPortalDropdown = ({ session, mobile = false, mounted = false }: { session: any; mobile?: boolean; mounted?: boolean }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      // Mark this OAuth attempt as coming from the admin UI so the
      // server-side error redirect can send users back to `/admin-access`
      // instead of the global student `/login` page.
      try {
        document.cookie = `oauth_origin=admin; path=/; max-age=${60}`;
      } catch (e) {
        // ignore in non-browser contexts
      }
      const res = await signIn('google', { callbackUrl: '/admin/manage-questions', redirect: false });

      // If next-auth returned an error, go to admin login so AdminLoginClient
      // can show the inline error and allow retry.
      if ((res as any)?.error) {
        const code = encodeURIComponent((res as any).error || 'AccessDenied');
        // Send user to the admin login with the error code so AdminLoginClient
        // shows the inline message. Clear the origin cookie will be handled
        // server-side by the error redirect endpoint.
        router.push(`/admin-access?error=${code}`);
        return;
      }

      // If a URL was returned, navigate there (this sends user to provider)
      if ((res as any)?.url) {
        window.location.href = (res as any).url;
      }
    } catch (e) {
      console.error('NavBar Google sign-in failed:', e);
      router.push('/admin-access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className={`font-semibold text-gray-700 hover:text-[#a67c52] ${mobile ? 'py-2 pl-3' : 'border-b-2 border-transparent pb-1'} transition-colors flex items-center gap-2`}
        onClick={() => setOpen((v) => !v)}
      >
        <Shield className="w-5 h-5 text-[#df7500]" /> Admin Portal
      </button>
          {open && mounted && (
        <div className={`${mobile ? 'relative' : 'absolute right-0'} mt-2 w-full ${mobile ? 'max-w-full' : 'w-80'} bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-0`} style={!mobile ? { minWidth: 320 } : {}}>
          {!session ? (
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-[#df7500] to-[#651321] rounded-full flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent">Admin Portal</h1>
                <p className="text-gray-600 text-xs mt-1">Secure access for administrators only</p>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <div>
                      <h3 className="text-red-800 font-semibold text-xs mb-0.5">Access Denied</h3>
                      <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                      <p className="text-red-600 text-[10px] mt-1">Contact your administrator to get access.</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-[#df7500]/20 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
              <div className="text-center mt-3">
                <p className="text-xs text-gray-500">Only authorized admin accounts can access this portal</p>
                <p className="text-[10px] text-gray-400">If you don't have access, contact your administrator</p>
              </div>
            </div>
          ) : (
            // If a session exists, only show the AdminMenu for admin accounts
            // Non-admin signed-in users should not see admin links
            (session as any)?.user?.isAdmin ? (
              <AdminMenu />
            ) : (
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-[#df7500] to-[#651321] rounded-full flex items-center justify-center mb-2">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-[#df7500] to-[#651321] bg-clip-text text-transparent">Admin Portal</h1>
                  <p className="text-gray-600 text-xs mt-1">Access Denied</p>
                </div>
                <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <div>
                      <h3 className="text-yellow-800 font-semibold text-sm mb-0.5">You are signed in as Student</h3>
                      <p className="text-yellow-700 text-xs leading-relaxed"> you do not have administrator access.</p>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="text-xs text-gray-500">Sign out and sign in with an admin email to access the portal.</p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default NavBar;
