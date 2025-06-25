// src/BusinessLandingPage.jsx (Versión Simplificada - Layout maneja la auth)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, MapPin } from 'lucide-react';
import { supabase } from './lib/supabaseClient.js'; 

export default function BusinessLandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Solo verificar si ya hay una sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Regresar a la página actual
        },
      });

      if (error) {
        console.error('Error logging in with Google:', error.message);
        alert('Sorry, there was an error during the login process. Please try again.');
        setLoading(false);
      }
      // No quitamos loading aquí porque Layout.jsx manejará la redirección
    } catch (error) {
      console.error('Error inesperado:', error);
      setLoading(false);
    }
  };

  // Mostrar loading si está procesando o si hay tokens en la URL
  if (loading || window.location.hash.includes('access_token')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {window.location.hash.includes('access_token') ? 'Processing login...' : 'Connecting to Google...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main>
      <section className="text-center py-20 px-6 bg-gradient-to-br from-white via-purple-50 to-blue-50">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Put Your Business on the Map.
          <br />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">For Free.</span>
        </h1>
        <p className="max-w-3xl mx-auto mt-6 text-lg text-gray-600">
          Join MyBuo's fastest-growing business directory. Create a professional profile in minutes and connect with thousands of local customers looking for you. No subscriptions, no hidden fees.
        </p>
        
        <button
          onClick={handleLoginWithGoogle}
          disabled={loading}
          className="mt-10 px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border border-gray-300 shadow-sm hover:shadow-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Get Started with Google
            </>
          )}
        </button>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900">Everything You Get, For Free.</h2>
            <p className="mt-4 text-gray-600 text-lg">Your free profile is packed with features to help you shine.</p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200"><CheckCircle className="w-10 h-10 text-purple-500 mb-4" /><h3 className="text-xl font-semibold mb-2">Your Own Business Page</h3><p className="text-gray-600">A dedicated, beautiful page for your business with a unique URL.</p></div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200"><Camera className="w-10 h-10 text-purple-500 mb-4" /><h3 className="text-xl font-semibold mb-2">Photo Gallery</h3><p className="text-gray-600">Showcase your products, services, or location with a stunning photo gallery.</p></div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200"><MapPin className="w-10 h-10 text-purple-500 mb-4" /><h3 className="text-xl font-semibold mb-2">Contact Info & Map</h3><p className="text-gray-600">Make it easy for customers to find you with your address, phone, hours, and an interactive map.</p></div>
          </div>
        </div>
      </section>
      
      <section className="py-20 px-6 bg-slate-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-semibold text-purple-600">Our Services</p>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">Ready to Truly Stand Out?</h2>
          <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">While your profile is free forever, we offer one-time services to create stunning visual content that will set you apart.</p>
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col text-left"><h3 className="text-2xl font-bold text-gray-900">Professional Photography</h3><p className="text-gray-600 mt-2 flex-grow">High-quality photos are the single most important factor for attracting customers. We'll capture your business at its best.</p><button onClick={() => alert('Contact form for Photography would appear here.')} className="mt-6 w-full bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-black transition-all">Get a Quote</button></div>
            <div className="bg-purple-700 text-white rounded-2xl shadow-2xl p-8 flex flex-col text-left ring-4 ring-offset-2 ring-purple-500"><h3 className="text-2xl font-bold">Immersive 3D Virtual Tours</h3><p className="text-purple-200 mt-2 flex-grow">Give customers the ability to walk through your business from anywhere. Our 3D tours increase engagement and drive real-world visits.</p><button onClick={() => alert('Contact form for 3D Tour would appear here.')} className="mt-6 w-full bg-white text-purple-700 px-6 py-3 rounded-lg font-bold hover:bg-purple-100 transition-all">Learn More</button></div>
          </div>
        </div>
      </section>
    </main>
  );
}