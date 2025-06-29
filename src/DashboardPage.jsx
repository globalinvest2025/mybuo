import React, { useState, Component } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { PlusCircle, Building, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

// --- List Business Modal Component ---
// This modal is used for adding a new business. Photo upload section is removed.
function ListBusinessModal({ onClose, onAddBusiness, isSubmitting }) {
    const [formData, setFormData] = useState({
        name: '', category: 'restaurants', location: '',
        description: '', phone: '', website: '', hours: '', tour_3d_url: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Now, onAddBusiness only receives businessData, not files.
        onAddBusiness({ businessData: formData });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative my-auto animate-in fade-in-0 zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10 text-2xl font-bold">&times;</button>
                <h2 className="text-2xl font-bold mb-6">List a New Business</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">Business Name *</label><input name="name" required onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Category *</label><select name="category" onChange={handleChange} defaultValue="restaurants" className="w-full border rounded-lg p-2 mt-1"><option value="restaurants">Restaurant</option><option value="hotels">Hotel</option><option value="clinics">Clinic</option><option value="gyms">Gym</option><option value="stores">Store</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700">Location *</label><input name="location" required onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" rows="3" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700">Hours</label><input name="hours" placeholder="e.g., 9:00 AM - 10:00 PM" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Phone Number</label><input type="tel" name="phone" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}|[0-9]{10}|\+[0-9]{1,3}-[0-9]{3}-[0-9]{3}-[0-9]{4}" placeholder="123-456-7890" title="Phone format: 123-456-7890 or 1234567890" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Website URL</label><input type="url" name="website" placeholder="https://example.com" pattern="https?://.+" title="Include http:// or https:// in the URL" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">3D Tour URL</label><input type="url" name="tour_3d_url" placeholder="https://my.matterport.com/..." pattern="https?://.+" title="Include http:// or https:// in the URL" onChange={handleChange} className="w-full border rounded-lg p-2 mt-1" /></div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:bg-purple-300 mt-4">
                        {isSubmitting ? 'Saving Business...' : 'Save Business'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --- Error Boundary Component ---
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="max-w-7xl mx-auto p-6">
                    <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
                        <div className="text-center py-10">
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
                                <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
                                <p className="mb-2">We're sorry, but an error occurred while loading this page.</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>
                            {process.env.NODE_ENV === 'development' && (
                                <details className="text-left bg-gray-100 p-4 rounded-lg mt-4">
                                    <summary className="cursor-pointer font-semibold mb-2">Error Details (Development Only)</summary>
                                    <p className="text-red-600 mb-2">{this.state.error && this.state.error.toString()}</p>
                                    <pre className="text-xs overflow-auto bg-gray-200 p-2 rounded">
                                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// --- Helper function for showing notifications ---
const showNotification = (message, type = 'success') => {
    const isSuccess = type === 'success';
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${isSuccess ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 rounded shadow-md z-50`;

    const icon = isSuccess
        ? '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';

    notification.innerHTML = `<div class="flex items-center">${icon}${message}</div>`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, isSuccess ? 3000 : 5000);
};

// --- Dashboard Page Component ---
function DashboardPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (!session) {
                navigate('/register');
                return null;
            }
            return session.user;
        }
    });

    const { data: businesses, isLoading: isLoadingBusinesses } = useQuery({
        queryKey: ['businesses', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase.from('businesses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!user,
    });

    const addBusinessMutation = useMutation({
        mutationFn: async ({ businessData }) => {
            if (!user) {
                throw new Error("User not found.");
            }

            const dataToInsert = { ...businessData, user_id: user.id };

            const { data, error: insertError } = await supabase.from('businesses').insert([dataToInsert]).select();

            if (insertError) throw insertError;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses', user?.id] });
            showNotification('Business added successfully!', 'success');
            setIsModalOpen(false);
        },
        onError: (error) => {
            showNotification(`Error adding business: ${error.message}`, 'error');
        }
    });

    const deleteBusinessMutation = useMutation({
        mutationFn: async (businessId) => {
            const { error } = await supabase.from('businesses').delete().eq('id', businessId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses', user?.id] });
            showNotification('Business deleted successfully.', 'success');
        },
        onError: (error) => {
            showNotification(`Error deleting business: ${error.message}`, 'error');
        }
    });

    const handleDeleteBusiness = (businessId, businessName) => {
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
        confirmDialog.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Deletion</h3>
                <p class="text-gray-600 mb-6">Are you sure you want to delete "${businessName}"? This action cannot be undone.</p>
                <div class="flex justify-end gap-3">
                    <button id="cancel-delete" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                    <button id="confirm-delete" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        document.getElementById('cancel-delete').addEventListener('click', () => {
            confirmDialog.remove();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            deleteBusinessMutation.mutate(businessId);
            confirmDialog.remove();
        });
    };

    if (isLoadingBusinesses || !user) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
                    <div className="text-center py-10">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                        </div>
                        <p className="mt-4 font-semibold text-xl text-gray-700">Loading Dashboard...</p>
                        <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your business data</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Welcome to your Dashboard</h1>
                    <p className="text-gray-600 mt-1">Logged in as: {user.email}</p>
                </div>
                <div className="mt-12 border-t pt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Your Businesses</h2>
                        <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2">
                            <PlusCircle className="w-5 h-5" />
                            Add New Business
                        </button>
                    </div>
                    <div className="space-y-4">
                        {businesses && businesses.length > 0 ? (
                            businesses.map(business => (
                                <div key={business.id} className="bg-slate-50 border rounded-lg p-4 flex justify-between items-center hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-200 p-3 rounded-lg"><Building className="w-6 h-6 text-slate-600" /></div>
                                        <div>
                                            <h3 className="font-bold text-lg">{business.name}</h3>
                                            <p className="text-sm text-gray-500 capitalize">{business.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* NEW: Add Photos Button */}
                                        <Link to={`/dashboard/edit/${business.id}#photos`} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                            <ImageIcon className="w-4 h-4" />
                                            Add Photos
                                        </Link>
                                        <Link to={`/dashboard/edit/${business.id}`} className="text-sm font-semibold text-purple-600 hover:underline flex items-center gap-1">
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </Link>
                                        <button onClick={() => handleDeleteBusiness(business.id, business.name)} disabled={deleteBusinessMutation.isPending} className="text-sm font-semibold text-red-600 hover:underline flex items-center gap-1 disabled:opacity-50">
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed rounded-xl">
                                <p className="text-gray-500">You haven't listed any businesses yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <ListBusinessModal
                    onClose={() => setIsModalOpen(false)}
                    onAddBusiness={addBusinessMutation.mutate}
                    isSubmitting={addBusinessMutation.isPending}
                />
            )}
        </div>
    );
}

// Wrap the DashboardPage component with ErrorBoundary
const DashboardPageWithErrorBoundary = () => (
    <ErrorBoundary>
        <DashboardPage />
    </ErrorBoundary>
);

// Export the wrapped component
export default DashboardPageWithErrorBoundary;

// Change the original export to a named export
export { DashboardPage };