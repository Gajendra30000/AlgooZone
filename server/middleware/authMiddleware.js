import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Admin from '../models/Admin.js';
import { logger } from '../utils/logger.js';

export const protect = async (req, res, next) => {
    let token;
    const startTime = Date.now();

    logger.info('AUTH MIDDLEWARE', `${req.method} ${req.path}`);

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            if (!token) {
                logger.warn('EMPTY TOKEN', 'Token present in header but empty');
                return res.status(401).json({ 
                    message: 'Not authorized, no token provided',
                    error: 'Empty token in Authorization header'
                });
            }

            logger.debug('TOKEN VERIFY', `Starting verification for token: ${token.substring(0, 20)}...`);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            logger.debug('TOKEN DECODED', `Token decoded successfully. User ID: ${decoded.id}, Role: ${decoded.role}`);

            if (decoded.role === 'admin') {
                req.user = { id: decoded.id, role: 'admin' };
                logger.success('ADMIN AUTH', `Admin access granted for ID: ${decoded.id}`);
            } else {
                logger.debug('STUDENT LOOKUP', `Looking up student with ID: ${decoded.id}`);
                const student = await Student.findById(decoded.id).select('-passwordHash');
                
                if (!student) {
                    logger.warn('STUDENT NOT FOUND', `Student ID in token does not exist: ${decoded.id}`);
                    return res.status(401).json({ 
                        message: 'User not found in database',
                        error: 'Invalid token - user does not exist in database'
                    });
                }
                req.user = student;
                logger.success('STUDENT AUTH', `Student access granted: ${student.registrationNumber}`, { 
                    duration: `${Date.now() - startTime}ms` 
                });
            }

            next();
        } catch (error) {
            logger.error('TOKEN VERIFICATION FAILED', error, { 
                tokenPreview: token ? token.substring(0, 20) + '...' : 'None',
                duration: `${Date.now() - startTime}ms` 
            });
            
            let message = 'Not authorized, token failed';
            
            if (error.name === 'TokenExpiredError') {
                message = 'Token expired. Please login again.';
                logger.warn('TOKEN EXPIRED', 'The provided token has expired');
            } else if (error.name === 'JsonWebTokenError') {
                message = 'Invalid token. Please login again.';
                logger.warn('INVALID TOKEN', 'The provided token is invalid or malformed');
            } else if (error.name === 'NotBeforeError') {
                message = 'Token not yet valid.';
                logger.warn('TOKEN NOT YET VALID', 'The token nbf claim indicates it is not yet valid');
            }
            
            return res.status(401).json({ 
                message,
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? { 
                    name: error.name, 
                    message: error.message,
                    stack: error.stack 
                } : undefined
            });
        }
    } else {
        logger.warn('NO AUTH HEADER', `Missing Authorization header. Route: ${req.method} ${req.path}`);
        return res.status(401).json({ 
            message: 'Not authorized, no token',
            error: 'Missing Authorization header. Format: Bearer <token>'
        });
    }
};

export const admin = (req, res, next) => {
    logger.info('ADMIN CHECK', 'Verifying admin access');
    
    if (req.user && req.user.role === 'admin') {
        logger.success('ADMIN ACCESS GRANTED', `Admin privileges confirmed for ID: ${req.user.id}`);
        next();
    } else {
        logger.warn('ADMIN ACCESS DENIED', `User does not have admin role. Actual role: ${req.user?.role || 'none'}`);
        res.status(401).json({ 
            message: 'Not authorized as admin',
            error: 'Your account does not have admin privileges',
            userRole: req.user?.role || 'none'
        });
    }
};
