// src/EditBusinessPage.jsx (VERSIÓN LIMPIA Y CORREGIDA)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabaseClient';
import PhotoUploadManager from './PhotoUploadManager';
import { Image as ImageIcon, Trash2 } from 'lucide-react';

// Configuración de URLs para Edge Functions
const DELETE_PHOTO_URL = import.meta.env.VITE_SUPABASE_DELETE_URL || 
  'https://dkisgcdpimagrpujochw.supabase.co/functions/v1/delete-photo';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function EditBusinessPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  const queryClient = useQueryClient();

  // DEBUG: Verificar businessId inmediatamente
  console.log("🔍 businessId from useParams:", businessId);
  console.log("🔍 location.pathname:", location.pathname);
  console.log("🔍 typeof businessId:", typeof businessId);

  const showPhotosSection = location.hash === '#photos';

  const [formData, setFormData] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [currentBusinessPhotos, setCurrentBusinessPhotos] = useState([]);

  const { data: business, isLoading, isError } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const parsedBusinessId = parseInt(businessId);
      if (isNaN(parsedBusinessId)) {
        throw new Error("Business ID is invalid.");
      }
      const { data, error } = await supabase.from('businesses').select('*').eq('id', parsedBusinessId).single();
      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`Business with ID ${businessId} not found.`);
          navigate('/dashboard'); 
          return null; 
        }
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!businessId && !isNaN(parseInt(businessId)),
  });

  // Cargar datos del negocio y fotos
  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        location: business.location || '',
        category: business.category || '',
        description: business.description || '',
        hours: business.hours || '',
        phone: business.phone || '',
        website: business.website || '',
        tour_3d_url: business.tour_3d_url || '',
      });
      
      // Obtener fotos del negocio actual
      const fetchPhotos = async () => {
        const { data: photosData, error: photosError } = await supabase
          .from('business_photos')
          .select('*')
          .eq('business_id', business.id)
          .order('order_index', { ascending: true });

        if (photosError) {
          console.error('Error fetching existing photos:', photosError);
          return [];
        }
        setCurrentBusinessPhotos(photosData || []);
      };
      fetchPhotos();
    }
  }, [business]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveError(null);
    setSaveSuccess(null);
  };

  const updateBusinessMutation = useMutation({
    mutationFn: async (updatedData) => {
      // DEBUG: Verificar datos antes de actualizar
      console.log("📝 Form data to update:", updatedData);
      console.log("📝 businessId for update:", businessId);
      console.log("📝 businessId type:", typeof businessId);
      console.log("📝 businessId parsed:", parseInt(businessId));
      
      if (!businessId || businessId === 'undefined') {
        throw new Error("Business ID is missing");
      }
      
      // Usar el businessId de los params
      const { error } = await supabase
        .from('businesses')
        .update(updatedData)
        .eq('id', parseInt(businessId));
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      setSaveSuccess("Business profile updated successfully! Redirecting...");
      
      // Redirección automática después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    },
    onError: (error) => {
      console.error("Error updating business profile:", error);
      setSaveError("Error updating business profile: " + error.message);
    },
  });

  const handleUpdateBusiness = (e) => {
    e.preventDefault();
    
    // DEBUG: Verificar datos antes de enviar
    console.log("📝 About to submit form data:", formData);
    console.log("📝 Current businessId:", businessId);
    
    if (!businessId || businessId === 'undefined') {
      setSaveError("Error: Business ID is missing");
      return;
    }
    
    updateBusinessMutation.mutate(formData);
  };

  const handlePhotoUploadSuccess = (newDbRecords) => {
    console.log('Photos uploaded and registered in DB:', newDbRecords);
    setCurrentBusinessPhotos(prevPhotos => [...prevPhotos, ...newDbRecords]);
    setSaveSuccess('Photos uploaded and saved to the database!');
  };

  // Función para eliminar fotos usando Edge Function
  const handleDeletePhoto = async (photoId, photoUrl) => {
    console.log("🗑️ Delete photo triggered for ID:", photoId);
    
    if (!window.confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Extraer el storage path de la URL
      const urlParts = photoUrl.split('business-photos/');
      if (urlParts.length < 2) {
        throw new Error("Could not extract file path from photo URL");
      }
      const storagePath = urlParts[1];

      console.log("🔗 Photo URL:", photoUrl);
      console.log("📁 Storage path:", storagePath);

      // Llamar a la Edge Function
      const response = await fetch(DELETE_PHOTO_URL, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          photoId: photoId,
          storagePath: storagePath
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Edge Function error:", errorText);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Photo deleted successfully:", result);

      // Actualizar estado local
      setCurrentBusinessPhotos(prevPhotos => 
        prevPhotos.filter(photo => photo.id !== photoId)
      );
      
      setSaveSuccess("Photo deleted successfully!");
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });

    } catch (error) {
      console.error("❌ Error deleting photo:", error);
      setSaveError("Error deleting photo: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading business details...</p>
      </div>
    );
  }

  if (isError) {
    return <div className="max-w-4xl mx-auto p-6 text-center text-red-500">Error loading business data.</div>;
  }

  if (!business) {
    return <div className="max-w-4xl mx-auto p-6 text-center text-red-500">Business not found or unauthorized.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
        <h1 className="text-3xl font-bold mb-6">Edit Business: <span className="text-purple-600">{business.name}</span></h1>
        
        <div className="flex gap-4 mb-8 border-b pb-4">
          <button 
            onClick={() => navigate(`/dashboard/edit/${business.id}`)}
            className={`py-2 px-4 rounded-lg font-semibold transition-colors ${!showPhotosSection ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Business Details
          </button>
          <button 
            onClick={() => navigate(`/dashboard/edit/${business.id}#photos`)}
            className={`py-2 px-4 rounded-lg font-semibold transition-colors ${showPhotosSection ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Manage Photos
          </button>
        </div>

        {!showPhotosSection ? (
          <form onSubmit={handleUpdateBusiness} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Business Name *</label>
              <input 
                name="name" 
                required 
                value={formData.name || ''} 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 mt-1" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Category *</label>
              <select 
                name="category" 
                value={formData.category || 'restaurants'} 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="restaurants">Restaurant</option>
                <option value="hotels">Hotel</option>
                <option value="clinics">Clinic</option>
                <option value="gyms">Gym</option>
                <option value="stores">Store</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium">Address *</label>
              <input 
                name="location" 
                required 
                value={formData.location || ''} 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 mt-1" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea 
                name="description" 
                rows="3" 
                value={formData.description || ''} 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Hours</label>
              <input 
                name="hours" 
                value={formData.hours || ''} 
                placeholder="e.g., 9:00 AM - 10:00 PM" 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 mt-1" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Phone Number</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone || ''} 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 mt-1" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Website URL</label>
              <input 
                type="url" 
                name="website" 
                value={formData.website || ''} 
                placeholder="https://example.com" 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 mt-1" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">3D Tour URL</label>
              <input 
                type="url" 
                name="tour_3d_url" 
                value={formData.tour_3d_url || ''} 
                placeholder="https://my.matterport.com/..." 
                onChange={handleChange} 
                className="w-full border rounded-lg p-2 mt-1" 
              />
            </div>
            
            {saveError && (
              <p className="text-red-600 text-sm mt-2">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-green-600 text-sm mt-2">{saveSuccess}</p>
            )}

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')} 
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={updateBusinessMutation.isPending} 
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:bg-purple-300"
              >
                {updateBusinessMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            <PhotoUploadManager 
              businessId={business.id}
              onUploadSuccess={handlePhotoUploadSuccess}
            />

            {saveError && (
              <p className="text-red-600 text-sm mt-2">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-green-600 text-sm mt-2">{saveSuccess}</p>
            )}

            {currentBusinessPhotos.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Photo Gallery</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {currentBusinessPhotos.map((photo, index) => (
                    <div key={photo.id || photo.url || index} className="relative aspect-w-1 aspect-h-1 group">
                      <img 
                        src={`${photo.url}?t=${new Date().getTime()}`}
                        alt={`Business photo ${index + 1}`} 
                        className="w-full h-full object-cover rounded-lg shadow-sm" 
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.id, photo.url)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 hover:bg-red-700"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => navigate('/dashboard')}
                className="py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}