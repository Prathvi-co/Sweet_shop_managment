import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../data/inMemoryDB.js';

// Configuration
// NOTE: In a real app, JWT_SECRET must be loaded from a secure environment variable.
const JWT_SECRET = 'your_super_secret_jwt_key'; 
const SALT_ROUNDS = 10; // Standard security level for bcrypt

// --- Public Helper Functions (Used by Controller) ---

/**
 * Registers a new user. The first user gets the 'Admin' role.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<import('../models/user.model.js').IUser>} The new user object without password hash.
 */
export const register = async (username, password) => {
    // 1. Check for existing user
    if (db.users.find(u => u.username === username)) {
        throw new Error('User already exists');
    }

    // 2. Determine Role (First user is Admin)
    const role = db.users.length === 0 ? 'Admin' : 'User';

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Create new user object
    const newUser = {
        id: crypto.randomUUID(),
        username,
        passwordHash,
        role,
    };
    
    // 5. Save to "database"
    db.users.push(newUser);
    console.log(`User registered: ${username} with role ${role}`);

    return newUser;
};

/**
 * Logs in a user, verifies credentials, and generates a JWT.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{token: string, user: import('../models/user.model.js').IUser}>} 
 */
export const login = async (username, password) => {
    // 1. Find user in "database"
    const user = db.users.find(u => u.username === username);

    if (!user) {
        throw new Error('Invalid credentials: User not found');
    }

    // 2. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        throw new Error('Invalid credentials: Password incorrect');
    }

    // 3. Generate JWT Token
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    return { token, user };
};

/**
 * Verifies and decodes a JWT token.
 * @param {string} token 
 * @returns {import('../models/user.model.js').IAuthPayload}
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('JWT Verification failed:', error.message);
        throw new Error('Invalid or expired token.');
    }
};
