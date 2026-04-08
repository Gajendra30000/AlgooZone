import Student from '../models/Student.js';

export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({}).select('-passwordHash');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import { updateAllStudents } from '../services/cronJob.js';

export const refreshAllStudents = async (req, res) => {
    try {
        // Trigger update in background to avoid timeout
        updateAllStudents();
        res.json({ message: 'Refresh started in background. Data will update shortly.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
