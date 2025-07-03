// ReviewForm.jsx - Formulario para escribir/editar reseñas
import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabaseClient';

function ReviewForm({ businessId, businessName, user, onClose, existingReview = null }) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const queryClient = useQueryClient();

    // Mutation for adding/updating reviews
    const reviewMutation = useMutation({
        mutationFn: async ({ rating, comment }) => {
            if (existingReview) {
                // Update existing review
                const { data, error } = await supabase
                    .from('reviews')
                    .update({ 
                        rating, 
                        comment: comment.trim() || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingReview.id)
                    .select();
                
                if (error) throw error;
                return data;
            } else {
                // Insert new review
                const { data, error } = await supabase
                    .from('reviews')
                    .insert([{
                        business_id: businessId,
                        user_id: user.id,
                        rating,
                        comment: comment.trim() || null
                    }])
                    .select();
                
                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
            queryClient.invalidateQueries({ queryKey: ['reviews', businessId] });
            
            // Show success message
            const message = existingReview ? 'Review updated successfully!' : 'Review posted successfully!';
            
            // Simple success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-100 border-green-500 text-green-700 border-l-4 p-4 rounded shadow-md z-50';
            notification.innerHTML = `<div class="flex items-center"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>${message}</div>`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
            
            onClose();
        },
        onError: (error) => {
            console.error('Review error:', error);
            
            let errorMessage = 'Error posting review. Please try again.';
            if (error.message.includes('duplicate key')) {
                errorMessage = 'You have already reviewed this business. You can edit your existing review.';
            }
            
            // Simple error notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-100 border-red-500 text-red-700 border-l-4 p-4 rounded shadow-md z-50';
            notification.innerHTML = `<div class="flex items-center"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>${errorMessage}</div>`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            alert('Please select a rating before submitting.');
            return;
        }

        reviewMutation.mutate({ rating, comment });
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative animate-in fade-in-0 zoom-in-95">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                    aria-label="Close review form"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {existingReview ? 'Edit Your Review' : 'Write a Review'}
                    </h2>
                    <p className="text-gray-600">
                        Share your experience at <span className="font-semibold">{businessName}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            How would you rate this business? *
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                                >
                                    <Star 
                                        className={`w-8 h-8 transition-colors ${
                                            star <= displayRating 
                                                ? 'text-yellow-400 fill-yellow-400' 
                                                : 'text-gray-300'
                                        }`} 
                                    />
                                </button>
                            ))}
                            <span className="ml-3 text-sm text-gray-600">
                                {displayRating > 0 && (
                                    <>
                                        {displayRating} star{displayRating !== 1 ? 's' : ''}
                                        {displayRating === 1 && ' - Poor'}
                                        {displayRating === 2 && ' - Fair'}
                                        {displayRating === 3 && ' - Good'}
                                        {displayRating === 4 && ' - Very Good'}
                                        {displayRating === 5 && ' - Excellent'}
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                            Tell others about your experience (optional)
                        </label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows="4"
                            placeholder="What did you like? What could be improved? Share details that would help other customers..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            maxLength="500"
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {comment.length}/500 characters
                        </div>
                    </div>

                    {/* User Info Display */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-semibold text-sm">
                                    {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {user.user_metadata?.name || user.email}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Your review will be public
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={rating === 0 || reviewMutation.isPending}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {reviewMutation.isPending 
                            ? (existingReview ? 'Updating...' : 'Posting...') 
                            : (existingReview ? 'Update Review' : 'Post Review')
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ReviewForm;