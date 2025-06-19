// Busines
// BusinessPortal.jsx (Fully Translated to English)

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Star, Clock, Camera, Zap, Plus, X, Map as MapIcon, List, Heart, Calendar, Coffee, Utensils, ShoppingBag, TrendingUp, Filter } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet icon fix for React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- SAMPLE DATA IN ENGLISH ---
const initialShowcaseData = {
  restaurants: [
    { id: 1, name: "Taco Loco", embedUrl: "https://tourvirtual3d.com/embed/123", category: "Mexican Cuisine", type: "3d", rating: 4.8, reviewsCount: 124, location: "Downtown", hours: "9AM - 10PM", hours24: { open: 9, close: 22 }, images: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400"], coordinates: { lat: 47.2520, lng: -122.4442 }, reviewsList: [{ user: "Alice", rating: 5, comment: "The best tacos in town!" }], isNew: false, featured: true, specialOffer: "20% off tacos on Tuesdays" },
    { id: 2, name: "Modern Bistro", category: "Fine Dining", type: "photos", rating: 4.6, reviewsCount: 89, location: "Proctor District", hours: "5PM - 11PM", hours24: { open: 17, close: 23 }, images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"], coordinates: { lat: 47.2580, lng: -122.4620 }, reviewsList: [{ user: "Charles", rating: 5, comment: "Exceptional dining experience." }], isNew: true, featured: true, specialOffer: "2-for-1 tasting menu" },
    { id: 5, name: "Burger Palace", category: "American Food", type: "photos", rating: 4.2, reviewsCount: 67, location: "Tacoma Mall", hours: "11AM - 9PM", hours24: { open: 11, close: 21 }, images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"], coordinates: { lat: 47.2173, lng: -122.4727 }, reviewsList: [{ user: "Bob", rating: 4, comment: "Great burgers, but service is a bit slow." }], isNew: false, featured: false }
  ],
  hotels: [
    { id: 6, name: "Grand Plaza Hotel", embedUrl: "https://tourvirtual3d.com/embed/789", category: "Luxury Hotel", type: "3d", rating: 4.7, reviewsCount: 203, location: "City Center", hours: "24/7", hours24: { open: 0, close: 24 }, images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"], coordinates: { lat: 47.2538, lng: -122.4384 }, reviewsList: [{ user: "Charlie", rating: 5, comment: "Impeccable service." }], isNew: false, featured: true }
  ],
  clinics: [
    { id: 7, name: "Health Plus Clinic", category: "General Medicine", type: "photos", rating: 4.5, reviewsCount: 156, location: "Stadium District", hours: "8AM - 6PM", hours24: { open: 8, close: 18 }, images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400"], coordinates: { lat: 47.2430, lng: -122.4590 }, reviewsList: [{ user: "Diana", rating: 5, comment: "Quality medical attention." }], isNew: true, featured: false }
  ],
  gyms: [], schools: [], stores: []
};

const events = [
  { id: 1, title: "Live Music - Jazz Night", business: "Aurora Cafe", date: "Today 7:00 PM", category: "Music" },
  { id: 2, title: "Italian Cooking Class", business: "Modern Bistro", date: "Tomorrow 6:00 PM", category: "Gastronomy" }
];

const collections = [
  { title: "Perfect for Remote Work", icon: <Coffee className="w-5 h-5" />, businesses: 12, color: "from-amber-500 to-orange-600" },
  { title: "Romantic Dinners", icon: <Utensils className="w-5 h-5" />, businesses: 8, color: "from-rose-500 to-pink-600" },
  { title: "Shop Local", icon: <ShoppingBag className="w-5 h-5" />, businesses: 15, color: "from-purple-500 to-indigo-600" }
];


// --- MAIN COMPONENT ---
export default function BusinessPortal() {
  const [data, setData] = useState(initialShowcaseData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isListModalOpen, setListModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('featured');
  const [favorites, setFavorites] = useState(new Set());
  const [category, setCategory] = useState("restaurants");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("rating");
  const [filterRating, setFilterRating] = useState(0);
  const [filterOpenNow, setFilterOpenNow] = useState(false);

  useEffect(() => {
    setTimeout(() => setData(initialShowcaseData), 500);
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let items = data[category] || [];
    if (searchTerm && activeTab === 'browse') {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterOpenNow) {
      const now = new Date();
      const currentHour = now.getHours();
      items = items.filter(item => {
        if (item.hours24.open === 0 && item.hours24.close === 24) return true;
        return currentHour >= item.hours24.open && currentHour < item.hours24.close;
      });
    }
    if (filterRating > 0) {
      items = items.filter(item => item.rating >= filterRating);
    }
    items.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewsCount - a.reviewsCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
    return items;
  }, [data, category, searchTerm, filterOpenNow, filterRating, sortBy, activeTab]);

  const allBusinesses = Object.values(data).flat();
  const featuredBusinesses = allBusinesses.filter(b => b.featured);
  const newBusinesses = allBusinesses.filter(b => b.isNew);

  const renderStars = (rating) => (
    Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)
  );

  const toggleFavorite = (businessId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(businessId)) newFavorites.delete(businessId);
    else newFavorites.add(businessId);
    setFavorites(newFavorites);
  };

  const handleAddBusiness = (newBusiness) => {
    const newBusinessWithId = { ...newBusiness, id: Date.now() };
    setData(prevData => ({ ...prevData, [newBusiness.mainCategory]: [...prevData[newBusiness.mainCategory], newBusinessWithId] }));
    setListModalOpen(false);
    setActiveTab('browse');
    setCategory(newBusiness.mainCategory);
  };

  const BusinessCard = ({ business, featured = false }) => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer" onClick={() => setSelectedBusiness(business)}>
      <div className="relative">
        <img src={business.images[0]} alt={business.name} className="w-full h-48 object-cover" />
        <div className="absolute top-3 left-3">
          {business.type === '3d' ? (
            <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg tracking-wider">
              <Camera className="w-4 h-4" />
              <span>3D TOUR</span>
            </div>
          ) : business.isNew ? (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              New
            </div>
          ) : null}
        </div>
        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(business.id); }} className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors">
          <Heart className={`w-4 h-4 ${favorites.has(business.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
        {featured && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4"><div className="flex items-center text-white text-sm"><Zap className="w-4 h-4 mr-1 text-yellow-400" />Featured</div></div>}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg text-gray-900">{business.name}</h3><span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{business.category}</span></div>
        <div className="flex items-center mb-2">{renderStars(business.rating)}<span className="ml-1 text-sm font-semibold">{business.rating}</span><span className="ml-1 text-sm text-gray-500">({business.reviewsCount})</span></div>
        <div className="flex items-center text-sm text-gray-600 mb-3"><MapPin className="w-4 h-4 mr-1" />{business.location}</div>
        {business.specialOffer && <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border-l-4 border-blue-500"><p className="text-sm font-semibold text-blue-800">{business.specialOffer}</p></div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <main className="max-w-7xl mx-auto p-6 pt-12">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search for businesses, services, stores..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg"
            value={searchTerm} onChange={(e) => {
              setSearchTerm(e.target.value);
              setActiveTab('browse');
            }} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-white rounded-2xl shadow-lg p-6 text-center transition-transform hover:scale-105"><div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><TrendingUp className="w-8 h-8 text-blue-600" /></div><h3 className="text-2xl font-bold text-gray-900">{allBusinesses.length}</h3><p className="text-gray-600">Businesses Listed</p></div>
           <div className="bg-white rounded-2xl shadow-lg p-6 text-center transition-transform hover:scale-105"><div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Star className="w-8 h-8 text-green-600" /></div><h3 className="text-2xl font-bold text-gray-900">1,240+</h3><p className="text-gray-600">Reviews Written</p></div>
           <div className="bg-white rounded-2xl shadow-lg p-6 text-center transition-transform hover:scale-105"><div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8 text-purple-600" /></div><h3 className="text-2xl font-bold text-gray-900">{events.length}</h3><p className="text-gray-600">Events This Week</p></div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          {[
            { id: 'featured', label: 'Featured', icon: <Zap className="w-4 h-4" /> },
            { id: 'new', label: 'New Arrivals', icon: <Star className="w-4 h-4" /> },
            { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
            { id: 'collections', label: 'Collections', icon: <Filter className="w-4 h-4" /> },
            { id: 'browse', label: 'Browse All', icon: <List className="w-4 h-4" /> }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
        
        {activeTab === 'featured' && (
          <div><h2 className="text-3xl font-bold text-gray-900 mb-6">✨ Featured Businesses</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{featuredBusinesses.map((business) => <BusinessCard key={business.id} business={business} featured={true} />)}</div></div>
        )}

        {activeTab === 'new' && (
          <div><h2 className="text-3xl font-bold text-gray-900 mb-6">🆕 New Arrivals</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{newBusinesses.map((business) => <BusinessCard key={business.id} business={business} />)}</div></div>
        )}

        {activeTab === 'events' && (
          <div><h2 className="text-3xl font-bold text-gray-900 mb-6">📅 This Week's Events</h2><div className="space-y-4">{events.map((event) => (<div key={event.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"><div className="flex items-start justify-between"><div><h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3><p className="text-gray-600 mb-1">📍 {event.business}</p><div className="flex items-center text-sm text-gray-500"><Clock className="w-4 h-4 mr-1" />{event.date}</div></div><span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">{event.category}</span></div></div>))}</div></div>
        )}

        {activeTab === 'collections' && (
          <div><h2 className="text-3xl font-bold text-gray-900 mb-6">📚 Themed Collections</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{collections.map((collection, index) => (<div key={index} className={`bg-gradient-to-br ${collection.color} text-white rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer`}><div className="flex items-center mb-4">{collection.icon}<h3 className="text-xl font-bold ml-3">{collection.title}</h3></div><p className="text-white/90">{collection.businesses} curated businesses</p></div>))}</div></div>
        )}

        {activeTab === 'browse' && (
          <div>
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-lg">
              <div className="flex items-center gap-4 flex-wrap">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 rounded-lg border bg-white focus:ring-2 focus:ring-blue-500"><option value="rating">Sort by Rating</option><option value="reviews">Sort by Reviews</option><option value="name">Sort by Name</option></select>
                <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))} className="p-2 rounded-lg border bg-white focus:ring-2 focus:ring-blue-500"><option value="0">All Ratings</option><option value="4">4 stars & up</option><option value="3">3 stars & up</option></select>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={filterOpenNow} onChange={(e) => setFilterOpenNow(e.target.checked)} className="rounded" /><span className="text-sm font-medium">Open Now</span></label>
              </div>
              <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-100'}`}><List className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('map')} className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow' : 'hover:bg-gray-100'}`}><MapIcon className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-8">{Object.keys(data).map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-full font-semibold transition-all capitalize ${category === cat ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border'}`}>{cat} ({data[cat].length})</button>))}</div>
            {viewMode === 'grid' ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredAndSortedData.map((item) => (<BusinessCard key={item.id} business={item} />))}</div>) : (<div className="h-[600px] rounded-2xl overflow-hidden shadow-lg border"><MapContainer center={[47.2529, -122.4443]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{filteredAndSortedData.map(item => (<Marker key={item.id} position={[item.coordinates.lat, item.coordinates.lng]}><Popup><div className="font-bold">{item.name}</div><div>{renderStars(item.rating)} {item.rating}</div><button onClick={() => setSelectedBusiness(item)} className="text-blue-600 font-semibold mt-2">View Details →</button></Popup></Marker>))}</MapContainer></div>)}
            {filteredAndSortedData.length === 0 && (<div className="text-center py-16"><Search className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Found</h3><p className="text-gray-500">Try adjusting your search filters.</p></div>)}
          </div>
        )}
      </main>
      
      {selectedBusiness && <BusinessDetailModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} renderStars={renderStars} />}
      {isListModalOpen && <ListBusinessModal onClose={() => setListModalOpen(false)} onAddBusiness={handleAddBusiness} />}
    </div>
  );
}

// --- Modal Components in English ---

function BusinessDetailModal({ business, onClose, renderStars }) {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in-0 zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10 bg-white rounded-full p-2 shadow-lg"><X className="w-5 h-5" /></button>
                <div className="h-64 bg-gray-200 rounded-t-2xl overflow-hidden">
                    {business.type === '3d' && business.embedUrl ? (<iframe src={business.embedUrl} title={`3D tour of ${business.name}`} className="w-full h-full border-0" loading="lazy" allowFullScreen />) : (<img src={business.images[0]} alt={business.name} className="w-full h-full object-cover"/>)}
                </div>
                <div className="p-6">
                    <h2 className="text-3xl font-bold mb-2">{business.name}</h2>
                    <div className="flex items-center gap-2 mb-4"><div className="flex">{renderStars(business.rating)}</div><span className="text-gray-600">({business.reviewsCount} reviews)</span></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 mb-6">
                        <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-500"/>{business.location}</div>
                        <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-purple-500"/>{business.hours}</div>
                        <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500"/>{business.category}</div>
                        {business.type === '3d' && (<div className="flex items-center gap-2"><Camera className="w-5 h-5 text-purple-500"/>Virtual 3D Tour</div>)}
                    </div>
                    {business.specialOffer && (<div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6"><h3 className="font-semibold text-blue-800 mb-1">Special Offer</h3><p className="text-blue-700">{business.specialOffer}</p></div>)}
                    <h3 className="text-xl font-bold mb-4">Reviews</h3>
                    <div className="space-y-4">{business.reviewsList.map((review, i) => (<div key={i} className="border-l-4 border-purple-200 pl-4"><div className="flex items-center gap-2 mb-1"><div className="flex">{renderStars(review.rating)}</div></div><p className="text-gray-800 my-1">{review.comment}</p><p className="text-sm text-gray-500 font-semibold">- {review.user}</p></div>))}</div>
                </div>
            </div>
        </div>
    );
}

function ListBusinessModal({ onClose, onAddBusiness }) {
    const [formData, setFormData] = useState({ name: '', mainCategory: 'restaurants', location: '', category: '', hours: '' });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => {
        e.preventDefault();
        const newBusiness = { ...formData, id: Date.now(), type: 'photos', rating: 0, reviewsCount: 0, hours: formData.hours || '9AM - 6PM', hours24: { open: 9, close: 18 }, images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400'], coordinates: { lat: 47.2529, lng: -122.4443 }, reviewsList: [], category: formData.category || 'New Listing', isNew: true, featured: false };
        onAddBusiness(newBusiness);
    };
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative animate-in fade-in-0 zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold mb-6">List Your Business</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label><input type="text" name="name" id="name" required className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., My Restaurant" value={formData.name} onChange={handleChange}/></div>
                    <div><label htmlFor="mainCategory" className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label><select name="mainCategory" id="mainCategory" className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.mainCategory} onChange={handleChange}><option value="restaurants">Restaurants</option><option value="hotels">Hotels</option><option value="clinics">Clinics</option><option value="gyms">Gyms</option><option value="schools">Schools</option><option value="stores">Stores</option></select></div>
                    <div><label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Specialty</label><input type="text" name="category" id="category" className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Italian Food, Boutique Hotel" value={formData.category} onChange={handleChange}/></div>
                    <div><label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location *</label><input type="text" name="location" id="location" required className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Downtown, Proctor District" value={formData.location} onChange={handleChange}/></div>
                    <div><label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label><input type="text" name="hours" id="hours" className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 9AM - 9PM" value={formData.hours} onChange={handleChange}/></div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><h3 className="font-semibold text-blue-800 mb-2">Want to feature a 3D Virtual Tour?</h3><p className="text-sm text-blue-700">Contact us after registration to make your business stand out and attract more customers.</p></div>
                    <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">List Business</button>
                </form>
            </div>
        </div>
    );
}