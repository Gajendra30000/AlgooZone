import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    platform: { type: String, required: true }, // 'Codeforces', 'LeetCode', 'CodeChef'
    startTime: { type: Date, required: true },
    durationSeconds: { type: Number },
    link: { type: String, required: true },
    status: { type: String } // 'UPCOMING', 'ONGOING', 'FINISHED'
}, { timestamps: true });

const Contest = mongoose.model('Contest', contestSchema);
export default Contest;
