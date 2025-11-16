"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminMenu from "./AdminMenu";

// Dropdown for Admin Portal
import { signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Shield, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/add-question", label: "Admin Portal" },
];

const NavBar = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 md:px-8 py-2">
        {/* Logo Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Image
            src="/t_Final logo_light_v.svg"
            alt="Faculty of Engineering Logo"
            width={80}
            height={40}
            className="md:w-[120px] md:h-[60px]"
            style={{ objectFit: "contain" }}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] md:text-xs text-[#a67c52] font-semibold">
              25 Years of Innovation & Excellence
            </span>
            <span className="text-sm md:text-lg font-semibold text-[#4b2e83]">
              Faculty of Engineering
            </span>
            <span className="text-xs md:text-sm text-[#4b2e83]">University of Ruhuna</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            if (link.label === "Admin Portal") {
              return (
                <div key={link.href} className="relative">
                  <AdminPortalDropdown session={session} />
                </div>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-semibold ${pathname === link.href
                  ? "text-[#4b2e83] border-b-2 border-[#4b2e83]"
                  : "text-gray-700 hover:text-[#a67c52] border-b-2 border-transparent"
                  } pb-1 transition-colors`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-700 hover:text-[#4b2e83] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="flex flex-col p-4 gap-4">
            {navLinks.map((link) => {
              if (link.label === "Admin Portal") {
                return (
                  <div key={link.href}>
                    <AdminPortalDropdown session={session} mobile={true} />
                  </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-semibold py-2 ${pathname === link.href
                    ? "text-[#4b2e83] border-l-4 border-[#4b2e83] pl-3"
                    : "text-gray-700 hover:text-[#a67c52] pl-3"
                    } transition-colors`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};


const AdminPortalDropdown = ({ session, mobile = false }: { session: any; mobile?: boolean }) => {
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

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await signIn("google", {
        callbackUrl: "/manage-questions",
        redirect: false,
      });
      if (result?.error) {
        setError("Access Denied: You don't have permission to access the admin panel. Only authorized email addresses can log in as admin.");
      }
    } catch (error) {
      setError("An error occurred during authentication. Please try again.");
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
      {open && (
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
            <AdminMenu />
          )}
        </div>
      )}
    </div>
  );
};

export default NavBar;
