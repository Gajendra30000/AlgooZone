import nodeCron from 'node-cron';
import Student from '../models/Student.js';
import { fetchAllStudentData } from './leetcodeService.js';
import { calculateStreaks } from '../utils/streakCalculator.js';

const updateAllStudents = async () => {
    console.log('Running Cron Job: Updating Student Stats...');
    const students = await Student.find({ leetcodeUsername: { $ne: "" } });

    for (const student of students) {
        console.log(`Updating ${student.name}...`);
        const data = await fetchAllStudentData(student.leetcodeUsername);

        if (data.stats) {
            const submissionCalendar = data.stats.submissionCalendar || {};
            const { currentStreak, maxStreak } = calculateStreaks(submissionCalendar);

            student.stats = {
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
        } else {
            console.error(`Failed to fetch stats for ${student.name} (${student.leetcodeUsername})`);
        }

        if (data.submissions) {
            student.recentSubmissions = data.submissions.map(sub => ({
                title: sub.title,
                titleSlug: sub.titleSlug,
                timestamp: sub.timestamp,
                status: sub.statusDisplay
            }));
        }

        student.lastUpdated = Date.now();
        await student.save();
    }
    console.log('Cron Job Completed.');
};

// Run every 4 hours
// '0 */4 * * *'
export const startCronJob = () => {
    nodeCron.schedule('*/20 * * * *', updateAllStudents);
    console.log('Cron Job scheduled: Every 20 minutes.');
};

// Export for manual trigger if needed
export { updateAllStudents };
