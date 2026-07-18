// lib/supabaseClient.js
// Point d'entrée unique vers Supabase — tout le reste de l'app passe par ce client.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Variables Supabase manquantes. Vérifie REACT_APP_SUPABASE_URL et ' +
    'REACT_APP_SUPABASE_ANON_KEY dans les Environment Variables de Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
