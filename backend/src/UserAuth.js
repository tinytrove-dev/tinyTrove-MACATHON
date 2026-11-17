import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_SECRET_KEY to .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const serverOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

// Fresh client for sign-in, so the session stays with that one request and never
// ends up on the shared client
export const createAuthClient = () => createClient(supabaseUrl, supabaseKey, serverOptions);

// Client that acts as the user who owns accessToken, so storage and database rules apply to them
export const supabaseForToken = (accessToken) =>
  createClient(supabaseUrl, supabaseKey, {
    ...serverOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });