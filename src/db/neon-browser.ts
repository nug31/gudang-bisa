// This is a browser-safe version of the neon.ts file
// It doesn't use Node.js specific APIs like process.env

// For browser environments, we'll use fetch to call the Netlify functions
export const neonAuth = {
  async login(email: string, password: string) {
    try {
      const response = await fetch('/.netlify/functions/neon-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  async register(name: string, email: string, password: string, role: string) {
    try {
      const response = await fetch('/.netlify/functions/neon-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          name,
          email,
          password,
          role,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
};

// For browser environments, we don't export a pool
// Instead, we'll use fetch to call the Netlify functions
export default {
  query: async (text: string, params: any[] = []) => {
    try {
      const response = await fetch('/.netlify/functions/neon-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          params,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Query failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }
};
