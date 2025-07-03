// ReviewLoginModal.jsx - Modal de login social para escribir reseñas (Just-in-Time Authentication)
import React from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

function ReviewLoginModal({ onClose, businessName, onLoginSuccess }) {
    const handleGoogleLogin = async () => {
        try {
            // Build redirect URL with query parameter instead of hash
            const baseUrl = window.location.origin + window.location.pathname;
            const redirectUrl = new URL(baseUrl);
            redirectUrl.searchParams.set('review', 'true');
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl.href
                }
            });
            
            if (error) throw error;
            
            // The redirect will handle the rest
        } catch (error) {
            console.error('Google login error:', error);
            alert('Error signing in with Google. Please try again.');
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        
        if (!email) {
            alert('Please enter your email address.');
            return;
        }

        try {
            // Build redirect URL with query parameter instead of hash
            const baseUrl = window.location.origin + window.location.pathname;
            const redirectUrl = new URL(baseUrl);
            redirectUrl.searchParams.set('review', 'true');
            
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: redirectUrl.href
                }
            });
            
            if (error) throw error;
            
            alert('Check your email for the sign-in link!');
            onClose();
        } catch (error) {
            console.error('Email login error:', error);
            alert('Error sending email. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-in fade-in-0 zoom-in-95">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                    aria-label="Close modal"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="text-center mb-6">
                    <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Share Your Experience
                    </h2>
                    <p className="text-gray-600">
                        Help others discover <span className="font-semibold">{businessName}</span> by sharing your review.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="text-center text-gray-500 text-sm">
                        or
                    </div>

                    {/* Email Login Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-3">
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email address"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                            Send Magic Link
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ReviewLoginModal;