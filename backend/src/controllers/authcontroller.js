import * as authService from '../services/authservice.js';

/**
 * Handles user registration request.
 * * It validates required fields (username, password).
 * For simplicity, the first user registered is automatically assigned the 'Admin' role.
 * Subsequent users are assigned the 'User' role.
 * * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
export const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. Input Validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // 2. Call Service to handle registration logic
        const newUser = await authService.register(username, password);
        
        // 3. Prepare response (Do not return the password hash!)
        const { passwordHash, ...userWithoutHash } = newUser; 

        return res.status(201).json({ 
            message: 'User registered successfully. Role: ' + userWithoutHash.role, 
            user: userWithoutHash 
        });
    } catch (error) {
        // Handle specific errors from the service (e.g., username already taken)
        if (error.message.includes('already exists')) {
            return res.status(409).json({ message: error.message });
        }
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error during registration.' });
    }
};

/**
 * Handles user login request.
 * * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. Input Validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // 2. Call Service to handle login logic (verification, token generation)
        const { token, user } = await authService.login(username, password);
        
        // 3. Send response with token and user details
        return res.status(200).json({ 
            message: 'Login successful.',
            user: { id: user.id, username: user.username, role: user.role }, 
            token 
        });
    } catch (error) {
        // Handle specific errors from the service (e.g., wrong password)
        if (error.message.includes('Invalid credentials')) {
            return res.status(401).json({ message: error.message });
        }
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error during login.' });
    }
};
