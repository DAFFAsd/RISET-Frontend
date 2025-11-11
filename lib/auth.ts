import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { query } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'hilirisasi'
);

export interface User {
  id: number;
  username: string;
  saldo: number;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createToken(user: User): Promise<string> {
  return await new SignJWT({ userId: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const userId = verified.payload.userId as number;
    
    // Fetch fresh user data from database
    const result = await query(
      'SELECT id, username, saldo FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      saldo: parseFloat(result.rows[0].saldo)
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  if (!token) return null;
  return await verifyToken(token);
}
