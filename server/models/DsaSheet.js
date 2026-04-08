import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
    problemId: { type: String, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    link: { type: String, required: true }
});

const dsaSheetSchema = new mongoose.Schema({
    sheetName: { type: String, required: true, index: true }, // "Striver A2Z", "Blind 75", "Love Babbar 450"
    topic: { type: String, required: true }, // "Arrays", "Graphs", etc.
    problems: [problemSchema]
}, { timestamps: true });

// Compound index to ensure uniqueness of topic within a sheet
dsaSheetSchema.index({ sheetName: 1, topic: 1 }, { unique: true });

export default mongoose.model('DsaSheet', dsaSheetSchema);
