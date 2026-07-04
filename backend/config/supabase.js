const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasPlaceholderSupabaseConfig =
  supabaseUrl === 'https://demo.supabase.co' ||
  supabaseAnonKey?.includes('.demo') ||
  supabaseServiceRoleKey?.includes('.demo');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file');
}

// Public client for user operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test connection
const testConnection = async () => {
  if (hasPlaceholderSupabaseConfig) {
    console.warn('Supabase connection skipped: replace demo values in backend/.env with your real Supabase URL and keys.');
    return false;
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Supabase connection error:', error.message);
        return false;
      }

      console.log('Supabase connected successfully');
      return true;
    } catch (error) {
      const cause = error.cause?.code || error.cause?.message;
      console.error(`Supabase connection failed on attempt ${attempt}: ${error.message}${cause ? ` (${cause})` : ''}`);

      if (attempt < 3) {
        await wait(1000);
      }
    }
  }

  return false;
};

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseUrl,
  supabaseAnonKey,
  hasPlaceholderSupabaseConfig,
  testConnection
};
