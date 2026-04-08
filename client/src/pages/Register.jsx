import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { User, Lock, Hash, AtSign, BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        registrationNumber: '',
        password: '',
        year: '',
        leetcodeUsername: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorDetails, setErrorDetails] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: '' });
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.name.trim()) {
            errors.name = 'Full name is required';
        }
        
        if (!formData.registrationNumber.trim()) {
            errors.registrationNumber = 'Registration number is required';
        }
        
        if (!formData.password || formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        
        if (!formData.year) {
            errors.year = 'Year is required';
        }
        
        if (!formData.leetcodeUsername.trim()) {
            errors.leetcodeUsername = 'LeetCode username is required';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorDetails('');
        
        console.log('📋 REGISTRATION ATTEMPT:', { 
            name: formData.name, 
            registrationNumber: formData.registrationNumber,
            year: formData.year,
            leetcodeUsername: formData.leetcodeUsername 
        });

        // Validate form
        if (!validateForm()) {
            console.warn('❌ FORM VALIDATION FAILED');
            setError('Please fill in all required fields correctly');
            return;
        }

        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/api/auth/register`, formData);
            console.log('✅ REGISTRATION SUCCESS');
            // Save token and redirect
            localStorage.setItem('dsa_token', data.token);
            localStorage.setItem('dsa_user', JSON.stringify(data));
            window.location.href = '/dashboard';
        } catch (err) {
            console.error('❌ REGISTRATION ERROR:');
            console.error('Status:', err.response?.status);
            console.error('Data:', err.response?.data);
            console.error('Full Error:', err);

            let errorMessage = 'Registration failed. Please try again.';
            let details = '';

            if (err.response?.status === 400) {
                errorMessage = err.response?.data?.message || 'Invalid input provided';
                details = err.response?.data?.error || '';
                
                // Check for specific error types
                if (errorMessage.includes('LeetCode')) {
                    details = 'Make sure your LeetCode username is correct and publicly visible.';
                } else if (errorMessage.includes('already exists')) {
                    details = 'This registration number is already in use.';
                }
            } else if (err.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
                details = err.response?.data?.error || '';
            } else if (err.code === 'ERR_NETWORK') {
                errorMessage = 'Cannot connect to server';
                details = `Make sure the backend is running on ${API_URL}`;
            } else if (err.message === 'Network Error') {
                errorMessage = 'Network error occurred';
                details = 'Check your internet connection and backend server status';
            }

            setError(errorMessage);
            setErrorDetails(details);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="glass-card w-full p-8 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,243,255,0.1)]">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white neon-text-cyan">Student Registration</h1>
                        <p className="text-gray-400 mt-2">Join the DSA Leaderboard</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
                        >
                            <div className="flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-red-200 font-semibold text-sm">{error}</p>
                                    {errorDetails && (
                                        <p className="text-red-300 text-xs mt-1 opacity-80">{errorDetails}</p>
                                    )}
                                    {error.includes('Cannot connect') && (
                                        <div className="mt-2 text-xs text-red-300 bg-red-900/30 p-2 rounded">
                                            💡 Backend should be running on port 5000
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div className="relative group">
                            <User className="absolute left-3 top-3 text-cyan-500 w-5 h-5 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={loading}
                                className={`w-full bg-[#050511] border ${fieldErrors.name ? 'border-red-500' : 'border-gray-700'} rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all disabled:opacity-50`}
                            />
                            {fieldErrors.name && (
                                <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>
                            )}
                        </div>

                        {/* Registration Number */}
                        <div className="relative group">
                            <Hash className="absolute left-3 top-3 text-cyan-500 w-5 h-5 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="text"
                                name="registrationNumber"
                                placeholder="Registration Number (e.g. 2045pg)"
                                value={formData.registrationNumber}
                                onChange={handleChange}
                                disabled={loading}
                                className={`w-full bg-[#050511] border ${fieldErrors.registrationNumber ? 'border-red-500' : 'border-gray-700'} rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all disabled:opacity-50`}
                            />
                            {fieldErrors.registrationNumber && (
                                <p className="text-red-400 text-xs mt-1">{fieldErrors.registrationNumber}</p>
                            )}
                        </div>

                        {/* Year */}
                        <div className="relative group">
                            <BookOpen className="absolute left-3 top-3 text-cyan-500 w-5 h-5 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="number"
                                name="year"
                                placeholder="Year (2/3/4)"
                                value={formData.year}
                                onChange={handleChange}
                                disabled={loading}
                                min="1"
                                max="4"
                                className={`w-full bg-[#050511] border ${fieldErrors.year ? 'border-red-500' : 'border-gray-700'} rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all disabled:opacity-50`}
                            />
                            {fieldErrors.year && (
                                <p className="text-red-400 text-xs mt-1">{fieldErrors.year}</p>
                            )}
                        </div>

                        {/* LeetCode User */}
                        <div className="relative group">
                            <AtSign className="absolute left-3 top-3 text-cyan-500 w-5 h-5 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="text"
                                name="leetcodeUsername"
                                placeholder="LeetCode Username (must be public)"
                                value={formData.leetcodeUsername}
                                onChange={handleChange}
                                disabled={loading}
                                className={`w-full bg-[#050511] border ${fieldErrors.leetcodeUsername ? 'border-red-500' : 'border-gray-700'} rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all disabled:opacity-50`}
                            />
                            {fieldErrors.leetcodeUsername && (
                                <p className="text-red-400 text-xs mt-1">{fieldErrors.leetcodeUsername}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">💡 Your LeetCode profile must be public</p>
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 text-cyan-500 w-5 h-5 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password (min 6 characters)"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                className={`w-full bg-[#050511] border ${fieldErrors.password ? 'border-red-500' : 'border-gray-700'} rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all disabled:opacity-50`}
                            />
                            {fieldErrors.password && (
                                <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Profile...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-400">
                        Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4">Login here</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
