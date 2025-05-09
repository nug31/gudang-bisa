import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING
});

// Basic auth functions
export const neonAuth = {
  async login(email: string, password: string) {
    const res = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password)',
      [email, password]
    );
    return res.rows[0];
  },
  async register(name: string, email: string, password: string, role: string) {
    const res = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4) 
       RETURNING *`,
      [name, email, password, role]
    );
    return res.rows[0];
  }
};

export default pool;
