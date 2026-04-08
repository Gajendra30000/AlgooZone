import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contestRoutes from './routes/contestRoutes.js';
import sheetsRoutes from './routes/sheetsRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';

import { startCronJob } from './services/cronJob.js';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', process.env.CLIENT_URL].filter(Boolean);
console.log('Allowed Origins:', allowedOrigins);
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/gemini', geminiRoutes);

// Serve Static Assets in production
if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientDistPath));

    app.get('*', (req, res, next) => {
        // If it's an API route that reached here, let it fall through to the API 404 handler
        if (req.originalUrl.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.resolve(clientDistPath, 'index.html'));
    });
} else {
    // Basic Route for dev
    app.get('/', (req, res) => {
        res.send('API is running in development mode...');
    });
}

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error('GLOBAL ERROR HANDLER', err, {
        route: `${req.method} ${req.originalUrl}`,
        statusCode: err.status || err.statusCode || 500,
        details: err.details
    });

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            details: err.details || null,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
            errorType: err.name || 'Unknown Error',
            errorCode: err.code || null,
            ...(process.env.NODE_ENV === 'production' ? {} : { 
                stack: err.stack,
                fullError: err
            })
        }
    });
});

// API 404 Handler (only for /api routes)
app.use('/api', (req, res) => {
    logger.warn('404 NOT FOUND', `API Route does not exist: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: {
            message: `API Route not found: ${req.method} ${req.originalUrl}`,
            timestamp: new Date().toISOString(),
            suggestion: 'Check the API endpoint. Common endpoints: /api/auth/login, /api/sheets, /api/student'
        }
    });
});


// Database Connection
const connectDB = async () => {
    try {
        logger.info('DATABASE CONNECT', 'Attempting to connect to MongoDB');
        
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set');
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        logger.success('DATABASE CONNECTED', `MongoDB connection established`, {
            host: conn.connection.host,
            database: conn.connection.db.name,
            port: conn.connection.port
        });
    } catch (error) {
        logger.error('DATABASE CONNECTION FAILED', error, {
            hasMongoUri: !!process.env.MONGO_URI,
            uriPreview: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 40) + '...' : 'NOT SET'
        });
        process.exit(1);
    }
};

// Start Server
app.listen(PORT, async () => {
    logger.info('SERVER STARTUP', `Starting server on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT
    });

    // Check environment variables
    const hasJwtSecret = !!process.env.JWT_SECRET;
    const hasMongoUri = !!process.env.MONGO_URI;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    if (!hasJwtSecret) logger.warn('MISSING ENV VAR', 'JWT_SECRET is not set');
    if (!hasMongoUri) logger.warn('MISSING ENV VAR', 'MONGO_URI is not set');
    if (!hasGeminiKey) logger.warn('MISSING ENV VAR', 'GEMINI_API_KEY is not set');

    await connectDB();
    startCronJob();
    
    logger.success('SERVER READY', 'Server fully initialized and ready to accept requests', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});
