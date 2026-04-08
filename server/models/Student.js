import mongoose from 'mongoose';

const recentSubmissionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    titleSlug: { type: String },
    timestamp: { type: String }, // Unix timestamp or ISO string
    statusDisplay: { type: String }, // e.g., "Accepted"
    lang: { type: String }
});

const studentSchema = new mongoose.Schema({
    registrationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    year: {
        type: Number
    },
    leetcodeUsername: {
        type: String,
        default: ""
    },
    stats: {
        totalSolved: { type: Number, default: 0 },
        easySolved: { type: Number, default: 0 },
        mediumSolved: { type: Number, default: 0 },
        hardSolved: { type: Number, default: 0 },
        ranking: { type: Number, default: 0 },
        contributionPoints: { type: Number, default: 0 },
        reputation: { type: Number, default: 0 },
        submissionCalendar: { type: Object, default: {} },
        topics: [{
            tagName: String,
            count: Number,
            tagSlug: String
        }]
    },
    recentSubmissions: [recentSubmissionSchema],
    streak: {
        currentStreak: { type: Number, default: 0 },
        maxStreak: { type: Number, default: 0 },
        lastActiveDate: { type: Date },
        // Simple heatmap representation could be an array of dates or a dedicated object
        activity: [{ date: String, count: Number }]
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    aiProgressAnalysis: {
        weakTopics: [String],
        strongTopics: [String],
        improvementPlan: String,
        suggestions: [String],
        summary: String,
        lastAnalyzedAt: Date
    }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
