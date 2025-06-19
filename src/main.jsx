// src/main.jsx (Versión Definitiva con la Ruta Correcta)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';

// --- RUTA CORREGIDA ---
// Busca Layout.jsx en la misma carpeta (./) porque ambos están en src/
import Layout from './Layout.jsx'; 
// =========================

import BusinessPortal from './BusinessPortal.jsx';
// La siguiente línea puede dar un error si no has creado la carpeta /pages.
// La comentaré por ahora para asegurar que todo funcione.
// import BusinessLandingPage from './pages/BusinessLandingPage.jsx'; 
import BusinessLandingPage from './BusinessLandingPage.jsx'; // Suponiendo que este archivo también está en src/


// Crea el "mapa" de tu sitio web
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, 
    children: [
      {
        index: true, 
        element: <BusinessPortal />,
      },
      {
        path: "inscribirse",
        element: <BusinessLandingPage />,
      },
    ],
  },
]);

// Renderiza la aplicación usando el enrutador
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);