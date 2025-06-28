// src/PhotoUploadManager.jsx
import React, { useState, useEffect } from 'react'; // Asegúrate de importar useEffect también

// Usando variables de entorno - ¡Asegúrate de que estas estén definidas en tu .env.local!
const UPLOAD_FUNCTION_URL = import.meta.env.VITE_SUPABASE_UPLOAD_URL || 
  'https://dkisgcdpimagrpujochw.supabase.co/functions/v1/upload-photos';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function PhotoUploadManager({ businessId, onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]); // Nuevo estado para las previsualizaciones
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Progreso simulado
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Validación de archivos (sugerencia 2)
  const validateFiles = (fileList) => {
    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB por archivo
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_FILES = 10; // Límite de 10 fotos por subida

    if (fileList.length === 0) {
      setError('Por favor, selecciona al menos un archivo.');
      return false;
    }

    if (fileList.length > MAX_FILES) {
      setError(`Solo se permiten un máximo de ${MAX_FILES} archivos por subida.`);
      return false;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`El archivo '${file.name}' es demasiado grande (máx. ${MAX_FILE_SIZE_MB}MB).`);
        return false;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`El tipo de archivo '${file.name}' no está permitido. Solo JPG, PNG, WEBP.`);
        return false;
      }
    }
    setError(null); // Limpia errores si la validación pasa
    return true;
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (validateFiles(selectedFiles)) {
      setFiles(selectedFiles);
      setSuccessMessage(null);

      // Generar previsualizaciones (sugerencia 3)
      const newPreviews = selectedFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setPreviews(newPreviews);
    } else {
      setFiles([]);
      setPreviews([]);
      // El error ya fue seteado por validateFiles
    }
    // Asegurarse de que el input de archivo se pueda volver a usar
    event.target.value = ''; 
  };

  // Limpiar URLs de objetos cuando el componente se desmonte o las previsualizaciones cambien (sugerencia 3)
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  // Función para eliminar un archivo de la selección (sugerencia 5)
  const removeFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    setPreviews(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
    setError(null); // Limpiar errores si el usuario quita un archivo problemático
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Por favor, selecciona al menos una foto para subir.');
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
      // Simulación de progreso para la carga a la función Edge
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress <= 90) {
          setUploadProgress(currentProgress);
        } else {
          clearInterval(interval);
        }
      }, 200);

      // Realiza la solicitud a la función Edge
      const response = await fetch(UPLOAD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      clearInterval(interval); // Detiene la simulación de progreso
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Subida exitosa:', result);
      setSuccessMessage(`¡${result.message || 'Fotos subidas correctamente!'} ${result.dbRecords?.length || 0} registro(s) en DB.`);
      
      if (onUploadSuccess) {
        onUploadSuccess(result.dbRecords || result.publicUrls);
      }
      
      setFiles([]); // Limpiar archivos seleccionados
      setPreviews([]); // Limpiar previsualizaciones
      setUploadProgress(100); // Finalizar progreso
      
    } catch (err) {
      console.error('Error durante la subida:', err);
      setError(`Error al subir fotos: ${err.message}`);
      setUploadProgress(0); // Reiniciar progreso en caso de error
    } finally {
      setUploading(false);
    }
  };

  // Validación inicial de las variables de entorno al cargar el componente
  useEffect(() => {
    if (!UPLOAD_FUNCTION_URL || !SUPABASE_ANON_KEY) {
      setError("Error de configuración: URL de función o clave Supabase Anon missing. Revisa tu archivo .env.local");
      console.error("VITE_SUPABASE_UPLOAD_URL or VITE_SUPABASE_ANON_KEY is not defined.");
    }
  }, []); // Solo se ejecuta una vez al montar

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Gestionar Fotos del Negocio</h2>
      
      <div className="mb-4">
        <label htmlFor="photo-upload" className="block text-gray-700 text-sm font-bold mb-2">
          Selecciona fotos (PNG, JPG, WEBP - máx. 5MB c/u, hasta 10 archivos):
        </label>
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/jpeg,image/png,image/webp" // Define los tipos aceptados
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
            {files.length} archivo(s) seleccionado(s)
          </p>
        )}
      </div>

      {/* Área de previsualización (sugerencia 3 y 5) */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
              <img 
                src={preview.url} 
                alt={preview.name}
                className="w-full h-24 object-cover" // Ajusta h-24 para tamaño de previsualización
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Eliminar ${preview.name}`}
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
        disabled={uploading || files.length === 0 || error} // Deshabilita si hay errores de validación
        className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors
          ${uploading || files.length === 0 || error ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}
        `}
      >
        {uploading ? `Subiendo... (${uploadProgress}%)` : 'Subir Fotos'}
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