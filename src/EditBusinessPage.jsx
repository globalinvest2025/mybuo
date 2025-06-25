// src/EditBusinessPage.jsx (Versión COMPLETA con el formulario)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabaseClient';

export default function EditBusinessPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});

  const { data: business, isLoading, isError } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('businesses').select('*').eq('id', businessId).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (business) {
      setFormData(business);
    }
  }, [business]);

  const updateBusinessMutation = useMutation({
    mutationFn: async (updatedData) => {
      const { error } = await supabase.from('businesses').update(updatedData).eq('id', businessId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      alert("Business updated successfully!");
      navigate('/dashboard');
    },
    onError: (error) => alert("Error updating business: " + error.message),
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateBusiness = (e) => {
    e.preventDefault();
    const { id, created_at, user_id, ...updateData } = formData;
    updateBusinessMutation.mutate(updateData);
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-6 text-center">Loading business details...</div>;
  }
  if (isError) {
    return <div className="max-w-4xl mx-auto p-6 text-center text-red-500">Error loading data.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
        <h1 className="text-3xl font-bold mb-6">Edit Business: <span className="text-purple-600">{business.name}</span></h1>
        <form onSubmit={handleUpdateBusiness} className="space-y-3">
          {/* --- ESTE ES EL FORMULARIO COMPLETO QUE FALTABA --- */}
          <div><label className="block text-sm font-medium">Business Name *</label><input name="name" required value={formData.name || ''} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
          <div><label className="block text-sm font-medium">Category *</label><select name="category" value={formData.category || 'restaurants'} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1"><option value="restaurants">Restaurant</option><option value="hotels">Hotel</option><option value="clinics">Clinic</option><option value="gyms">Gym</option><option value="stores">Store</option></select></div>
          <div><label className="block text-sm font-medium">Location *</label><input name="location" required value={formData.location || ''} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
          <div><label className="block text-sm font-medium">Description</label><textarea name="description" rows="3" value={formData.description || ''} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1"></textarea></div>
          <div><label className="block text-sm font-medium">Hours</label><input name="hours" value={formData.hours || ''} placeholder="e.g., 9:00 AM - 10:00 PM" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
          <div><label className="block text-sm font-medium">Phone Number</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
          <div><label className="block text-sm font-medium">Website URL</label><input type="url" name="website" value={formData.website || ''} placeholder="https://example.com" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
          <div><label className="block text-sm font-medium">3D Tour URL</label><input type="url" name="tour_3d_url" value={formData.tour_3d_url || ''} placeholder="https://my.matterport.com/..." onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
          
          <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => navigate('/dashboard')} className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all">Cancel</button>
              <button type="submit" disabled={updateBusinessMutation.isPending} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:bg-purple-300">
                {updateBusinessMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}