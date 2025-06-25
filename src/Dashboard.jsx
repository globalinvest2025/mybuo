// src/Dashboard.jsx - Componente principal que usa BusinessDashboard

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from './lib/supabaseClient';
import BusinessDashboard from './BusinessDashboard';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Obtener datos del negocio del usuario actual
  const { data: business, isLoading: businessLoading, error } = useQuery({
    queryKey: ['userBusiness', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró negocio para este usuario
          return null;
        }
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    // Verificar sesión al montar el componente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      } else {
        // Si no hay sesión, redirigir al login
        navigate('/');
      }
      setLoading(false);
    });

    // Listener para cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const createBusiness = async () => {
    if (!session?.user) return;

    try {
      const newBusiness = {
        name: `${session.user.user_metadata?.full_name || 'My'} Business`,
        category: 'restaurants',
        location: 'Enter your address',
        description: 'Tell customers about your business...',
        hours: '9:00 AM - 6:00 PM',
        phone: '',
        website: '',
        user_id: session.user.id,
        rating: 5.0,
        reviewsCount: 0,
        featured: false,
        images: []
      };

      const { data, error } = await supabase
        .from('businesses')
        .insert([newBusiness])
        .select()
        .single();

      if (error) throw error;

      // Refrescar la query para obtener el nuevo negocio
      window.location.reload();
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Error creating business profile: ' + error.message);
    }
  };

  if (loading || businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access the dashboard.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">Error loading your business data: {error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to MyBuo!</h1>
            <p className="text-gray-600 mb-6">
              You don't have a business profile yet. Create one now to get started.
            </p>
            <div className="space-y-4">
              <button
                onClick={createBusiness}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Create My Business Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar el BusinessDashboard existente
  return (
    <BusinessDashboard 
      business={business}
      user={{
        name: session.user.user_metadata?.full_name || session.user.email,
        email: session.user.email,
        id: session.user.id
      }}
      onLogout={handleLogout}
    />
  );
}