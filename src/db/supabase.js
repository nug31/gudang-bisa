// Create a mock Supabase client that doesn't actually connect to Supabase
// This is used when we're using Neon database instead of Supabase

// Create a mock function that returns a promise with empty data
const mockQueryResponse = () => Promise.resolve({ data: [], error: null });

// Create a mock Supabase client
const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => mockQueryResponse(),
      neq: () => mockQueryResponse(),
      gt: () => mockQueryResponse(),
      lt: () => mockQueryResponse(),
      gte: () => mockQueryResponse(),
      lte: () => mockQueryResponse(),
      in: () => mockQueryResponse(),
      is: () => mockQueryResponse(),
      single: () => mockQueryResponse(),
      order: () => mockQueryResponse(),
      limit: () => mockQueryResponse(),
    }),
    insert: () => mockQueryResponse(),
    update: () => mockQueryResponse(),
    delete: () => mockQueryResponse(),
  }),
  auth: {
    signIn: () => Promise.resolve({ user: null, session: null, error: null }),
    signUp: () => Promise.resolve({ user: null, session: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
  rpc: () => mockQueryResponse(),
};

// Export the mock client
export default mockSupabase;
