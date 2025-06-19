// src/ErrorPage.jsx
import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-center p-6">
      <h1 className="text-6xl font-extrabold text-purple-600">Oops!</h1>
      <p className="text-2xl font-semibold mt-4 text-gray-800">404 - Page Not Found</p>
      <p className="mt-2 text-gray-600">Sorry, an unexpected error has occurred.</p>
      <p className="mt-2 text-gray-500">
        <i>{error.statusText || error.message}</i>
      </p>
      <Link to="/" className="mt-8 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700">
        Go Back Home
      </Link>
    </div>
  );
}