// src/BusinessDashboard.jsx
import React, { useState, useEffect } from 'react'; // <--- ¡Asegúrate de importar useState y useEffect!
import PhotoUploadManager from './PhotoUploadManager';

// Recibe los datos del negocio y una función para cerrar sesión
export default function BusinessDashboard({ business, user, onLogout }) {
  // 1. Estado para los datos del formulario (sugerencia implementada)
  const [formData, setFormData] = useState({
    name: business.name || '',
    address: business.address || '',
    category: business.category || '',
    description: business.description || '',
    hours: business.hours || '',
    phone: business.phone || '',
    website: business.website || '',
    // Asegúrate de añadir aquí todos los campos de tu tabla 'businesses' que quieras editar
  });

  // 2. Estado para el manejo de carga y errores al guardar (sugerencia implementada)
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null); // Mensaje de éxito al guardar

  // 3. Estado para las fotos del negocio (inicialmente vacío o desde 'business.photos' si lo traes)
  // Asumo que 'business.photos' no es una columna directa en 'businesses',
  // sino que las fotos se obtendrán por separado usando el business.id
  // Por ahora, este estado se actualizará solo al subir nuevas fotos.
  // Más adelante, podríamos cargar las fotos existentes aquí.
  const [currentBusinessPhotos, setCurrentBusinessPhotos] = useState([]);

  // useEffect para cargar las fotos existentes del negocio cuando el componente se monta o el negocio cambia
  // Este es un paso futuro si quieres mostrar las fotos ya subidas.
  // Por ahora, el PhotoUploadManager solo sube, no muestra las existentes.
  /*
  useEffect(() => {
    // Si tienes una forma de cargar las fotos existentes para este business.id, hazlo aquí.
    // Por ejemplo, con react-query si tienes un hook para eso:
    // const { data: photosData } = useQuery(['businessPhotos', business.id], async () => {
    //   const { data, error } = await supabase.from('business_photos').select('*').eq('business_id', business.id);
    //   if (error) throw error;
    //   return data;
    // });
    // if (photosData) {
    //   setCurrentBusinessPhotos(photosData);
    // }
  }, [business.id]);
  */


  // Manejador genérico para actualizar el estado del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes al empezar a escribir de nuevo
    setSaveError(null);
    setSaveSuccess(null);
  };

  // Manejador para guardar los cambios del perfil del negocio
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // <--- AQUÍ VA LA LLAMADA REAL A LA API DE SUPABASE PARA ACTUALIZAR EL NEGOCIO --->
      // AUN NO ESTÁ IMPLEMENTADO LA LLAMADA A SUPABASE PARA ACTUALIZAR EL NEGOCIO (PATCH)
      // Esta es la parte que tendríamos que desarrollar después para actualizar la tabla 'businesses'
      console.log('Datos a guardar:', formData);
      alert('¡Aquí se haría una llamada a la API (PATCH a /businesses/:id) para guardar los datos en Supabase!');
      
      // Simulación de una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      setSaveSuccess('¡Cambios guardados exitosamente!');
    } catch (error) {
      console.error('Error al guardar cambios del negocio:', error);
      setSaveError('Error al guardar cambios: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Manejador para cuando las fotos se suben con éxito
  const handlePhotoUploadSuccess = (newDbRecords) => {
    console.log('Fotos subidas y registradas en DB (desde PhotoUploadManager):', newDbRecords);
    // Agregamos las nuevas fotos a la lista actual de fotos del negocio
    // Asumo que newDbRecords es un array de objetos con { id, url, business_id, ... }
    setCurrentBusinessPhotos(prevPhotos => [...prevPhotos, ...newDbRecords]);
    setSaveSuccess('¡Fotos subidas y guardadas en la base de datos!'); // Mensaje de éxito general
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">My Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user.name}!</span>
            <button onClick={onLogout} className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto p-6 mt-10">
        <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Editar Perfil de tu Negocio</h2>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
            <input 
              type="text" 
              id="name" 
              name="name" // <--- ¡Añade el atributo name!
              value={formData.name} // <--- ¡Usa value en lugar de defaultValue!
              onChange={handleInputChange} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
            <input 
              type="text" 
              id="address" 
              name="address" // <--- ¡Añade el atributo name!
              value={formData.address} // <--- ¡Usa value en lugar de defaultValue!
              onChange={handleInputChange} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            />
          </div>

          {/* --- Inicio: Campos Adicionales Sugeridos (añade más según tu tabla businesses) --- */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
            <input 
              type="text" 
              id="category" 
              name="category"
              value={formData.category}
              onChange={handleInputChange} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea 
              id="description" 
              name="description"
              value={formData.description}
              onChange={handleInputChange} 
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            ></textarea>
          </div>
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Horario</label>
            <input 
              type="text" 
              id="hours" 
              name="hours"
              value={formData.hours}
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
              onChange={handleInputChange} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            />
          </div>
          {/* --- Fin: Campos Adicionales Sugeridos --- */}

          {saveError && (
            <p className="text-red-600 text-sm mt-2">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-green-600 text-sm mt-2">{saveSuccess}</p>
          )}
          
          <button 
            type="submit" 
            disabled={isSaving} // Deshabilita el botón mientras se guarda
            className={`w-full py-3 rounded-lg font-bold text-lg transition-colors 
              ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}
            `}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>

        {/* ----------- INICIO: SECCIÓN DE GESTIÓN DE FOTOS ----------- */}
        <div className="mt-10"> {/* Agrega un margen superior para separarlo del formulario */}
          <PhotoUploadManager 
            businessId={business.id} 
            onUploadSuccess={handlePhotoUploadSuccess} // Pasa el manejador de éxito
          />
        </div>
        {/* ----------- FIN: SECCIÓN DE GESTIÓN DE FOTOS ----------- */}

        {/* ----------- INICIO: SECCIÓN DE VISUALIZACIÓN DE FOTOS SUBIDAS ----------- */}
        {currentBusinessPhotos.length > 0 && (
          <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Galería de Fotos Actual</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentBusinessPhotos.map((photo, index) => (
                <div key={photo.id || index} className="relative aspect-w-1 aspect-h-1 group">
                  <img 
                    src={photo.url} 
                    alt={`Foto del negocio ${index + 1}`} 
                    className="w-full h-full object-cover rounded-lg shadow-sm" 
                  />
                  {/* Aquí podrías añadir un botón de eliminar foto en el futuro */}
                  {/* <button className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">X</button> */}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ----------- FIN: SECCIÓN DE VISUALIZACIÓN DE FOTOS SUBIDAS ----------- */}

      </main>
    </div>
  );
}