import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import API_URL from '../config';
// Imports
import { UserPlus, User, Lock, BookOpen, Hash, AtSign, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SpotlightCard from '../components/SpotlightCard';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterYear, setFilterYear] = useState('All');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        registrationNumber: '',
        password: '',
        year: '',
        leetcodeUsername: ''
    });
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('dsa_token');
            const { data } = await axios.get(`${API_URL}/api/admin/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching students", error);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });

        try {
            await axios.post(`${API_URL}/api/auth/register`, formData);
            setMsg({ type: 'success', text: 'Student added successfully!' });
            setFormData({
                name: '',
                registrationNumber: '',
                password: '',
                year: '',
                leetcodeUsername: ''
            });
            fetchStudents();
        } catch (error) {
            setMsg({ type: 'error', text: error.response?.data?.message || 'Failed to add student' });
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent navigation when clicking delete
        if (!window.confirm("Are you sure you want to delete this student?")) return;

        try {
            const token = localStorage.getItem('dsa_token');
            await axios.delete(`${API_URL}/api/admin/students/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStudents();
        } catch (error) {
            alert("Failed to delete student");
        }
    };

    const filteredStudents = students.filter(student => {
        const matchYear = filterYear === 'All' || student.year.toString() === filterYear;
        return matchYear;
    });

    const uniqueYears = ['2', '3', '4'];

    const handleRefresh = async () => {
        if (!window.confirm("Trigger manual refresh for ALL students? This might take a few minutes.")) return;
        setMsg({ type: '', text: 'Starting refresh in background...' });

        try {
            const token = localStorage.getItem('dsa_token');
            const { data } = await axios.post(`${API_URL}/api/admin/refresh`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMsg({ type: 'success', text: data.message });
        } catch (error) {
            setMsg({ type: 'error', text: 'Failed to trigger refresh' });
        }
    };

    return (
        <div className="min-h-screen pt-20 px-4 md:px-10 pb-10">
            <Navbar />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* Left Col: Add Student Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-1"
                >
                    <SpotlightCard className="p-4 md:p-6 rounded-xl md:rounded-2xl md:sticky md:top-24">
                        <div className="flex items-center space-x-2 mb-4 md:mb-6 text-neon-cyan">
                            <UserPlus size={22} />
                            <h2 className="text-lg md:text-xl font-bold">Add Student</h2>
                        </div>

                        {msg.text && (
                            <div className={`p-3 rounded mb-4 text-xs md:text-sm ${msg.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {msg.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                                    <input
                                        type="text" name="name" value={formData.name} onChange={handleChange} required
                                        className="w-full bg-[#050511] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:border-neon-cyan outline-none transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs mb-1 ml-1">Registration Number</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                                    <input
                                        type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required
                                        className="w-full bg-[#050511] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:border-neon-cyan outline-none transition-colors"
                                        placeholder="2223CS101"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs mb-1 ml-1">Year</label>
                                <input
                                    type="number" name="year" value={formData.year} onChange={handleChange} required
                                    className="w-full bg-[#050511] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none transition-colors"
                                    placeholder="3"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs mb-1 ml-1">LeetCode Username</label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                                    <input
                                        type="text" name="leetcodeUsername" value={formData.leetcodeUsername} onChange={handleChange}
                                        className="w-full bg-[#050511] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:border-neon-cyan outline-none transition-colors"
                                        placeholder="leetcode_user"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs mb-1 ml-1">Initial Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                                    <input
                                        type="text" name="password" value={formData.password} onChange={handleChange} required
                                        className="w-full bg-[#050511] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:border-neon-cyan outline-none transition-colors"
                                        placeholder="Secret123"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg transition-colors shadow-[0_0_10px_rgba(0,243,255,0.3)] text-sm">
                                Add Student
                            </button>
                        </form>
                    </SpotlightCard>
                </motion.div>

                {/* Right Col: Student List */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-2"
                >
                    <SpotlightCard className="rounded-xl md:rounded-2xl overflow-hidden min-h-[400px] md:min-h-[500px] flex flex-col">
                        <div className="p-4 md:p-6 border-b border-gray-700/50 flex flex-col gap-3 md:gap-4">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-white">Registered Students</h2>
                                <span className="text-xs md:text-sm text-gray-400">{filteredStudents.length} Students</span>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                                <button
                                    onClick={handleRefresh}
                                    className="flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all text-xs md:text-sm font-medium"
                                >
                                    <RefreshCw size={16} />
                                    <span>Refresh</span>
                                </button>

                                <select
                                    className="bg-[#050511] border border-gray-700 rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:border-neon-cyan outline-none transition-all hover:border-cyan-400"
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                >
                                    <option value="All">All Years</option>
                                    {uniqueYears.map(y => <option key={y} value={y}>Year {y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-700/30 overflow-y-auto custom-scrollbar flex-1">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-10 md:py-20">
                                    <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
                                    <p className="text-gray-400 animate-pulse text-sm">Loading students...</p>
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="p-6 md:p-8 text-center text-gray-500 text-sm">No students found matching filters.</div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredStudents.map((student, index) => (
                                        <motion.div
                                            key={student._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: index < 15 ? index * 0.05 : 0 }}
                                            onClick={() => navigate(`/student/${student._id}`)}
                                            className="p-3 md:p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                <div className="w-9 md:w-10 h-9 md:h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-cyan-400 border border-gray-700 flex-shrink-0">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors text-sm truncate">{student.name}</p>
                                                    <div className="flex items-center flex-wrap gap-1 md:gap-3 text-xs text-gray-400">
                                                        <span className="truncate">{student.registrationNumber}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="hidden sm:inline">Y{student.year}</span>
                                                        {student.leetcodeUsername && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="text-cyan-600 hidden sm:inline truncate">@{student.leetcodeUsername}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, student._id)}
                                                className="ml-2 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                title="Delete student"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </SpotlightCard>
                </motion.div>

            </div>
        </div>
    );
};

export default AdminDashboard;
