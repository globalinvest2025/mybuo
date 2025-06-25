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
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Verificar si hay tokens en la URL (callback de Google)
        const hash = window.location.hash;
        
        if (hash.includes('access_token')) {
          console.log('🔍 Tokens detectados en URL, procesando...');
          
          // Extraer tokens de la URL
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('📝 Estableciendo sesión con tokens...');
            
            // Establecer la sesión en Supabase
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (data.session && !error && isMounted) {
              console.log('✅ Sesión establecida exitosamente:', data.session.user.email);
              setSession(data.session);
              
              // Limpiar la URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Redirigir al dashboard
              navigate('/dashboard');
            } else if (error) {
              console.error('❌ Error al establecer sesión:', error);
            }
          }
        } else {
          // 2. Si no hay tokens en URL, verificar sesión existente
          const { data: { session } } = await supabase.auth.getSession();
          if (isMounted) {
            setSession(session);
            console.log(session ? '✅ Sesión existente encontrada' : '📭 No hay sesión activa');
          }
        }
      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // 3. Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 Cambio de autenticación:', event);
      setSession(session);

      // Solo redirigir si no estamos procesando tokens de URL
      if (!window.location.hash.includes('access_token')) {
        if (event === "SIGNED_IN" && session) {
          console.log('📍 Redirigiendo a dashboard...');
          navigate('/dashboard');
        } else if (event === "SIGNED_OUT") {
          console.log('📍 Redirigiendo a inicio...');
          navigate('/');
        }
      }
    });

    // Inicializar
    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
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
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="MyBuo Logo" className="h-9 w-auto" />
              <span className="text-2xl font-bold text-gray-900">
                My<span className="text-purple-600">Buo</span>
                <span className="text-gray-900">.com</span>
              </span>
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