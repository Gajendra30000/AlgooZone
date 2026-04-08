import mongoose from 'mongoose';

const studentSheetProgressSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    sheetName: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    completedProblems: [{ type: String }], // Array of problemIds
}, { timestamps: true });

// Ensure one progress document per student per sheet per topic for efficient updating
studentSheetProgressSchema.index({ studentId: 1, sheetName: 1, topic: 1 }, { unique: true });

export default mongoose.model('StudentSheetProgress', studentSheetProgressSchema);
