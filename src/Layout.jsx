// src/Layout.jsx (Versión Corregida con Manejo Completo de Autenticación)

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import logo from './assets/mybuo-logo.png'; 
import { LogOut } from 'lucide-react';

export default function Layout() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Layout] 🔄 Auth Event: ${event}`);
      setSession(session);

      // This is the logic that controls EVERYTHING. Executes at the moment of the event.
      if (event === "SIGNED_IN") {
        // Read the current URL directly from the browser
        const params = new URLSearchParams(window.location.search);

        // If the 'review=true' parameter is NOT there, then redirect to dashboard
        if (!params.has('review')) {
          console.log("[Layout] ✅ User logged in. Not review flow. Redirecting to dashboard...");
          navigate('/dashboard');
        } else {
          console.log("[Layout] ✅ User logged in in review flow. NO REDIRECT.");
        }
      } else if (event === "SIGNED_OUT") {
        console.log("[Layout] 📍 Redirecting to home...");
        navigate('/');
      }

      // When initial session loads or changes, end loading state
      setIsLoading(false);
    });

    // Check if session already exists when page loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsLoading(false); // If no session, end loading anyway
      }
      // If there is a session, onAuthStateChange will handle it with INITIAL_SESSION event
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    console.log('🚪 Cerrando sesión...');
    await supabase.auth.signOut();
  };

  // Mostrar loading durante la inicialización
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-gray-800 font-sans">
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="MyBuo" className="h-10 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-4">
                <div className="w-px h-6 bg-gray-300"></div>
                <p className="text-sm text-gray-500 italic">Your Guide to 3D Business Tours</p>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {session.user.user_metadata?.full_name || session.user.email}
                </span>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <>
                {location.pathname !== '/register' && (
                  <Link 
                    to="/register"
                    className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-300"
                  >
                    List Your Business
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet context={{ user: session?.user || null, authLoading: isLoading }} />
      </main>
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo and tagline */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold text-white">MyBuo.com</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Your premier destination for immersive 3D business tours and virtual experiences.
              </p>
            </div>
            
            {/* Contact Information */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact Us</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <a href="mailto:info@mybuo.com" className="text-gray-300 hover:text-white transition-colors">
                    info@mybuo.com
                  </a>
                </p>
                <p>
                  <a href="tel:+12532101981" className="text-gray-300 hover:text-white transition-colors">
                    +1 253 210 1981
                  </a>
                </p>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </p>
                <p>
                  <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </p>
                <p>
                  <Link to="/register" className="text-gray-300 hover:text-white transition-colors">
                    List Your Business
                  </Link>
                </p>
              </div>
            </div>
          </div>
          
          {/* Bottom border and copyright */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} MyBuo All rights reserved.</p>
              <p className="mt-2 md:mt-0">
                Empowering businesses through virtual tours
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}