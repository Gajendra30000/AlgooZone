import Student from '../models/Student.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fetchAllStudentData } from '../services/leetcodeService.js';
import { logger } from '../utils/logger.js';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

import { calculateStreaks } from '../utils/streakCalculator.js';

export const registerStudent = async (req, res) => {
    const { registrationNumber, password, name, year, leetcodeUsername } = req.body;
    const startTime = Date.now();

    logger.info('REGISTRATION ATTEMPT', registrationNumber, { name, year, leetcodeUsername });

    try {
        // Validation
        if (!registrationNumber || !password || !name) {
            logger.warn('VALIDATION FAILED', 'Missing required fields', { 
                registrationNumber: !!registrationNumber, 
                password: !!password, 
                name: !!name 
            });
            return res.status(400).json({ 
                message: 'Missing required fields: registrationNumber, password, name',
                details: { registrationNumber: !!registrationNumber, password: !!password, name: !!name }
            });
        }

        const studentExists = await Student.findOne({ registrationNumber });
        if (studentExists) {
            logger.warn('DUPLICATE REGISTRATION', `Student already exists: ${registrationNumber}`);
            return res.status(400).json({ message: 'Registration number already exists' });
        }

        logger.debug('PASSWORD HASHING', 'Starting bcrypt hash with salt 10');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        logger.success('PASSWORD HASHED', 'Successfully hashed password');

        // Fetch initial stats if leetcode name provided
        let stats = {};
        let recentSubmissions = [];
        let streak = { currentStreak: 0, maxStreak: 0 };

        if (leetcodeUsername) {
            logger.info('LEETCODE FETCH', `Fetching data for: ${leetcodeUsername}`);
            const data = await fetchAllStudentData(leetcodeUsername);

            // Validate: If no stats returned (or totalSolved is undefined), username likely invalid
            if (!data.stats || data.stats.totalSolved === undefined) {
                logger.warn('INVALID LEETCODE', `LeetCode username does not exist or is invalid: ${leetcodeUsername}`);
                return res.status(400).json({ 
                    message: 'Invalid LeetCode Username. Please verify your LeetCode username is correct.',
                    details: { providedUsername: leetcodeUsername }
                });
            }

            if (data.stats) {
                const submissionCalendar = data.stats.submissionCalendar || {};
                const streaks = calculateStreaks(submissionCalendar);

                stats = {
                    totalSolved: data.stats.totalSolved || 0,
                    easySolved: data.stats.easySolved || 0,
                    mediumSolved: data.stats.mediumSolved || 0,
                    hardSolved: data.stats.hardSolved || 0,
                    ranking: data.stats.ranking || 0,
                    submissionCalendar,
                    topics: data.topics ? data.topics.map(t => ({
                        tagName: t.tagName,
                        count: t.problemsSolved,
                        tagSlug: t.tagSlug
                    })) : []
                };
                streak = {
                    currentStreak: streaks.currentStreak,
                    maxStreak: streaks.maxStreak,
                    lastActiveDate: new Date()
                };
                logger.success('LEETCODE DATA FETCHED', `Stats retrieved`, { 
                    totalSolved: stats.totalSolved, 
                    ranking: stats.ranking 
                });
            }
            if (data.submissions) {
                recentSubmissions = data.submissions.map(sub => ({
                    title: sub.title,
                    timestamp: sub.timestamp,
                    status: sub.statusDisplay
                }));
            }
        } else {
            logger.warn('MISSING LEETCODE', 'LeetCode username is required for registration');
            return res.status(400).json({ message: 'LeetCode Username is required. Please provide a valid LeetCode username.' });
        }

        logger.debug('DB CREATE', `Creating student document for: ${registrationNumber}`);
        const student = await Student.create({
            registrationNumber,
            passwordHash,
            name,
            year,
            leetcodeUsername,
            stats,
            streak,
            recentSubmissions
        });

        const token = generateToken(student._id, 'student');
        const duration = Date.now() - startTime;
        logger.success('REGISTRATION SUCCESS', `Student registered: ${registrationNumber}`, { duration: `${duration}ms` });

        if (student) {
            res.status(201).json({
                _id: student._id,
                registrationNumber: student.registrationNumber,
                name: student.name,
                stats: student.stats,
                recentSubmissions: student.recentSubmissions,
                token: token
            });
        }
    } catch (error) {
        logger.error('REGISTRATION FAILED', error, { 
            registrationNumber,
            leetcodeUsername,
            duration: `${Date.now() - startTime}ms` 
        });
        
        let statusCode = 500;
        let message = error.message;
        
        if (error.code === 11000) {
            statusCode = 400;
            message = 'Registration number already exists in database. This is a duplicate key error.';
        } else if (error.name === 'ValidationError') {
            statusCode = 400;
            message = `Validation Error: ${error.message}`;
        } else if (error.message.includes('ECONNREFUSED')) {
            statusCode = 503;
            message = 'Database connection failed. Please try again later.';
        }

        res.status(statusCode).json({ 
            message,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                errorMessage: error.message,
                errorCode: error.code,
                errorName: error.name,
                stack: error.stack
            } : undefined
        });
    }
};

