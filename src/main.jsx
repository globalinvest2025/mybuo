// src/main.jsx (Versión Definitiva con Todas las Rutas y Google Maps)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';

// 1. Importamos TanStack Query para la gestión de datos
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. Importamos todos nuestros componentes de página y layout
import Layout from './Layout.jsx';
import BusinessPortal from './BusinessPortal.jsx';
import BusinessLandingPage from './BusinessLandingPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import EditBusinessPage from './EditBusinessPage.jsx';

// ======================================================================
// === NUEVAS IMPORTACIONES Y CONFIGURACIÓN PARA GOOGLE MAPS PLATFORM ===
// ======================================================================

// Importa la librería @googlemaps/extended-component-library
// Esto registra los custom elements (como <gmpx-place-picker>)
// No necesitas la etiqueta <script type="module"> en public/index.html si haces esto.
//import '@googlemaps/extended-component-library';

// Tu clave de API de Google Maps
// ¡ADVERTENCIA DE SEGURIDAD! Gestiona esta clave con variables de entorno para producción.
// Por ejemplo, import.meta.env.VITE_Maps_API_KEY si usas Vite
// o process.env.REACT_APP_Maps_API_KEY si usas Create React App
const Maps_API_KEY = 'AIzaSyCk9I5Jk4naX5hdqRCqX6DaXIqhQvobFS0'; // <-- REEMPLAZA con tu clave REAL

// ======================================================================

// 3. Creamos el cliente de Query
const queryClient = new QueryClient();

// 4. Creamos el "mapa" del sitio con todas las rutas
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
        path: "register",
        element: <BusinessLandingPage />,
      },
      {
        path: "dashboard/*",
        element: <DashboardPage />,
      },
      {
        path: "dashboard/edit/:businessId",
        element: <EditBusinessPage />,
      },
    ],
  },
]);

// 5. Renderizamos la aplicación, envolviéndola con el QueryClientProvider
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ====================================================================== */}
    {/* === COLOCA EL gmpx-api-loader AQUÍ, COMO UN COMPONENTE DE REACT. === */}
    {/* === Esto asegura que la API de Google Maps se cargue con tu clave. === */}
    {/* ====================================================================== */}
    <gmpx-api-loader key={Maps_API_KEY} solution-channel="GMP_GE_placepicker_v2"></gmpx-api-loader>

    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);