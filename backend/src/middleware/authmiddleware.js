import jwt from 'jsonwebtoken';

// Get secret key from environment variables (must match the one in auth.service.js)
const JWT_SECRET = process.env.JWT_SECRET || 'a_secret_key_for_dev_only';

/**
 * Middleware to protect routes: verifies a JWT and extracts user information.
 * It ensures the request has a valid token in the Authorization header.
 * * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export const protect = (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token (e.g., "Bearer tokenValue" -> "tokenValue")
            token = req.headers.authorization.split(' ')[1];
            
            // Verify the token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Attach the decoded payload (userId, role) to the request object
            // This allows controllers to know who the user is.
            req.user = decoded; 
            
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Middleware for Admin authorization: checks if the authenticated user is an Admin.
 * MUST be run AFTER the 'protect' middleware.
 * * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export const admin = (req, res, next) => {
    // Check if req.user (attached by 'protect') exists and has the 'Admin' role
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
