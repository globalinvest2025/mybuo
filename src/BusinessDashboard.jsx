// src/BusinessDashboard.jsx
import React from 'react';

// Recibe los datos del negocio y una función para cerrar sesión
export default function BusinessDashboard({ business, user, onLogout }) {
  
  // Aquí pondríamos estados para cada campo del formulario
  // const [name, setName] = useState(business.name);
  // ... etc ...

  const handleSave = (e) => {
    e.preventDefault();
    alert('Aquí se haría una llamada a la API (PATCH a /businesses/:id) para guardar los datos en db.json');
  }

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
          <h2 className="text-3xl font-bold text-gray-800">Edit Your Business Profile</h2>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Business Name</label>
            <input type="text" id="name" defaultValue={business.name} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input type="text" id="address" defaultValue={business.address} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>

          {/* ... AÑADIR AQUÍ MÁS CAMPOS PARA WEBSITE, SOCIALS, HOURS, ETC ... */}
          
          <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-purple-700">
            Save Changes
          </button>
        </form>
      </main>
    </div>
  );
}