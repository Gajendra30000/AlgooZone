import DsaSheet from '../models/DsaSheet.js';
import StudentSheetProgress from '../models/StudentSheetProgress.js';
import { logger } from '../utils/logger.js';

// Get list of all available sheets (just names for tabs)
export const getSheetsList = async (req, res) => {
    logger.info('SHEETS LIST REQUEST', 'Fetching all available sheets');
    try {
        const sheets = await DsaSheet.distinct('sheetName');
        logger.success('SHEETS FETCHED', `Found ${sheets.length} sheets`, { sheets });
        res.json(sheets);
    } catch (error) {
        logger.error('SHEETS LIST FAILED', error);
        res.status(500).json({ 
            message: 'Failed to fetch sheets list',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                errorMessage: error.message,
                errorCode: error.code,
                errorName: error.name
            } : undefined
        });
    }
};

// Get content of a specific sheet
export const getSheetContent = async (req, res) => {
    const { sheetName } = req.params;
    logger.info('SHEET CONTENT REQUEST', `Fetching content for sheet: ${sheetName}`);
    try {
        // Group by topic
        const sheetData = await DsaSheet.find({ sheetName });
        
        if (!sheetData.length) {
            logger.warn('SHEET NOT FOUND', `Sheet with name "${sheetName}" does not exist in database`);
            return res.status(404).json({ 
                message: `Sheet "${sheetName}" not found`,
                details: { requestedSheet: sheetName }
            });
        }

        logger.success('SHEET CONTENT FETCHED', `Found ${sheetData.length} topics in ${sheetName}`, { 
            topicCount: sheetData.length,
            totalProblems: sheetData.reduce((sum, item) => sum + (item.problems?.length || 0), 0)
        });
        res.json(sheetData);
    } catch (error) {
        logger.error('SHEET CONTENT FAILED', error, { sheetName });
        res.status(500).json({ 
            message: 'Failed to fetch sheet content',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                errorMessage: error.message,
                errorCode: error.code,
                sheetName: sheetName
            } : undefined
        });
    }
};

// Get progress for a student
export const getStudentProgress = async (req, res) => {
    const { sheetName } = req.params;
    const studentId = req.user.id; // From auth middleware

    logger.info('STUDENT PROGRESS REQUEST', `Fetching progress for student: ${studentId}, sheet: ${sheetName}`);
    try {
        if (!studentId) {
            logger.warn('STUDENT ID MISSING', 'No student ID found in auth context');
            return res.status(401).json({ message: 'Not authenticated. Student ID required.' });
        }

        const progress = await StudentSheetProgress.find({ studentId, sheetName });
        logger.success('STUDENT PROGRESS FETCHED', `Found ${progress.length} progress records`, { 
            studentId,
            sheetName,
            recordCount: progress.length
        });
        res.json(progress);
    } catch (error) {
        logger.error('STUDENT PROGRESS FAILED', error, { studentId, sheetName });
        res.status(500).json({ 
            message: 'Failed to fetch student progress',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                errorMessage: error.message,
                errorCode: error.code
            } : undefined
        });
    }
};

// Update progress (toggle completion)
export const updateProgress = async (req, res) => {
    const { sheetName, topic, problemId } = req.body;
    const studentId = req.user.id;

    logger.info('PROGRESS UPDATE REQUEST', `Updating progress for student: ${studentId}`, { 
        sheetName, 
        topic, 
        problemId 
    });

    try {
        if (!studentId) {
            logger.warn('UPDATE PROGRESS AUTH FAILED', 'No student ID in auth context');
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!sheetName || !topic || !problemId) {
            logger.warn('UPDATE PROGRESS VALIDATION FAILED', 'Missing required fields', { 
                hasSheet: !!sheetName,
                hasTopic: !!topic,
                hasProblemId: !!problemId
            });
            return res.status(400).json({ 
                message: 'Missing required fields: sheetName, topic, problemId',
                details: { sheetName: !!sheetName, topic: !!topic, problemId: !!problemId }
            });
        }

        // Find existing progress doc or create one
        let progressDoc = await StudentSheetProgress.findOne({ studentId, sheetName, topic });

        if (!progressDoc) {
            logger.debug('CREATE PROGRESS DOC', `Creating new progress document for ${studentId}`);
            progressDoc = new StudentSheetProgress({
                studentId,
                sheetName,
                topic,
                completedProblems: [problemId]
            });
        } else {
            const index = progressDoc.completedProblems.indexOf(problemId);
            if (index > -1) {
                logger.debug('REMOVE PROBLEM', `Removing problem ${problemId} from progress`);
                progressDoc.completedProblems.splice(index, 1);
            } else {
                logger.debug('ADD PROBLEM', `Adding problem ${problemId} to progress`);
                progressDoc.completedProblems.push(problemId);
            }
        }

        await progressDoc.save();
        logger.success('PROGRESS UPDATED', `Saved progress for problem: ${problemId}`, { 
            totalCompleted: progressDoc.completedProblems.length
        });
        res.json(progressDoc);
    } catch (error) {
        logger.error('PROGRESS UPDATE FAILED', error, { studentId, sheetName, problemId });
        res.status(500).json({ 
            message: 'Failed to update progress',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                errorMessage: error.message,
                errorCode: error.code
            } : undefined
        });
    }
};

// Admin: Get all students progress for a sheet
export const getAllStudentsProgress = async (req, res) => {
    const { sheetName } = req.params;
    logger.info('ADMIN PROGRESS REQUEST', `Fetching all students progress for sheet: ${sheetName}`);
    try {
        const allProgress = await StudentSheetProgress.find({ sheetName }).populate('studentId', 'name year');
        logger.success('ALL STUDENTS PROGRESS FETCHED', `Found ${allProgress.length} student progress records`, { 
            sheetName,
            recordCount: allProgress.length
        });
        res.json(allProgress);
    } catch (error) {
        logger.error('ALL STUDENTS PROGRESS FAILED', error, { sheetName });
        res.status(500).json({ 
            message: 'Failed to fetch all students progress',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                errorMessage: error.message,
                errorCode: error.code
            } : undefined
        });
    }
};
