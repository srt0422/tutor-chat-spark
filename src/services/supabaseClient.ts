
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase environment variables are configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Create a mock client that doesn't throw errors but logs warnings
const createMockClient = () => {
  console.warn('Supabase environment variables not configured. Using mock client.');
  
  // Mock functions implementation
  const mockFunctions = {
    invoke: async (functionName: string, options: any = {}) => {
      console.warn(`Mock function call: ${functionName}`, options);
      return { 
        data: {
          choices: [{ message: { content: "This is a mock response as Supabase is not configured." } }]
        }, 
        error: null 
      };
    }
  };

  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    }),
    auth: {
      onAuthStateChange: () => ({ data: null, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null })
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    functions: mockFunctions
  };
};

// Export the real client if configured, otherwise use a mock
export const supabaseClient = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

