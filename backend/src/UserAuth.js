import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env');
}

const serverOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

// Shared client that never holds a session. Only use it for stateless calls
// like verifying a token. Never call signIn on it, or every request would act
// as that user.
export const supabase = createClient(supabaseUrl, supabaseKey, serverOptions);

// Fresh client for sign-in / sign-up / refresh, so the resulting session
// stays local to this request.
export const createAuthClient = () =>
  createClient(supabaseUrl, supabaseKey, serverOptions);

// Client that makes database calls as the user who owns `accessToken`,
// so Row Level Security policies apply to them.
export const supabaseForToken = (accessToken) =>
  createClient(supabaseUrl, supabaseKey, {
    ...serverOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
