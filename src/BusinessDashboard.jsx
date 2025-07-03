// src/BusinessDashboard.jsx - VERSIÓN FINAL Y LIMPIA (LISTA PARA PRODUCCIÓN)

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient'; 
import PhotoUploadManager from './PhotoUploadManager';

// ============================================================================
// === CONSTANTES - Eliminar "Magic Strings" ===
// ============================================================================
const PREDEFINED_CATEGORIES = [
  { value: 'restaurants', label: 'Restaurant' },
  { value: 'hotels', label: 'Hotel' },
  { value: 'clinics', label: 'Clinic' },
  { value: 'gyms', label: 'Gym' },
  { value: 'stores', label: 'Store' },
];

const OTHER_CATEGORY_VALUE = 'other';

export default function BusinessDashboard({ 
  business, 
  user, 
  onLogout, 
  onSave,
  saveError,
  saveSuccess,
  onCancel 
}) {
  const [formData, setFormData] = useState({
    name: '',
    location: '', 
    category: '',
    customCategory: '',
    description: '',
    hours: '',
    phone: '',
    website: '',
    tour_3d_url: '',
    coordinates: null, 
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(''); 
  const placePickerRef = useRef(null); 

  // Inicializar formData cuando business cambie
  useEffect(() => {
    if (business) {
      // Check if category is one of the predefined ones
      const predefinedCategoryValues = PREDEFINED_CATEGORIES.map(cat => cat.value);
      const isCustomCategory = business.category && !predefinedCategoryValues.includes(business.category);
      
      setFormData({
        name: business.name || '',
        location: business.location || '', 
        category: isCustomCategory ? OTHER_CATEGORY_VALUE : (business.category || ''),
        customCategory: isCustomCategory ? business.category : '',
        description: business.description || '',
        hours: business.hours || '',
        phone: business.phone || '',
        website: business.website || '',
        tour_3d_url: business.tour_3d_url || '',
        coordinates: business.coordinates || null, 
      });
    }
  }, [business]); 

  // useEffect para pre-llenar el gmpx-place-picker
  useEffect(() => {
    const currentPlacePicker = placePickerRef.current;
    if (currentPlacePicker && formData.location && currentPlacePicker.value !== formData.location) {
        currentPlacePicker.value = formData.location; 
    }
  }, [formData.location]); 


  // useEffect para configurar Google Places Autocomplete
  useEffect(() => {
    const inputElement = placePickerRef.current;
    console.log('🔧 Setting up Google Places Autocomplete:', inputElement);
    
    if (!inputElement) {
      console.warn('⚠️ Input ref is null');
      return;
    }

    // Esperar a que Google Maps se cargue completamente
    const waitForGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps loaded, creating Autocomplete');
        setupAutocomplete();
      } else {
        console.log('⏳ Waiting for Google Maps to load...');
        setTimeout(waitForGoogleMaps, 100);
      }
    };

    const setupAutocomplete = () => {
      try {
        // Crear el autocomplete
        const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
          types: ['establishment', 'geocode'],
          fields: ['place_id', 'formatted_address', 'name', 'geometry']
        });

        console.log('✅ Autocomplete created successfully');

        // Listener para cuando se selecciona un lugar
        const placeChangedListener = autocomplete.addListener('place_changed', () => {
          console.log('🎯 Place changed event triggered');
          
          const place = autocomplete.getPlace();
          console.log('📍 Place data received:', place);
          
          if (!place || !place.geometry) {
            console.warn('⚠️ No valid place or geometry found');
            return;
          }

          // Extraer dirección
          const newAddress = place.formatted_address || place.name || '';
          console.log('🏠 Address extracted:', newAddress);

          // Extraer coordenadas
          const location = place.geometry.location;
          const newCoordinates = {
            lat: typeof location.lat === 'function' ? location.lat() : location.lat,
            lng: typeof location.lng === 'function' ? location.lng() : location.lng
          };
          
          console.log('🌍 Coordinates extracted:', newCoordinates);

          // Actualizar el estado
          setFormData(prev => ({
            ...prev,
            location: newAddress,
            coordinates: newCoordinates,
          }));

          console.log('✅ Successfully captured place with coordinates');
        });

        // Cleanup function
        return () => {
          console.log('🧹 Cleaning up Autocomplete listeners');
          if (placeChangedListener) {
            window.google.maps.event.removeListener(placeChangedListener);
          }
        };
      } catch (error) {
        console.error('❌ Error setting up Autocomplete:', error);
      }
    };

    waitForGoogleMaps();
  }, []); 

  // Manejador genérico para actualizar el estado del formulario (para inputs normales)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar errores cuando el usuario interactúa con el formulario
    if (formError) {
      setFormError('');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejador para el envío del formulario
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(''); // Limpiar errores previos

    // Validación del formulario
    if (!formData.name.trim()) {
      setFormError("Por favor, ingresa el nombre del negocio.");
      setIsSaving(false);
      return;
    }

    if (!formData.location.trim()) {
      setFormError("Por favor, ingresa la dirección del negocio.");
      setIsSaving(false);
      return;
    }

    if (!formData.coordinates) {
      setFormError("Por favor, selecciona una dirección del autocompletado para obtener las coordenadas.");
      setIsSaving(false);
      return;
    }

    if (!formData.category) {
      setFormError("Por favor, selecciona una categoría para el negocio.");
      setIsSaving(false);
      return;
    }

    if (formData.category === OTHER_CATEGORY_VALUE && !formData.customCategory.trim()) {
      setFormError("Por favor, especifica la categoría personalizada.");
      setIsSaving(false);
      return;
    }

    // Determine final category to save
    const finalCategory = formData.category === OTHER_CATEGORY_VALUE ? formData.customCategory : formData.category;
    
    const dataToSave = {
      name: formData.name,
      location: formData.location, 
      category: finalCategory,
      description: formData.description,
      hours: formData.hours,
      phone: formData.phone,
      website: formData.website,
      tour_3d_url: formData.tour_3d_url,
      coordinates: formData.coordinates, 
    };

    try {
      if (onSave) {
        await onSave(dataToSave); 
      } else {
        // Fallback para uso Standalone (si BusinessDashboard se usa sin prop onSave)
        if (!business || !business.id) {
            setFormError('Error: No se pudo encontrar el ID del negocio para actualizar.');
            throw new Error('No business ID found for fallback update.');
        }
        const { data, error } = await supabase
            .from('businesses')
            .update(dataToSave)
            .eq('id', business.id);

        if (error) {
            throw error;
        }
        // En modo standalone, mostrar success podría ir en un toast o similar
        console.log('✅ Datos guardados exitosamente (modo standalone)!');
      }
    } catch (error) {
      setFormError('Error al guardar: ' + error.message);
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false); 
    }
  };

  // Función interna para renderizar los campos del formulario.
  function renderFormFields() {
    return (
      <>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Negocio *</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            aria-describedby={formError ? "form-error-message" : undefined}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            aria-describedby={formError ? "form-error-message" : undefined}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select a category</option> 
            {PREDEFINED_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
            <option value={OTHER_CATEGORY_VALUE}>Other / Specify</option>
          </select>
          
          {/* Custom category input - only show when "other" is selected */}
          {formData.category === OTHER_CATEGORY_VALUE && (
            <div className="mt-3">
              <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700">
                Specify your category *
              </label>
              <input
                type="text"
                id="customCategory"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleInputChange}
                placeholder="e.g., Barbershop, Auto Repair, Legal Office, etc."
                aria-describedby={formError ? "form-error-message" : undefined}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required={formData.category === OTHER_CATEGORY_VALUE}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="location-input" className="block text-sm font-medium text-gray-700">Dirección *</label>
          <input
            ref={placePickerRef}
            type="text"
            id="location-input"
            name="location"
            value={formData.location}
            onChange={(e) => {
              if (formError) setFormError(''); // Limpiar errores al escribir
              setFormData(prev => ({ 
                ...prev, 
                location: e.target.value,
                coordinates: null // Reiniciar coordenadas al editar manualmente
              }));
            }}
            placeholder="Introduce una dirección"
            aria-describedby={formError ? "form-error-message" : undefined}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          
          {formData.location && (
            <p className="text-sm text-gray-500 mt-1">Dirección: {formData.location}</p>
          )}
          {formData.coordinates && (
            <p className="text-xs text-green-600 mt-1">
              📍 Coordenadas: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
            </p>
          )}
          {!formData.coordinates && formData.location && ( 
            <p className="text-xs text-red-600 mt-1">⚠️ Selecciona una dirección del autocompletado para obtener coordenadas</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Horarios</label>
          <input
            type="text"
            id="hours"
            name="hours"
            value={formData.hours}
            placeholder="e.g., 9:00 AM - 10:00 PM"
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">Sitio Web</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            placeholder="https://ejemplo.com"
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="tour_3d_url" className="block text-sm font-medium text-gray-700">Tour 3D URL</label>
          <input
            type="url"
            id="tour_3d_url"
            name="tour_3d_url"
            value={formData.tour_3d_url}
            placeholder="https://my.matterport.com/..."
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* Mensajes de error interno del formulario */}
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
            <p id="form-error-message" className="text-red-600 text-sm text-center" role="alert">
              {formError}
            </p>
          </div>
        )}

        {/* Mensajes de error/éxito pasados desde el padre */}
        {saveError && (
          <p className="text-red-600 text-sm mt-2">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-green-600 text-sm mt-2">{saveSuccess}</p>
        )}

        {/* Botones de acción */}
        <div className="flex gap-4 pt-4">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving || !!formError} 
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isSaving || !!formError
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </>
    );
  }

  // Estructura principal del componente BusinessDashboard
  if (user && onLogout) {
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-600">My Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user.user_metadata?.name || user.email}!</span>
              <button onClick={onLogout} className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 mt-10">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Editar Perfil de tu Negocio</h2>
            {renderFormFields()} 
          </form>

          <div className="mt-10">
            <PhotoUploadManager
              businessId={business?.id}
              onUploadSuccess={() => {}} 
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      {renderFormFields()}
    </form>
  );
}