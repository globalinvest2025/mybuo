// src/main.jsx (Versión Definitiva con Todas las Rutas)

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
        path: "dashboard",
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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);