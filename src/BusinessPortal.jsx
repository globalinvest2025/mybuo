// src/BusinessPortal.jsx - VERSIÓN CON TOGGLE SWITCH MORADO

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { Search, MapPin, Star, Clock, Camera, Zap, List, Heart, Calendar, Coffee, Utensils, ShoppingBag, TrendingUp, Filter, Map as MapIcon, X, ChevronLeft, ChevronRight, Phone, Plus, Edit3, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import ReviewLoginModal from './ReviewLoginModal.jsx';
import ReviewForm from './ReviewForm.jsx';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Static data for collections (events now come from database)
const collections = [ { title: "Perfect for Remote Work", icon: <Coffee className="w-6 h-6"/>, businesses: 12, color: "from-amber-500 to-orange-600" } ];

// Function to fetch events data from database
const fetchEvents = async () => {
    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            businesses!inner(name, category)
        `)
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(10);

    if (error) throw new Error(error.message);
    
    return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        business: event.businesses.name,
        date: new Date(event.start_date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        category: event.businesses.category,
        description: event.description,
        photo_url: event.photo_url
    }));
};

// Function to fetch business data, now including associated photos and real reviews
const fetchBusinesses = async () => {
    const { data, error } = await supabase
        .from('businesses')
        .select('*, business_photos(id, url, order_index)')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    // Fetch reviews for all businesses in one query
    const { data: allReviews } = await supabase
        .from('reviews')
        .select('business_id, rating');
    
    const sortedBusinesses = (data || []).map(business => {
        // Calculate rating from real reviews in database
        const businessReviews = allReviews?.filter(review => review.business_id === business.id) || [];
        let calculatedRating = 0;
        let reviewsCount = businessReviews.length;
        
        if (businessReviews.length > 0) {
            const totalRating = businessReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            calculatedRating = totalRating / businessReviews.length;
        }
        
        return {
            ...business,
            rating: calculatedRating, // Real rating from database
            reviewsCount: reviewsCount, // Real review count from database
            business_photos: business.business_photos 
                ? business.business_photos
                    .sort((a, b) => {
                        // Handle null order_index values - put them at the end
                        if (a.order_index === null && b.order_index === null) return 0;
                        if (a.order_index === null) return 1;
                        if (b.order_index === null) return -1;
                        return a.order_index - b.order_index;
                    })
                : []
        };
    });

    console.log('🔍 Businesses fetched with photos and real reviews:', sortedBusinesses);
    return sortedBusinesses;
};

// --- Business Detail Modal Component ---
function BusinessDetailModal({ business, onClose, renderStars, user, authLoading }) {
    const allowedTourDomains = ['matterport.com', 'kuula.co', 'realsee.ai'];
    const isTourUrlValid = business.tour_3d_url && allowedTourDomains.some(domain => business.tour_3d_url.toLowerCase().includes(domain));
    
    // Photo and tour state
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [is3DTourMode, setIs3DTourMode] = useState(isTourUrlValid);

    // Review state
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);

    // Get the photos array from the business object
    const photos = business.business_photos || [];
    const hasPhotos = photos.length > 0;

    // React to auth state changes from Layout (no duplicate listener)
    useEffect(() => {
        // If auth loading has finished AND we have a user...
        if (!authLoading && user) {
            const urlParams = new URLSearchParams(window.location.search);
            // ...and URL indicates we should show review form...
            if (urlParams.get('review') === 'true') {
                console.log("✨ Modal detects user and ?review=true. Showing form.");
                setShowLoginModal(false); // Hide login modal if it was open
                setShowReviewForm(true); // Show review form
                // Clean up URL to remove the parameter
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
        // This effect runs when authentication finishes or user changes
    }, [user, authLoading]);

    // Helper function to get user details via secure RPC
    const getReviewUserDetails = async (userId) => {
        const { data, error } = await supabase.rpc('get_user_display_name', { user_id_input: userId });
        if (error) {
            console.error('Error fetching user name:', error);
            return 'Anonymous';
        }
        return data && data.length > 0 ? data[0].display_name : 'Anonymous';
    };

    // Fetch reviews for this business
    const { data: reviews, isLoading: reviewsLoading } = useQuery({
        queryKey: ['reviews', business.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select('*, user_id')
                .eq('business_id', business.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Get user details for each review using secure RPC
            const reviewsWithUsers = await Promise.all(
                data.map(async (review) => ({
                    ...review,
                    user_name: await getReviewUserDetails(review.user_id)
                }))
            );
            
            return reviewsWithUsers;
        }
    });

    // Get current user's review if exists
    const userReview = user ? reviews?.find(r => r.user_id === user.id) : null;

    // Get the URL for the currently displayed photo (with cache buster for fresh load)
    const currentPhotoUrl = hasPhotos 
        ? `${photos[currentPhotoIndex]?.url}?t=${new Date().getTime()}`
        : 'https://placehold.co/800x600'; // Fallback

    const handlePrevPhoto = () => {
        setCurrentPhotoIndex(prevIndex => (prevIndex === 0 ? photos.length - 1 : prevIndex - 1));
    };

    const handleNextPhoto = () => {
        setCurrentPhotoIndex(prevIndex => (prevIndex === photos.length - 1 ? 0 : prevIndex + 1));
    };

    // Effect to reset photo index and mode when business changes
    useEffect(() => {
        setCurrentPhotoIndex(0);
        setIs3DTourMode(isTourUrlValid);
    }, [business, isTourUrlValid]);

    const handleWriteReview = () => {
        if (!user) {
            setShowLoginModal(true);
        } else {
            setShowReviewForm(true);
        }
    };

    const handleEditReview = (review) => {
        setEditingReview(review);
        setShowReviewForm(true);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative">
                {/* Image/Tour section SIN toggle */}
                <div className="w-full h-[28rem] bg-gray-200 rounded-t-2xl overflow-hidden flex-shrink-0 relative">
                    {/* Media Content */}
                    {is3DTourMode && isTourUrlValid ? (
                        <iframe 
                            src={business.tour_3d_url} 
                            title={`3D tour of ${business.name}`} 
                            className="w-full h-full border-0" 
                            allow="fullscreen; vr" 
                            allowFullScreen 
                        />
                    ) : hasPhotos ? (
                        <>
                            <img src={currentPhotoUrl} alt={business.name} className="w-full h-full object-cover" />
                            {/* Navigation buttons for photos */}
                            {photos.length > 1 && (
                                <>
                                    <button 
                                        onClick={handlePrevPhoto} 
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button 
                                        onClick={handleNextPhoto} 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                                        {currentPhotoIndex + 1} / {photos.length}
                                    </span>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-lg">
                            No media available
                        </div>
                    )}
                </div>

                {/* Toggle Switch y botón cerrar - Solo cuando hay toggle O siempre el botón */}
                {(isTourUrlValid && hasPhotos) ? (
                    // Caso 1: Hay 3D + fotos - Mostrar toggle + botón cerrar
                    <div className="flex justify-center items-center mb-3 relative">
                        <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 shadow-lg">
                            <div className="flex rounded-full bg-black/30">
                                <button
                                    onClick={() => setIs3DTourMode(true)}
                                    className={`px-4 py-2 text-xs font-medium rounded-full transition-all ${
                                        is3DTourMode 
                                            ? 'bg-purple-600 text-white shadow-sm' 
                                            : 'text-white/80 hover:text-white'
                                    }`}
                                >
                                    3D Tour
                                </button>
                                <button
                                    onClick={() => setIs3DTourMode(false)}
                                    className={`px-4 py-2 text-xs font-medium rounded-full transition-all ${
                                        !is3DTourMode 
                                            ? 'bg-purple-600 text-white shadow-sm' 
                                            : 'text-white/80 hover:text-white'
                                    }`}
                                >
                                    Photo Gallery
                                </button>
                            </div>
                        </div>
                        
                        {/* Botón cerrar cuando hay toggle */}
                        <button onClick={onClose} className="absolute right-0 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors" aria-label="Close modal">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    // Caso 2: Solo fotos - Solo botón cerrar, sin espacio extra
                    <div className="flex justify-end mb-3">
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors" aria-label="Close modal">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Área de contenido */}
                <div className="px-8 pb-8 pt-4 overflow-y-auto relative">
                    <h2 className="text-3xl font-bold mb-2">{business.name}</h2>
                    <div className="flex items-center gap-2 mb-4"><div className="flex">{renderStars(business.rating)}</div><span className="text-gray-600">({business.reviewsCount || 0} reviews)</span></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 mb-6">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                            <MapPin className="w-5 h-5 text-purple-500"/>
                            <span className="group-hover:underline group-hover:text-purple-700 transition-colors">{business.location}</span>
                        </a>
                        {business.phone && (
                            <a href={`tel:${business.phone}`} className="flex items-center gap-2 group">
                                <Phone className="w-5 h-5 text-purple-500"/>
                                <span className="group-hover:underline group-hover:text-purple-700 transition-colors">{business.phone}</span>
                            </a>
                        )}
                        <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-purple-500"/>{business.hours || 'Hours not available'}</div>
                        <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500"/>{business.category}</div>
                        {isTourUrlValid && (<div className="flex items-center gap-2"><Camera className="w-5 h-5 text-purple-500"/>Virtual 3D Tour available</div>)}
                    </div>
                    {business.specialOffer && (<div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6"><h3 className="font-semibold text-blue-800 mb-1">Special Offer</h3><p className="text-blue-700">{business.specialOffer}</p></div>)}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Reviews ({reviews?.length || 0})</h3>
                        <button
                            onClick={handleWriteReview}
                            disabled={authLoading}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                            {authLoading 
                                ? 'Verifying...' 
                                : userReview ? 'Edit Review' : 'Write Review'
                            }
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {reviewsLoading ? (
                            <div className="text-center py-4">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-purple-600 border-r-transparent"></div>
                                <p className="text-sm text-gray-500 mt-2">Loading reviews...</p>
                            </div>
                        ) : reviews && reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div key={review.id} className="border-l-4 border-purple-200 pl-4 relative">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex">{renderStars(review.rating)}</div>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {review.comment && (
                                                <p className="text-gray-800 my-2">"{review.comment}"</p>
                                            )}
                                            <p className="text-sm text-gray-500 font-semibold">- {review.user_name}</p>
                                        </div>
                                        
                                        {/* Edit/Delete buttons for user's own review */}
                                        {user && review.user_id === user.id && (
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => handleEditReview(review)}
                                                    className="text-purple-600 hover:text-purple-800 p-1"
                                                    title="Edit Review"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500 mb-2">No reviews yet</p>
                                <p className="text-sm text-gray-400">Be the first to share your experience!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Review Login Modal */}
            {showLoginModal && (
                <ReviewLoginModal
                    onClose={() => setShowLoginModal(false)}
                    businessName={business.name}
                    onLoginSuccess={() => {
                        setShowLoginModal(false);
                        setShowReviewForm(true);
                    }}
                />
            )}
            
            {/* Review Form Modal */}
            {showReviewForm && (
                <ReviewForm
                    businessId={business.id}
                    businessName={business.name}
                    user={user}
                    existingReview={editingReview}
                    onClose={() => {
                        setShowReviewForm(false);
                        setEditingReview(null);
                    }}
                />
            )}
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function BusinessPortal() {
    // Get auth state from Layout context
    const { user, authLoading } = useOutletContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [activeTab, setActiveTab] = useState('featured');
    const [category, setCategory] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    const [sortBy, setSortBy] = useState("rating");
    const [filterRating, setFilterRating] = useState(0);
    const [filterOpenNow, setFilterOpenNow] = useState(false);
    const [favorites, setFavorites] = useState(() => { try { const saved = localStorage.getItem('mybuo-favorites'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); } });

    useEffect(() => { localStorage.setItem('mybuo-favorites', JSON.stringify(Array.from(favorites))); }, [favorites]);

    // Fetch businesses, now including associated photos
    const { data: businesses, isLoading, isError, error } = useQuery({ queryKey: ['businesses'], queryFn: fetchBusinesses });
    
    // Fetch events from database
    const { data: events } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });

    // Apply global search filter to all businesses first
    const filteredBusinesses = useMemo(() => {
        if (!searchTerm) return businesses || [];
        return (businesses || []).filter(business => 
            business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            business.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            business.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [businesses, searchTerm]);

    const dataByCategory = useMemo(() => {
        if (!filteredBusinesses) return {};
        return filteredBusinesses.reduce((acc, business) => {
            const cat = business.category || 'general';
            if (!acc[cat]) { acc[cat] = []; }
            acc[cat].push(business);
            return acc;
        }, {});
    }, [filteredBusinesses]);
    
    useEffect(() => {
        if (!category && dataByCategory && Object.keys(dataByCategory).length > 0) {
            setCategory(Object.keys(dataByCategory)[0]);
        }
    }, [dataByCategory, category]);

    const allBusinesses = useMemo(() => filteredBusinesses, [filteredBusinesses]);
    // Auto-feature first 6 businesses (oldest registered) until we have adequate traffic
    const featuredBusinesses = useMemo(() => {
        const manuallyFeatured = allBusinesses.filter(b => b.featured);
        if (manuallyFeatured.length >= 6) {
            return manuallyFeatured;
        }
        // If less than 6 manually featured, add oldest businesses to reach 6
        const oldestBusinesses = [...allBusinesses]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .slice(0, 6);
        return oldestBusinesses;
    }, [allBusinesses]);
    const newBusinesses = useMemo(() => [...allBusinesses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6), [allBusinesses]);
    
    const filteredAndSortedData = useMemo(() => {
        let items = dataByCategory[category] || [];
        // No need to filter by searchTerm here since it's already applied globally
        if (filterOpenNow) {
            const now = new Date();
            const currentHour = now.getHours();
            items = items.filter(item => {
                if (!item.hours24) return false;
                if (item.hours24.open === 0 && item.hours24.close === 24) return true;
                return currentHour >= item.hours24.open && currentHour < item.hours24.close;
            });
        }
        if (filterRating > 0) { items = items.filter(item => item.rating >= filterRating); }
        items.sort((a, b) => {
            if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'reviews') return (b.reviewsCount || 0) - (a.reviewsCount || 0);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });
        return items;
    }, [dataByCategory, category, filterOpenNow, filterRating, sortBy]);

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating || 0);
        return Array.from({ length: 5 }, (_, i) => (<Star key={i} className={`w-4 h-4 ${i < fullStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />));
    };

    const toggleFavorite = (businessId) => {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(businessId)) { newFavorites.delete(businessId); } else { newFavorites.add(businessId); }
        setFavorites(newFavorites);
    };

    // --- Business Card Component ---
    const BusinessCard = ({ business, featured = false }) => {
        // Get the primary image for the card (first in sorted business_photos)
        const primaryImageUrl = (business.business_photos && business.business_photos.length > 0)
            ? `${business.business_photos[0].url}?t=${new Date().getTime()}` // Use cache buster
            : 'https://placehold.co/400x200'; // Fallback image

        return (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer" onClick={() => setSelectedBusiness(business)}>
                <div className="relative">
                    {/* Use the primary image from business_photos for the card */}
                    <img src={primaryImageUrl} alt={business.name} className="w-full h-48 object-cover" /> 
                    <div className="absolute top-3 left-3">
                        {business.tour_3d_url ? (<div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg tracking-wider"><Camera className="w-4 h-4" /><span>3D TOUR</span></div>) : business.isNew ? (<div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">New</div>) : null}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(business.id); }} className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors" aria-label="Toggle favorite"><Heart className={`w-5 h-5 transition-all ${favorites.has(business.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} /></button>
                    {featured && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4"><div className="flex items-center text-white text-sm"><Zap className="w-4 h-4 mr-1 text-yellow-400" />Featured</div></div>}
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg text-gray-900 truncate">{business.name}</h3><span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{business.category}</span></div>
                    <div className="flex items-center mb-2">{renderStars(business.rating)}<span className="ml-1 text-sm font-semibold">{business.rating || 'N/A'}</span><span className="ml-1 text-sm text-gray-500">({business.reviewsCount || 0})</span></div>
                    <div className="flex items-center text-sm text-gray-600 mb-3"><MapPin className="w-4 h-4 mr-1" />{business.location}</div>
                    {business.specialOffer && <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border-l-4 border-blue-500"><p className="text-sm font-semibold text-blue-800">{business.specialOffer}</p></div>}
                </div>
            </div>
        );
    };

    if (isLoading) { return <main className="max-w-7xl mx-auto p-6 text-center text-xl font-semibold">Loading MyBuo Portal...</main>; }
    if (isError) { return <main className="max-w-7xl mx-auto p-6 text-center text-xl font-semibold text-red-500">Error: {error.message}</main>; }

    return (
        <main className="max-w-7xl mx-auto p-6 pt-6 md:pt-12">
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search for businesses, services, stores..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center transition-transform hover:scale-105"><div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><TrendingUp className="w-8 h-8 text-blue-600" /></div><h3 className="text-2xl font-bold text-gray-900">{allBusinesses.length}</h3><p className="text-gray-600">Businesses Listed</p></div>
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center transition-transform hover:scale-105"><div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Star className="w-8 h-8 text-green-600" /></div><h3 className="text-2xl font-bold text-gray-900">1,240+</h3><p className="text-gray-600">Reviews Written</p></div>
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center transition-transform hover:scale-105"><div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8 text-purple-600" /></div><h3 className="text-2xl font-bold text-gray-900">{events?.length || 0}</h3><p className="text-gray-600">Upcoming Events</p></div>
            </div>
            <div className="flex flex-wrap gap-4 mb-8">
              {[ { id: 'featured', label: 'Featured', icon: <Zap /> }, { id: 'new', label: 'New Arrivals', icon: <Star /> }, { id: 'events', label: 'Events', icon: <Calendar /> }, { id: 'collections', label: 'Collections', icon: <Filter /> }, { id: 'browse', label: 'Browse All', icon: <List /> } ].map((tab) => ( <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}> {React.cloneElement(tab.icon, {className: 'w-4 h-4'})} {tab.label} </button>))}
            </div>
            
            {activeTab === 'featured' && ( <div><h2 className="text-3xl font-bold text-gray-900 mb-6">✨ Featured Businesses</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{featuredBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)}</div></div> )}
            {activeTab === 'new' && ( <div><h2 className="text-3xl font-bold text-gray-900 mb-6">🆕 New Arrivals</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{newBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)}</div></div> )}
            {activeTab === 'events' && ( 
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">📅 Upcoming Events</h2>
                    <div className="space-y-4">
                        {events && events.length > 0 ? (
                            events.map((event) => (
                                <div key={event.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                                            <p className="text-gray-600 mb-1">📍 {event.business}</p>
                                            {event.description && (
                                                <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                                            )}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {event.date}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                {event.category}
                                            </span>
                                            {event.photo_url && (
                                                <img 
                                                    src={event.photo_url} 
                                                    alt={event.title}
                                                    className="w-16 h-16 rounded-lg object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed rounded-xl">
                                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Yet</h3>
                                <p className="text-gray-500">Be the first business to add an event!</p>
                            </div>
                        )}
                    </div>
                </div> 
            )}
            {activeTab === 'collections' && ( <div><h2 className="text-3xl font-bold text-gray-900 mb-6">📚 Themed Collections</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{collections.map((collection, index) => (<div key={index} className={`bg-gradient-to-br ${collection.color} text-white rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer`}><div className="flex items-center mb-4">{collection.icon}<h3 className="text-xl font-bold ml-3">{collection.title}</h3></div><p className="text-white/90">{collection.businesses} curated businesses</p></div>))}</div></div> )}
            
            {activeTab === 'browse' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">🔍 Browse Businesses</h2>
                  <div className="flex flex-wrap gap-4 items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4 flex-wrap">
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 rounded-lg border bg-white focus:ring-2 focus:ring-blue-500"><option value="rating">Sort by Rating</option><option value="reviews">Sort by Reviews</option><option value="name">Sort by Name</option></select>
                      <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))} className="p-2 rounded-lg border bg-white focus:ring-2 focus:ring-blue-500"><option value="0">All Ratings</option><option value="4">4+ stars</option><option value="3">3+ stars</option></select>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={filterOpenNow} onChange={(e) => setFilterOpenNow(e.target.checked)} className="rounded text-purple-600" /><span className="text-sm font-medium">Open Now</span></label>
                    </div>
                    <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200">
                      <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-100'}`}><List className="w-5 h-5" /></button>
                      <button onClick={() => setViewMode('map')} className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow' : 'hover:bg-gray-100'}`}><MapIcon className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {Object.keys(dataByCategory).map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-full font-semibold capitalize transition-all ${category === cat ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>{cat} ({dataByCategory[cat].length})</button>))}
                  </div>
                  {viewMode === 'grid' ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredAndSortedData.map((b) => <BusinessCard key={b.id} business={b} />)}</div> : <div className="h-[600px] rounded-2xl overflow-hidden shadow-lg border"><MapContainer center={[47.2529, -122.4443]} zoom={13}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{filteredAndSortedData.filter(b=>b.coordinates).map(b=><Marker key={b.id} position={[b.coordinates.lat, b.coordinates.lng]}><Popup>{b.name}</Popup></Marker>)}</MapContainer></div>}
                </div>
            )}

            {selectedBusiness && <BusinessDetailModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} renderStars={renderStars} user={user} authLoading={authLoading} />}
        </main>
    );
}