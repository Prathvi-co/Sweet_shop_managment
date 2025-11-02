import express from 'express';
import dotenv from 'dotenv';
// IMPORTANT: Use the actual file names you have on disk. 
// Assuming you fixed the file names to include the dot (auth.routes.js),
// but since your imports still show 'authroutes.js', I will use that naming convention here.
// If you rename your files to auth.routes.js and sweet.routes.js, you must update these imports.
import authRouter from './routes/authroutes.js';
import sweetRouter from './routes/sweetroutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// 1. Body parser for incoming JSON requests
app.use(express.json()); 

// 2. Simple CORS setup for development
// This allows the frontend (which will be on a different port/origin) to talk to the backend
app.use((req, res, next) => {
    // Allows requests from any origin (*)
    res.header('Access-Control-Allow-Origin', '*'); 
    // Allows the necessary methods (GET, POST, PUT, DELETE)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // Allows critical headers, including 'Authorization' for the JWT token
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests (required by CORS for non-simple requests like POST/PUT/DELETE)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Routes
// ----------------------------------------------------
// FIX 1: The imported router names were inconsistent. 
// FIX 2: You were connecting two different API paths to the SAME router.
// ----------------------------------------------------

// Connects the Auth API to /api/auth using the specific authRouter
app.use('/api/auth', authRouter); 

// Connects the Sweet Shop API to /api/sweets using the specific sweetRouter
app.use('/api/sweets', sweetRouter); 


// Basic health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Sweet Shop API is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`⚡️ [server]: Server is running at http://localhost:${PORT}`);
    console.log(`======================================================`);
});

export default app;
