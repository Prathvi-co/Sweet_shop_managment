import { Router } from 'express';
import { register, login } from '../services/authservice.js';

const authRouter = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
authRouter.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const newUser = await register(username, password);
        res.status(201).json({
            message: 'User registered successfully.',
            user: { id: newUser.id, username: newUser.username, role: newUser.role }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
authRouter.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const { token, user } = await login(username, password);
        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

export default authRouter;
