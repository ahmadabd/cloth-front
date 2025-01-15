"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });
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
    <nav className="sticky top-0 bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href={isLoggedIn ? '/dashboard' : '/'} 
              className="text-white text-xl font-semibold hover:text-gray-200"
            >
              Virtual Wardrobe
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === '/dashboard' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === '/upload' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Upload
                </Link>
                <Link
                  href="/profile/setup"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === '/profile/setup' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === '/' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Home
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
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
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-2 space-y-1">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${pathname === '/dashboard' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className={`block px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${pathname === '/upload' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Upload
                </Link>
                <Link
                  href="/profile/setup"
                  className={`block px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${pathname === '/profile/setup' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 rounded-md text-base font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={`block px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${pathname === '/' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Home
                </Link>
                <Link
                  href="/auth/signin"
                  className="block px-4 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 