export const loginStudent = async (req, res) => {
    const { registrationNumber, password } = req.body;
    const startTime = Date.now();

    logger.info('LOGIN ATTEMPT', registrationNumber);

    try {
        // Validation
        if (!registrationNumber || !password) {
            logger.warn('VALIDATION FAILED', 'Missing credentials', { 
                hasRegNum: !!registrationNumber, 
                hasPassword: !!password 
            });
            return res.status(400).json({ 
                message: 'Please provide both registration number and password',
                details: { registrationNumber: !!registrationNumber, password: !!password }
            });
        }

        logger.debug('DB QUERY', `Searching for student: ${registrationNumber}`);
        const student = await Student.findOne({ registrationNumber });

        if (!student) {
            logger.warn('STUDENT NOT FOUND', `Registration ID does not exist: ${registrationNumber}`);
            return res.status(401).json({ message: 'Invalid Library ID or Password' });
        }

        logger.debug('PASSWORD CHECK', `Comparing passwords for: ${registrationNumber}`);
        const isPasswordValid = await bcrypt.compare(password, student.passwordHash);
        
        if (!isPasswordValid) {
            logger.warn('INVALID PASSWORD', `Wrong password attempted for: ${registrationNumber}`);
            return res.status(401).json({ message: 'Invalid Library ID or Password' });
        }

        const token = generateToken(student._id, 'student');
        const duration = Date.now() - startTime;
        logger.success('LOGIN SUCCESSFUL', `${registrationNumber} logged in`, { duration: `${duration}ms` });
        
        res.json({
            _id: student._id,
            registrationNumber: student.registrationNumber,
            name: student.name,
            leetcodeUsername: student.leetcodeUsername,
            stats: student.stats,
            recentSubmissions: student.recentSubmissions,
            token: token
        });
    } catch (error) {
        logger.error('LOGIN FAILED', error, { 
            registrationNumber,
            duration: `${Date.now() - startTime}ms` 
        });

        res.status(500).json({ 
            message: 'Login failed. Please try again.',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                errorMessage: error.message,
                errorCode: error.code,
                errorName: error.name,
                stack: error.stack
            } : undefined
        });
    }
};

export const loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    const startTime = Date.now();
    
    logger.info('ADMIN LOGIN ATTEMPT', username);
    logger.debug('ADMIN_SECRET DEBUG', `ADMIN_SECRET value: ${process.env.ADMIN_SECRET ? 'SET' : 'NOT SET'}`);
    logger.debug('PASSWORD CHECK', `Comparing password: "${password}" with ADMIN_SECRET`);

    try {
        if (!username || !password) {
            logger.warn('ADMIN VALIDATION FAILED', 'Missing credentials', { 
                hasUsername: !!username, 
                hasPassword: !!password 
            });
            return res.status(400).json({ 
                message: 'Please provide both username and password' 
            });
        }

        logger.debug('ADMIN DB QUERY', `Searching for admin: ${username}`);
        const admin = await Admin.findOne({ username });

        if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
            const token = generateToken(admin._id, 'admin');
            const duration = Date.now() - startTime;
            logger.success('ADMIN LOGIN SUCCESS', `Admin logged in: ${username}`, { duration: `${duration}ms` });
            
            return res.json({
                _id: admin._id,
                username: admin.username,
                token: token
            });
        }

        // Fallback for demo/development
        logger.debug('FALLBACK CHECK', `Checking if password matches ADMIN_SECRET...`);
        if (password === process.env.ADMIN_SECRET) {
            logger.success('MASTER ADMIN LOGIN', 'Using environment secret for admin access');
            return res.json({
                _id: "master-admin",
                username: "Master Admin",
                token: generateToken("master-admin", 'admin')
            });
        }

        logger.warn('ADMIN AUTH FAILED', `Invalid credentials for admin: ${username}`);
        res.status(401).json({ message: 'Invalid Admin Credentials' });
    } catch (error) {
        logger.error('ADMIN LOGIN FAILED', error, { 
            username,
            duration: `${Date.now() - startTime}ms` 
        });

        res.status(500).json({ 
            message: 'Admin login failed',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                errorMessage: error.message,
                errorCode: error.code,
                errorName: error.name
            } : undefined
        });
    }
};
