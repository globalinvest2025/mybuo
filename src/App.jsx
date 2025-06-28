// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './Auth'; // Asumo que tienes un componente Auth para el login/registro
import Dashboard from './Dashboard';
import { supabase } from './lib/supabaseClient'; // Asegúrate de que esta ruta sea correcta para tu cliente Supabase
import './App.css'; // Tu CSS global

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para el inicio de sesión. Si hay sesión, redirige al Dashboard */}
        <Route path="/" element={!session ? <Auth /> : <Dashboard />} />
        
        {/* Ruta para el Dashboard. Requiere sesión */}
        <Route path="/dashboard" element={session ? <Dashboard /> : <Auth />} />
        
        {/* Puedes añadir más rutas aquí si las necesitas */}
        {/* <Route path="/profile" element={session ? <UserProfile /> : <Auth />} /> */}
        
        {/* Ruta para manejar cualquier otra URL no definida (opcional) */}
        <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;