"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

// Add noFlash utility to prevent content flash
const useNoFlash = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
};

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isClient = useNoFlash();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Loading state with pre-styled content
  if (!isClient || isLoading) {
    return (
      <nav className="sticky top-0 bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">Virtual Wardrobe</span>
            </div>
            {/* Add skeleton loader for nav items */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-20 h-8 bg-gray-700 rounded-md animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-700 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

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

          {/* Desktop Navigation - Now with guaranteed styles */}
          <div className="hidden md:flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`inline-block px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === '/dashboard' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className={`inline-block px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === '/upload' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Upload
                </Link>
                <Link
                  href="/profile/setup"
                  className={`inline-block px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === '/profile/setup' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-block px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={`inline-block px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === '/' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Home
                </Link>
                <Link
                  href="/auth/signin"
                  className="inline-block px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
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

        {/* Mobile menu with guaranteed styles */}
        {isMenuOpen && (
          <div className="md:hidden py-2 space-y-1">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block w-full px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${pathname === '/dashboard' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className={`block w-full px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${pathname === '/upload' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Upload
                </Link>
                <Link
                  href="/profile/setup"
                  className={`block w-full px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${pathname === '/profile/setup' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 rounded-md text-base font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={`block w-full px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${pathname === '/' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  Home
                </Link>
                <Link
                  href="/auth/signin"
                  className="block w-full px-4 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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