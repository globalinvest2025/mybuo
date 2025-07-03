// EventsPage.jsx - Sistema completo de gestión de eventos
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabaseClient';
import { 
    PlusCircle, Calendar, Clock, MapPin, Edit, Trash2, 
    Camera, X, ChevronLeft, ChevronRight, RotateCcw 
} from 'lucide-react';

// --- Add Event Modal Component ---
function AddEventModal({ onClose, onAddEvent, isSubmitting, selectedDate, businesses }) {
    const [formData, setFormData] = useState({
        business_id: '',
        title: '',
        description: '',
        start_date: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
        end_date: '',
        is_recurring: false,
        recurrence_pattern: 'weekly',
        photo_url: ''
    });
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Photo must be less than 5MB');
                return;
            }
            
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                alert('Only JPG, PNG, and WEBP files are allowed');
                return;
            }
            
            setSelectedPhoto(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setSelectedPhoto(null);
        setPhotoPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.business_id || !formData.title || !formData.start_date) {
            alert('Please fill in all required fields.');
            return;
        }

        // Auto-set end_date if not provided (1 hour after start)
        let endDate = formData.end_date;
        if (!endDate && formData.start_date) {
            const startDate = new Date(formData.start_date);
            startDate.setHours(startDate.getHours() + 1);
            endDate = startDate.toISOString().slice(0, 16);
        }

        let photoUrl = '';
        
        // Upload photo if selected
        if (selectedPhoto) {
            try {
                const formDataUpload = new FormData();
                formDataUpload.append('businessId', formData.business_id);
                formDataUpload.append('photos', selectedPhoto);
                formDataUpload.append('order_0', 0);

                const UPLOAD_FUNCTION_URL = import.meta.env.VITE_SUPABASE_UPLOAD_URL || 
                    'https://dkisgcdpimagrpujochw.supabase.co/functions/v1/upload-photos';
                const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

                const uploadResponse = await fetch(UPLOAD_FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    },
                    body: formDataUpload,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    photoUrl = uploadResult.publicUrls?.[0] || uploadResult.dbRecords?.[0]?.url || '';
                }
            } catch (error) {
                console.error('Error uploading photo:', error);
                // Continue without photo if upload fails
            }
        }

        const eventData = {
            ...formData,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(endDate).toISOString(),
            photo_url: photoUrl
        };

        onAddEvent(eventData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative my-auto animate-in fade-in-0 zoom-in-95">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    Add New Event
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Business Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Business *
                        </label>
                        <select
                            name="business_id"
                            value={formData.business_id}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-2"
                            required
                        >
                            <option value="">Choose a business...</option>
                            {businesses?.map(business => (
                                <option key={business.id} value={business.id}>
                                    {business.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Event Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Jazz Night, Happy Hour, Grand Opening"
                            className="w-full border rounded-lg p-2"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Event details, special offers, requirements..."
                            className="w-full border rounded-lg p-2"
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2"
                            />
                        </div>
                    </div>

                    {/* Recurring Event */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="checkbox"
                                name="is_recurring"
                                checked={formData.is_recurring}
                                onChange={handleChange}
                                className="rounded text-purple-600"
                            />
                            <label className="text-sm font-medium text-gray-700">
                                Recurring Event
                            </label>
                        </div>
                        
                        {formData.is_recurring && (
                            <select
                                name="recurrence_pattern"
                                value={formData.recurrence_pattern}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        )}
                    </div>

                    {/* Event Photo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Photo (optional)
                        </label>
                        
                        {!photoPreview ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 mb-2">Upload an event photo</p>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                    id="event-photo-upload"
                                />
                                <label
                                    htmlFor="event-photo-upload"
                                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-purple-200 transition-colors"
                                >
                                    Choose Photo
                                </label>
                                <p className="text-xs text-gray-500 mt-2">JPG, PNG, WEBP (Max 5MB)</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <img 
                                    src={photoPreview} 
                                    alt="Event preview" 
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                                >
                                    ×
                                </button>
                                <p className="text-sm text-gray-600 mt-2">{selectedPhoto?.name}</p>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:bg-purple-300 mt-6"
                    >
                        {isSubmitting ? 'Creating Event...' : 'Create Event'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --- Event Card Component ---
function EventCard({ event, onEdit, onDelete, business }) {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    const isUpcoming = startDate > new Date();
    const isToday = startDate.toDateString() === new Date().toDateString();

    return (
        <div className={`bg-white rounded-xl border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${
            isToday ? 'border-l-green-500 bg-green-50' : 
            isUpcoming ? 'border-l-blue-500' : 'border-l-gray-300 opacity-75'
        }`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{business?.name}</p>
                    {event.description && (
                        <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                    )}
                </div>
                
                {event.photo_url && (
                    <img 
                        src={event.photo_url} 
                        alt={event.title}
                        className="w-16 h-16 rounded-lg object-cover ml-4"
                    />
                )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {startDate.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {endDate && ` - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </div>
                {event.is_recurring && (
                    <div className="flex items-center gap-1">
                        <RotateCcw className="w-4 h-4" />
                        {event.recurrence_pattern}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {isToday && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Today
                        </span>
                    )}
                    {isUpcoming && !isToday && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Upcoming
                        </span>
                    )}
                    {!isUpcoming && !isToday && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                            Past
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(event)}
                        className="text-purple-600 hover:text-purple-800 p-1"
                        title="Edit Event"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(event.id, event.title)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete Event"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Mini Calendar Component ---
function MiniCalendar({ events, selectedDate, onDateSelect }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const days = [];
    
    // Previous month days
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const hasEvents = events.some(event => {
            const eventDate = new Date(event.start_date);
            return eventDate.toDateString() === date.toDateString();
        });
        
        days.push({
            day,
            date,
            hasEvents,
            isSelected: selectedDate?.toDateString() === date.toDateString(),
            isToday: date.toDateString() === new Date().toDateString()
        });
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((dayInfo, index) => (
                    <button
                        key={index}
                        onClick={() => dayInfo && onDateSelect(dayInfo.date)}
                        disabled={!dayInfo}
                        className={`
                            relative h-8 text-sm rounded transition-colors
                            ${!dayInfo ? 'invisible' : ''}
                            ${dayInfo?.isToday ? 'bg-blue-100 text-blue-800 font-bold' : ''}
                            ${dayInfo?.isSelected ? 'bg-purple-600 text-white' : ''}
                            ${dayInfo?.hasEvents ? 'font-semibold' : ''}
                            ${!dayInfo?.isSelected && !dayInfo?.isToday ? 'hover:bg-gray-100' : ''}
                        `}
                    >
                        {dayInfo?.day}
                        {dayInfo?.hasEvents && (
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

// --- Main EventsPage Component ---
function EventsPage({ user }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming', 'all', 'calendar'
    const queryClient = useQueryClient();

    // Fetch user's businesses
    const { data: businesses } = useQuery({
        queryKey: ['businesses', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!user,
    });

    // Fetch events
    const { data: events, isLoading } = useQuery({
        queryKey: ['events', user?.id],
        queryFn: async () => {
            if (!user || !businesses?.length) return [];
            
            const businessIds = businesses.map(b => b.id);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .in('business_id', businessIds)
                .order('start_date', { ascending: true });
            
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!user && !!businesses?.length,
    });

    // Add event mutation
    const addEventMutation = useMutation({
        mutationFn: async (eventData) => {
            const { data, error } = await supabase
                .from('events')
                .insert([eventData])
                .select();
            
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events', user?.id] });
            setIsModalOpen(false);
            setSelectedDate(null);
        },
    });

    // Delete event mutation
    const deleteEventMutation = useMutation({
        mutationFn: async (eventId) => {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events', user?.id] });
        },
    });

    const handleDeleteEvent = (eventId, eventTitle) => {
        if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
            deleteEventMutation.mutate(eventId);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    // Filter events based on view mode
    const filteredEvents = events?.filter(event => {
        const eventDate = new Date(event.start_date);
        const now = new Date();
        
        switch (viewMode) {
            case 'upcoming':
                return eventDate >= now;
            case 'past':
                return eventDate < now;
            default:
                return true;
        }
    }) || [];

    if (!businesses?.length) {
        return (
            <div className="text-center py-10">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Businesses Found</h3>
                <p className="text-gray-500 mb-4">
                    You need to add a business first before creating events.
                </p>
                <button 
                    onClick={() => window.location.href = '/dashboard/businesses'} 
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700"
                >
                    Add Your First Business
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="text-center py-10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent" />
                <p className="mt-4 font-semibold text-xl text-gray-700">Loading Events...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        Your Events
                    </h2>
                    <p className="text-gray-600 mt-1">Manage events for your businesses</p>
                </div>
                
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <PlusCircle className="w-5 h-5" />
                    Add New Event
                </button>
            </div>

            {/* View Mode Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'upcoming', label: 'Upcoming Events', count: events?.filter(e => new Date(e.start_date) >= new Date()).length },
                    { id: 'past', label: 'Past Events', count: events?.filter(e => new Date(e.start_date) < new Date()).length },
                    { id: 'all', label: 'All Events', count: events?.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                            viewMode === tab.id 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border'
                        }`}
                    >
                        {tab.label}
                        <span className="bg-black/20 px-2 py-1 rounded-full text-xs">
                            {tab.count || 0}
                        </span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Events List */}
                <div className="lg:col-span-3">
                    {filteredEvents.length > 0 ? (
                        <div className="space-y-4">
                            {filteredEvents.map(event => {
                                const business = businesses.find(b => b.id === event.business_id);
                                return (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        business={business}
                                        onEdit={() => {/* TODO: Implement edit */}}
                                        onDelete={handleDeleteEvent}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-xl">
                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                {viewMode === 'upcoming' ? 'No Upcoming Events' : 
                                 viewMode === 'past' ? 'No Past Events' : 'No Events Yet'}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Start promoting your business by creating events!
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Create Your First Event
                            </button>
                        </div>
                    )}
                </div>

                {/* Mini Calendar */}
                <div className="lg:col-span-1">
                    <MiniCalendar
                        events={events || []}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                    />
                </div>
            </div>

            {/* Add Event Modal */}
            {isModalOpen && (
                <AddEventModal
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedDate(null);
                    }}
                    onAddEvent={addEventMutation.mutate}
                    isSubmitting={addEventMutation.isPending}
                    selectedDate={selectedDate}
                    businesses={businesses}
                />
            )}
        </>
    );
}

export default EventsPage;