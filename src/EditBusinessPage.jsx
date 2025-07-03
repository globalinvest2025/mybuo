// src/EditBusinessPage.jsx (VERSIÓN CORREGIDA PARA COORDENADAS - SIN ERRORES DE SINTAXIS)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabaseClient';
import PhotoUploadManager from './PhotoUploadManager';
import BusinessDashboard from './BusinessDashboard';
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

  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [currentBusinessPhotos, setCurrentBusinessPhotos] = useState([]);

  // Cargar business con coordenadas incluidas
  const { data: business, isLoading, isError } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const parsedBusinessId = parseInt(businessId);
      if (isNaN(parsedBusinessId)) {
        throw new Error("Business ID is invalid.");
      }
      // CRUCIAL: Seleccionar coordinates también
      const { data, error } = await supabase
        .from('businesses')
        .select('*, coordinates') // <--- Asegurar que coordinates se incluya
        .eq('id', parsedBusinessId)
        .single();
      
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

  // Cargar fotos del negocio
  useEffect(() => {
    if (business) {
      // Obtener fotos del negocio actual
      const fetchPhotos = async () => {
        console.log('🔍 Fetching photos for business:', business.id);
        
        const { data: photosData, error: photosError } = await supabase
          .from('business_photos')
          .select('*')
          .eq('business_id', business.id)
          .order('order_index', { ascending: true, nullsLast: true });

        if (photosError) {
          console.error('Error fetching existing photos:', photosError);
          return [];
        }
        
        console.log('📸 Photos fetched:', photosData);
        
        // Ensure all photos have order_index - assign if missing
        const photosWithOrder = (photosData || []).map((photo, index) => ({
          ...photo,
          order_index: photo.order_index !== null ? photo.order_index : index
        }));
        
        console.log('📸 Photos with order:', photosWithOrder);
        setCurrentBusinessPhotos(photosWithOrder);
      };
      fetchPhotos();
    }
  }, [business]);

  // Mutation para actualizar el negocio
  const updateBusinessMutation = useMutation({
    mutationFn: async (updatedData) => {
      // DEBUG: Verificar datos antes de actualizar
      console.log("📝 Form data to update:", updatedData);
      console.log("📝 businessId for update:", businessId);
      console.log("📝 Coordinates in data:", updatedData.coordinates);
      
      if (!businessId || businessId === 'undefined') {
        throw new Error("Business ID is missing");
      }
      
      // Actualizar en Supabase
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

  // Manejar guardado desde BusinessDashboard
  const handleSaveFromDashboard = (formDataFromDashboard) => {
    console.log("📝 Received data from BusinessDashboard:", formDataFromDashboard);
    console.log("📝 Coordinates received:", formDataFromDashboard.coordinates);
    
    if (!businessId || businessId === 'undefined') {
      setSaveError("Error: Business ID is missing");
      return;
    }
    
    // Llamar a la mutation con los datos del BusinessDashboard
    updateBusinessMutation.mutate(formDataFromDashboard);
  };

  const handlePhotoUploadSuccess = (newDbRecords) => {
    console.log('Photos uploaded and registered in DB:', newDbRecords);
    setCurrentBusinessPhotos(prevPhotos => [...prevPhotos, ...newDbRecords]);
    setSaveSuccess('Photos uploaded and saved to the database!');
  };

  // Drag & Drop functions for existing photos
  const handlePhotoDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhotoDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePhotoDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    console.log(`Moving photo from index ${dragIndex} to ${dropIndex}`);

    // Reorder photos array
    const reorderedPhotos = [...currentBusinessPhotos];
    const draggedPhoto = reorderedPhotos[dragIndex];
    reorderedPhotos.splice(dragIndex, 1);
    reorderedPhotos.splice(dropIndex, 0, draggedPhoto);

    // Update order_index for all photos
    const updatedPhotos = reorderedPhotos.map((photo, index) => ({
      ...photo,
      order_index: index
    }));

    // Update local state immediately for smooth UX
    setCurrentBusinessPhotos(updatedPhotos);
    setSaveSuccess('Photo order changed. Click "Save Changes" to confirm.');
  };

  // Save photo order changes
  const handleSavePhotoOrder = async () => {
    try {
      setSaveError(null);
      setSaveSuccess(null);
      
      console.log('💾 Saving photo order for business:', businessId);
      console.log('📸 Photos to update:', currentBusinessPhotos);
      
      // Update order in database one by one for better debugging
      for (let i = 0; i < currentBusinessPhotos.length; i++) {
        const photo = currentBusinessPhotos[i];
        console.log(`📸 Updating photo ${photo.id} with order_index: ${i}`);
        console.log(`📸 Photo details:`, photo);
        
        const { data, error, count } = await supabase
          .from('business_photos')
          .update({ order_index: i })
          .eq('id', photo.id)
          .select('*');
          
        if (error) {
          console.error(`❌ Error updating photo ${photo.id}:`, error);
          throw error;
        }
        
        console.log(`✅ Photo ${photo.id} updated successfully. Rows affected: ${count}, Data:`, data);
      }

      // Verify the updates were saved
      console.log('🔍 Verifying updates in database...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('business_photos')
        .select('id, order_index, url')
        .eq('business_id', businessId)
        .order('order_index', { ascending: true, nullsLast: true });
        
      if (verifyError) {
        console.error('❌ Error verifying updates:', verifyError);
      } else {
        console.log('✅ Database verification - Photos order:', verifyData);
        
        // Check if any photo actually has the new order_index
        const hasUpdatedOrder = verifyData.some(photo => photo.order_index !== null);
        if (!hasUpdatedOrder) {
          console.error('🚨 PROBLEM: No photos have order_index set! All are null.');
          
          // Try to check what IDs actually exist in the database
          const { data: allPhotos } = await supabase
            .from('business_photos')
            .select('*')
            .eq('business_id', businessId);
          
          console.log('🔍 All photos in database for business:', allPhotos);
          console.log('🔍 IDs we tried to update:', currentBusinessPhotos.map(p => p.id));
          
          // Check if IDs match
          const dbIds = allPhotos?.map(p => p.id) || [];
          const localIds = currentBusinessPhotos.map(p => p.id);
          const missingIds = localIds.filter(id => !dbIds.includes(id));
          
          if (missingIds.length > 0) {
            console.error('🚨 FOUND THE PROBLEM: These IDs don\'t exist in database:', missingIds);
          }
        } else {
          console.log('✅ Order updates were successful');
        }
      }

      console.log('✅ All photos order saved successfully');
      setSaveSuccess('Photo order saved successfully! Redirecting...');
      
      // Invalidate ALL related queries
      await queryClient.invalidateQueries({ queryKey: ['businesses'] });
      await queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      
      // Force refetch of the main businesses query used in BusinessPortal
      await queryClient.refetchQueries({ queryKey: ['businesses'] });
      
      console.log('🔄 Queries invalidated and refetched');
      
      // Navigate back to dashboard after delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('❌ Error saving photo order:', error);
      setSaveError('Error saving photo order: ' + error.message);
    }
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
          // Usar BusinessDashboard en lugar del formulario manual
          <BusinessDashboard 
            business={business}
            onSave={handleSaveFromDashboard}
            saveError={saveError}
            saveSuccess={saveSuccess}
            isLoading={updateBusinessMutation.isPending}
            onCancel={() => navigate('/dashboard')}
          />
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
                <p className="text-sm text-gray-600 mb-4">
                  📸 Drag photos to reorder • First photo = Cover photo
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {currentBusinessPhotos.map((photo, index) => (
                    <div 
                      key={photo.id || photo.url || index} 
                      draggable
                      onDragStart={(e) => handlePhotoDragStart(e, index)}
                      onDragOver={handlePhotoDragOver}
                      onDrop={(e) => handlePhotoDrop(e, index)}
                      className="relative aspect-w-1 aspect-h-1 group cursor-move hover:ring-2 hover:ring-purple-400 rounded-lg transition-all"
                    >
                      {/* Cover photo indicator */}
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs px-2 py-1 rounded-full z-20">
                          Cover
                        </div>
                      )}
                      
                      {/* Drag handle indicator */}
                      <div className="absolute top-1 right-8 bg-black/50 text-white text-xs px-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        ⋮⋮
                      </div>
                      
                      <img 
                        src={`${photo.url}?t=${new Date().getTime()}`}
                        alt={`Business photo ${index + 1}`} 
                        className="w-full h-full object-cover rounded-lg shadow-sm" 
                      />
                      
                      <button
                        onClick={() => handleDeletePhoto(photo.id, photo.url)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 hover:bg-red-700 z-20"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => navigate('/dashboard')}
                className="py-2 px-4 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePhotoOrder}
                className="py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}