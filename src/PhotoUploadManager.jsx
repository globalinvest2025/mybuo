// src/PhotoUploadManager.jsx
import React, { useState, useEffect } from 'react';

// Using environment variables for Supabase configuration
const UPLOAD_FUNCTION_URL = import.meta.env.VITE_SUPABASE_UPLOAD_URL || 
  'https://dkisgcdpimagrpujochw.supabase.co/functions/v1/upload-photos';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function PhotoUploadManager({ businessId, onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Simulated progress
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // File validation
  const validateFiles = (fileList) => {
    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB per file
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_FILES = 10; // Max 10 photos per upload

    if (fileList.length === 0) {
      setError('Please select at least one photo.'); // Text changed to English
      return false;
    }

    if (fileList.length > MAX_FILES) {
      setError(`A maximum of ${MAX_FILES} files are allowed per upload.`); // Text changed to English
      return false;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File '${file.name}' is too large (max. ${MAX_FILE_SIZE_MB}MB).`); // Text changed to English
        return false;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File type not allowed for '${file.name}'. Only JPG, PNG, WEBP.`); // Text changed to English
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (validateFiles(selectedFiles)) {
      setFiles(selectedFiles);
      setSuccessMessage(null);

      const newPreviews = selectedFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setPreviews(newPreviews);
    } else {
      setFiles([]);
      setPreviews([]);
    }
    event.target.value = ''; 
  };

  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const removeFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    setPreviews(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one photo to upload.'); // Text changed to English
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('businessId', businessId.toString());
    files.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress <= 90) {
          setUploadProgress(currentProgress);
        } else {
          clearInterval(interval);
        }
      }, 200);

      const response = await fetch(UPLOAD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      clearInterval(interval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP Error: ${response.status}`); // Text changed to English
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      setSuccessMessage(`Photos uploaded successfully! ${result.dbRecords?.length || 0} record(s) in DB.`); // Text changed to English
      
      if (onUploadSuccess) {
        onUploadSuccess(result.dbRecords || result.publicUrls);
      }
      
      setFiles([]);
      setPreviews([]);
      setUploadProgress(100);
      
    } catch (err) {
      console.error('Error during upload:', err);
      setError(`Error uploading photos: ${err.message}`); // Text changed to English
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Initial config validation
  useEffect(() => {
    if (!UPLOAD_FUNCTION_URL || !SUPABASE_ANON_KEY) {
      setError("Configuration Error: Supabase Function URL or Anon Key is missing. Check your .env.local file."); // Text changed to English
      console.error("VITE_SUPABASE_UPLOAD_URL or VITE_SUPABASE_ANON_KEY is not defined.");
    }
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Business Photos</h2> {/* Text changed to English */}
      
      <div className="mb-4">
        <label htmlFor="photo-upload" className="block text-gray-700 text-sm font-bold mb-2">
          Select photos (PNG, JPG, WEBP - max. 5MB each, up to 10 files): {/* Text changed to English */}
        </label>
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-purple-50 file:text-purple-700
            hover:file:bg-purple-100"
        />
        {files.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {files.length} file(s) selected
          </p> // Text changed to English
        )}
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
              <img 
                src={preview.url} 
                alt={preview.name}
                className="w-full h-24 object-cover"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Remove ${preview.name}`} // Text changed to English
              >
                ×
              </button>
              <p className="text-xs text-gray-600 px-2 py-1 truncate">{preview.name}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {successMessage && (
        <p className="text-green-600 text-sm mb-4">{successMessage}</p>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0 || error}
        className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
          ${uploading || files.length === 0 || error ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}
        `}
      >
        {uploading ? `Uploading... (${uploadProgress}%)` : 'Upload Photos'} {/* Text changed to English */}
      </button>

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
          <div 
            className="bg-purple-600 h-2.5 rounded-full" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}