// src/Layout.jsx (Versión con Logo + Texto Juntos)

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from './assets/myvuer-logo1.png'; 

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-gray-800 font-sans">
      
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          
          {/* --- AQUÍ ESTÁ LA MAGIA: Logo y Texto Juntos --- */}
          <Link to="/" className="flex items-center gap-3"> {/* 1. Contenedor flexible */}
            <img src={logo} alt="MyVuer Logo" className="h-9 w-auto" /> {/* 2. Tu logo */}
            <span className="text-3xl font-bold text-gray-900">
              My<span className="text-purple-600">Vuer</span>
            </span> {/* 3. Tu texto */}
          </Link>

          <nav className="flex items-center gap-6">
            {location.pathname !== '/inscribirse' && (
              <Link 
                to="/inscribirse" 
                className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-300"
              >
                List Your Business
              </Link>
            )}
          </nav>

        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto text-center px-6">
            <p>&copy; {new Date().getFullYear()} MyVuer.com. All rights reserved.</p>
        </div>
      </footer>
      
    </div>
  );
}