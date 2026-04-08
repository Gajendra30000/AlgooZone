import Student from '../models/Student.js';

import { fetchAllStudentData } from '../services/leetcodeService.js';
import { calculateStreaks } from '../utils/streakCalculator.js';

export const getStudentProfile = async (req, res) => {
    try {
        let student = await Student.findById(req.user.id).select('-passwordHash');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Auto-refresh logic
        const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes
        const timeSinceLastUpdate = Date.now() - new Date(student.lastUpdated).getTime();

        if (student.leetcodeUsername && timeSinceLastUpdate > REFRESH_COOLDOWN) {
            // console.log(`Auto-refreshing data for ${student.name}...`);
            try {
                const data = await fetchAllStudentData(student.leetcodeUsername);

                // Update Stats
                if (data.stats) {
                    const submissionCalendar = data.stats.submissionCalendar || {};
                    const { currentStreak, maxStreak } = calculateStreaks(submissionCalendar);

                    student.stats = {
                        ...student.stats, // Preserve other fields like reputation if they exist
                        totalSolved: data.stats.totalSolved || 0,
                        easySolved: data.stats.easySolved || 0,
                        mediumSolved: data.stats.mediumSolved || 0,
                        hardSolved: data.stats.hardSolved || 0,
                        ranking: data.stats.ranking || 0,
                        submissionCalendar: submissionCalendar,
                        topics: data.topics ? data.topics.map(t => ({
                            tagName: t.tagName,
                            count: t.problemsSolved,
                            tagSlug: t.tagSlug
                        })) : []
                    };

                    student.streak = {
                        currentStreak,
                        maxStreak,
                        lastActiveDate: new Date()
                    };
                }

                // Update Recent Submissions
                if (data.submissions) {
                    student.recentSubmissions = data.submissions.map(sub => ({
                        title: sub.title,
                        titleSlug: sub.titleSlug,
                        timestamp: sub.timestamp,
                        statusDisplay: sub.statusDisplay // Map to schema if needed, schema says statusDisplay
                    }));
                }

                student.lastUpdated = Date.now();
                await student.save();
                // console.log(`Auto-refresh completed for ${student.name}`);
            } catch (err) {
                console.error(`Auto-refresh failed for ${student.name}:`, err.message);
                // Continue to return old data if refresh fails
            }
        }

        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('-passwordHash');
        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const { year } = req.query;
        let query = { leetcodeUsername: { $ne: null, $ne: "" } }; // Only show students with valid LeetCode

        if (year) query.year = year;

        const students = await Student.find(query)
            .select('name registrationNumber year stats.totalSolved stats.ranking')
            .sort({ 'stats.totalSolved': -1 }); // Descending order

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
