"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initial session check
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/signin');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-green-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={isLoggedIn ? '/dashboard' : '/'} className="text-white text-xl font-bold">
              Virtual Wardrobe
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/dashboard' ? 'bg-green-600' : 'hover:bg-green-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/upload' ? 'bg-green-600' : 'hover:bg-green-600'
                  }`}
                >
                  Upload
                </Link>
                <Link
                  href="/profile/setup"
                  className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/profile/setup' ? 'bg-green-600' : 'hover:bg-green-600'
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-white text-green-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/' ? 'bg-green-600' : 'hover:bg-green-600'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/auth/signin"
                  className="bg-white text-green-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-50"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-white block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/dashboard' ? 'bg-green-600' : 'hover:bg-green-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className={`text-white block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/upload' ? 'bg-green-600' : 'hover:bg-green-600'
                  }`}
                >
                  Upload
                </Link>
                <Link
                  href="/profile/setup"
                  className={`text-white block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/profile/setup' ? 'bg-green-600' : 'hover:bg-green-600'
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-green-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={`text-white block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/' ? 'bg-green-600' : 'hover:bg-green-600'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 