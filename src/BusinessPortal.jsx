// BusinessPortal.jsx - VERSIÓN FINAL, COMPLETA Y DEFINITIVA

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from './lib/supabaseClient';
import { Search, MapPin, Star, Clock, Camera, Zap, List, Heart, Calendar, Coffee, Utensils, ShoppingBag, TrendingUp, Filter, Map as MapIcon, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Datos estáticos
const events = [ { id: 1, title: "Live Music - Jazz Night", business: "The Cozy Owl Cafe", date: "Friday 8:00 PM", category: "Music" } ];
const collections = [ { title: "Perfect for Remote Work", icon: <Coffee className="w-6 h-6"/>, businesses: 12, color: "from-amber-500 to-orange-600" } ];

// Función para obtener los datos de negocios
const fetchBusinesses = async () => {
    const { data, error } = await supabase.from('businesses').select('*');
    if (error) throw new Error(error.message);
    return data || [];
};

// --- COMPONENTE MODAL DE DETALLE ---
function BusinessDetailModal({ business, onClose, renderStars }) {
    const allowedTourDomains = ['matterport.com', 'kuula.co', 'realsee.ai'];
    const isTourUrlValid = business.tour_3d_url && allowedTourDomains.some(domain => business.tour_3d_url.toLowerCase().includes(domain));

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative">
                <div className="w-full h-[28rem] bg-gray-200 rounded-t-2xl overflow-hidden flex-shrink-0">
                    {isTourUrlValid ? (
                        <iframe src={business.tour_3d_url} title={`3D tour of ${business.name}`} className="w-full h-full border-0" allow="fullscreen; vr" allowFullScreen />
                    ) : (
                        <img src={(business.images && business.images[0]) || 'https://placehold.co/800x600'} alt={business.name} className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="p-8 overflow-y-auto relative">
                    {/* --- BOTÓN CERRAR CORREGIDO --- */}
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    <h2 className="text-3xl font-bold mb-2 pr-12">{business.name}</h2>
                    <div className="flex items-center gap-2 mb-4"><div className="flex">{renderStars(business.rating)}</div><span className="text-gray-600">({business.reviewsCount || 0} reviews)</span></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 mb-6">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
                            <MapPin className="w-5 h-5 text-purple-500"/>
                            <span className="group-hover:underline group-hover:text-purple-700 transition-colors">{business.location}</span>
                        </a>
                        <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-purple-500"/>{business.hours}</div>
                        <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500"/>{business.category}</div>
                        {isTourUrlValid && (<div className="flex items-center gap-2"><Camera className="w-5 h-5 text-purple-500"/>Virtual 3D Tour available</div>)}
                    </div>
                    {business.specialOffer && (<div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6"><h3 className="font-semibold text-blue-800 mb-1">Special Offer</h3><p className="text-blue-700">{business.specialOffer}</p></div>)}
                    <h3 className="text-xl font-bold mb-4">Reviews</h3>
                    <div className="space-y-4">
                        {business.reviewsList && business.reviewsList.length > 0 ? (
                            business.reviewsList.map((review, i) => (
                                <div key={i} className="border-l-4 border-purple-200 pl-4">
                                    <div className="flex items-center gap-2 mb-1">{renderStars(review.rating)}</div>
                                    <p className="text-gray-800 my-1">"{review.comment}"</p>
                                    <p className="text-sm text-gray-500 font-semibold">- {review.user}</p>
                                </div>
                            ))
                        ) : <p className="text-gray-500">No reviews yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function BusinessPortal() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [activeTab, setActiveTab] = useState('browse');
    const [category, setCategory] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    const [sortBy, setSortBy] = useState("rating");
    const [filterRating, setFilterRating] = useState(0);
    const [filterOpenNow, setFilterOpenNow] = useState(false);
    const [favorites, setFavorites] = useState(() => { try { const saved = localStorage.getItem('mybuo-favorites'); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); } });

    useEffect(() => { localStorage.setItem('mybuo-favorites', JSON.stringify(Array.from(favorites))); }, [favorites]);

    const { data: businesses, isLoading, isError, error } = useQuery({ queryKey: ['businesses'], queryFn: fetchBusinesses });

    const dataByCategory = useMemo(() => {
        if (!businesses) return {};
        return businesses.reduce((acc, business) => {
            const cat = business.category || 'general';
            if (!acc[cat]) { acc[cat] = []; }
            acc[cat].push(business);
            return acc;
        }, {});
    }, [businesses]);
    
    useEffect(() => {
        if (!category && dataByCategory && Object.keys(dataByCategory).length > 0) {
            setCategory(Object.keys(dataByCategory)[0]);
        }
    }, [dataByCategory, category]);

    const allBusinesses = useMemo(() => businesses || [], [businesses]);
    const featuredBusinesses = useMemo(() => allBusinesses.filter(b => b.featured), [allBusinesses]);
    const newBusinesses = useMemo(() => allBusinesses.filter(b => b.isNew), [allBusinesses]);
    
    const filteredAndSortedData = useMemo(() => {
        let items = dataByCategory[category] || [];
        if (searchTerm) { items = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())); }
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
    }, [dataByCategory, category, searchTerm, filterOpenNow, filterRating, sortBy]);

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating || 0);
        return Array.from({ length: 5 }, (_, i) => (<Star key={i} className={`w-4 h-4 ${i < fullStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />));
    };

    const toggleFavorite = (businessId) => {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(businessId)) { newFavorites.delete(businessId); } else { newFavorites.add(businessId); }
        setFavorites(newFavorites);
    };

    const BusinessCard = ({ business, featured = false }) => (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer" onClick={() => setSelectedBusiness(business)}>
            <div className="relative">
                <img src={(business.images && business.images[0]) || 'https://placehold.co/400x200'} alt={business.name} className="w-full h-48 object-cover" />
                <div className="absolute top-3 left-3">
                    {business.tour_3d_url ? (<div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg tracking-wider"><Camera className="w-4 h-4" /><span>3D TOUR</span></div>) : business.isNew ? (<div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">New</div>) : null}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(business.id); }} className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"><Heart className={`w-5 h-5 transition-all ${favorites.has(business.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} /></button>
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
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center transition-transform hover:scale-105"><div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8 text-purple-600" /></div><h3 className="text-2xl font-bold text-gray-900">{events.length}</h3><p className="text-gray-600">Events This Week</p></div>
            </div>
            <div className="flex flex-wrap gap-4 mb-8">
              {[ { id: 'featured', label: 'Featured', icon: <Zap /> }, { id: 'new', label: 'New Arrivals', icon: <Star /> }, { id: 'events', label: 'Events', icon: <Calendar /> }, { id: 'collections', label: 'Collections', icon: <Filter /> }, { id: 'browse', label: 'Browse All', icon: <List /> } ].map((tab) => ( <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}> {React.cloneElement(tab.icon, {className: 'w-4 h-4'})} {tab.label} </button>))}
            </div>
            
            {activeTab === 'featured' && ( <div><h2 className="text-3xl font-bold text-gray-900 mb-6">✨ Featured Businesses</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{featuredBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)}</div></div> )}
            {activeTab === 'new' && ( <div><h2 className="text-3xl font-bold text-gray-900 mb-6">🆕 New Arrivals</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{newBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)}</div></div> )}
            {activeTab === 'events' && ( <div><h2 className="text-3xl font-bold text-gray-900 mb-6">📅 This Week's Events</h2><div className="space-y-4">{events.map((event) => (<div key={event.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"><div className="flex items-start justify-between"><div><h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3><p className="text-gray-600 mb-1">📍 {event.business}</p><div className="flex items-center text-sm text-gray-500"><Clock className="w-4 h-4 mr-1" />{event.date}</div></div><span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">{event.category}</span></div></div>))}</div></div> )}
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

            {selectedBusiness && <BusinessDetailModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} renderStars={renderStars} />}
        </main>
    );
}