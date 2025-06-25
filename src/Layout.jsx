// src/Layout.jsx (Versión con logo y eslogan actualizados)

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient.js';
import logo from './assets/mybuo-logo.png'; 
import { LogOut } from 'lucide-react';

export default function Layout() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-gray-800 font-sans">
      
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          
          {/* --- SECCIÓN DEL LOGO Y ESLOGAN ACTUALIZADA --- */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="MyBuo Logo" className="h-9 w-auto" /> {/* Logo un poco más grande para balancear */}
              <span className="text-2xl font-bold text-gray-900">
                My<span className="text-purple-600">Buo</span>
                {/* 1. Añadimos el .com en negro */}
                <span className="text-gray-900">.com</span>
              </span>
            </Link>

            {/* 2. Div para el separador y el eslogan (se oculta en móviles) */}
            <div className="hidden md:flex items-center gap-4">
                <div className="w-px h-6 bg-gray-300"></div> {/* Línea vertical separadora */}
                <p className="text-sm text-gray-500 italic">Your Guide to 3D Business Tours</p>
            </div>
          </div>


          {/* La navegación no cambia */}
          <nav className="flex items-center gap-6">
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:inline">{session.user.email}</span>
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
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto text-center px-6">
            <p>&copy; {new Date().getFullYear()} MyBuo.com. All rights reserved.</p>
        </div>
      </footer>
      
    </div>
  );
}