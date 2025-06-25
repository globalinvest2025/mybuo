// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Esta es la parte que cambiamos
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  // En lugar de detener todo, solo mostraremos un error en la consola
  console.error("⚠️ Error: Supabase URL or Anon Key is missing.");
  console.error("⚠️ Please check your .env.local file in the root directory.");
  // Dejamos el cliente 'supabase' como nulo para evitar más errores
  supabase = null;
} else {
  // Si todo está bien, creamos el cliente
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }