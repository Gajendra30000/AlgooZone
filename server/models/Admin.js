import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'admin' // could be 'teacher', 'hod', 'admin'
    }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
